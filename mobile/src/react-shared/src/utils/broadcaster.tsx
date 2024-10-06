import {
  CachedTokenFee,
  SelectedBroadcaster,
} from "@railgun-community/shared-models";
import { SharedConstants } from "../config";
import { valuesWithinThresholdBigNumber } from "./util";

const FEE_REFRESH_BEFORE_EXPIRATION_BUFFER = 20000;
const FEE_EXPIRATION_MINIMUM_MSEC = 40000;

export const DEFAULT_BROADCASTER_IDENTIFIER = "default";

const isCachedFeeAboutToExpire = (cachedFee: CachedTokenFee) => {
  const feeReplacementCutoff =
    Date.now() +
    FEE_EXPIRATION_MINIMUM_MSEC +
    FEE_REFRESH_BEFORE_EXPIRATION_BUFFER;

  return cachedFee.expiration < feeReplacementCutoff;
};

export const shouldReplaceCurrentBroadcaster = (
  newBroadcaster: SelectedBroadcaster,
  currentBroadcaster: Optional<SelectedBroadcaster>
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
        SharedConstants.BROADCASTER_FEE_CHANGE_THRESHOLD
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

export const sortBroadcasters = (broadcasters?: SelectedBroadcaster[]) => {
  if (!broadcasters) {
    return undefined;
  }

  const sorted = broadcasters.sort((a, b) => {
    // eslint-disable-next-line radix
    const tokenFeeDiff = parseInt(
      (
        BigInt(a.tokenFee.feePerUnitGas) - BigInt(b.tokenFee.feePerUnitGas)
      ).toString()
    );
    const reliability = b.tokenFee.reliability - a.tokenFee.reliability;

    if (a.tokenFee.reliability === b.tokenFee.reliability) {
      return tokenFeeDiff;
    }
    if (reliability >= 0 && tokenFeeDiff < 0) {
      return -1;
    }
    if (reliability < 0 && tokenFeeDiff >= 0) {
      return 1;
    }
    return reliability;
  });

  return sorted;
};

export const renderBroadcasterReliability = (reliability: number) => {
  if (reliability > 0.8) {
    return "🟢";
  }
  if (reliability > 0.5) {
    return "🟡";
  }
  if (reliability > 0.3) {
    return "🟠";
  }

  if (reliability > 0) {
    return "🔴";
  }

  return "⚪️";
};
