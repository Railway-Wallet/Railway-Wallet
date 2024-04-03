import {
  CachedTokenFee,
  SelectedRelayer,
} from '@railgun-community/shared-models';
import { SharedConstants } from '../config';
import { valuesWithinThresholdBigNumber } from './util';

const FEE_REFRESH_BEFORE_EXPIRATION_BUFFER = 20000;
const FEE_EXPIRATION_MINIMUM_MSEC = 40000;

export const DEFAULT_RELAYER_IDENTIFIER = 'default';

const isCachedFeeAboutToExpire = (cachedFee: CachedTokenFee) => {
  const feeReplacementCutoff =
    Date.now() +
    FEE_EXPIRATION_MINIMUM_MSEC +
    FEE_REFRESH_BEFORE_EXPIRATION_BUFFER;

  return cachedFee.expiration < feeReplacementCutoff;
};

export const shouldReplaceCurrentRelayer = (
  newRelayer: SelectedRelayer,
  currentRelayer: Optional<SelectedRelayer>,
) => {
  let feesChangedSignificantly = true;
  if (currentRelayer) {
    const oldFee = BigInt(currentRelayer.tokenFee.feePerUnitGas);
    const newFee = BigInt(newRelayer.tokenFee.feePerUnitGas);

    feesChangedSignificantly =
      newFee > oldFee ||
      !valuesWithinThresholdBigNumber(
        oldFee,
        newFee,
        SharedConstants.RELAYER_FEE_CHANGE_THRESHOLD,
      );
  }

  const newRelayerHasBetterFees =
    newRelayer.railgunAddress !== currentRelayer?.railgunAddress &&
    feesChangedSignificantly;

  return (
    !currentRelayer ||
    newRelayerHasBetterFees ||
    newRelayer.tokenAddress !== currentRelayer.tokenAddress ||
    isCachedFeeAboutToExpire(currentRelayer.tokenFee)
  );
};
