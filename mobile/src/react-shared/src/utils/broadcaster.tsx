import {
  CachedTokenFee,
  SelectedBroadcaster,
} from '@railgun-community/shared-models';
import { SharedConstants } from '../config';
import { valuesWithinThresholdBigNumber } from './util';

const FEE_REFRESH_BEFORE_EXPIRATION_BUFFER = 20000;
const FEE_EXPIRATION_MINIMUM_MSEC = 40000;

export const DEFAULT_BROADCASTER_IDENTIFIER = 'default';

const isCachedFeeAboutToExpire = (cachedFee: CachedTokenFee) => {
  const feeReplacementCutoff =
    Date.now() +
    FEE_EXPIRATION_MINIMUM_MSEC +
    FEE_REFRESH_BEFORE_EXPIRATION_BUFFER;

  return cachedFee.expiration < feeReplacementCutoff;
};

export const shouldReplaceCurrentBroadcaster = (
  newBroadcaster: SelectedBroadcaster,
  currentBroadcaster: Optional<SelectedBroadcaster>,
) => {
  let feesChangedSignificantly = true;
  if (currentBroadcaster) {
    const oldFee = BigInt(currentBroadcaster.tokenFee.feePerUnitGas);
    const newFee = BigInt(newBroadcaster.tokenFee.feePerUnitGas);

    feesChangedSignificantly =
      newFee > oldFee ||
      !valuesWithinThresholdBigNumber(
        oldFee,
        newFee,
        SharedConstants.BROADCASTER_FEE_CHANGE_THRESHOLD,
      );
  }

  const newBroadcasterHasBetterFees =
    newBroadcaster.railgunAddress !== currentBroadcaster?.railgunAddress &&
    feesChangedSignificantly;

  return (
    !currentBroadcaster ||
    newBroadcasterHasBetterFees ||
    newBroadcaster.tokenAddress !== currentBroadcaster.tokenAddress ||
    isCachedFeeAboutToExpire(currentBroadcaster.tokenFee)
  );
};
