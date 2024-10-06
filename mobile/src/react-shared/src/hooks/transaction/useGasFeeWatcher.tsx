import {
  calculateMaximumGas,
  isDefined,
  TransactionGasDetails,
} from "@railgun-community/shared-models";
import { useEffect, useMemo, useState } from "react";

export const useGasFeeWatcher = (
  gasDetails: Optional<TransactionGasDetails>,
  selectedBroadcasterLocked: boolean,
  changeThresholdBasisPoints: number
) => {
  const [savedMaximumGasThreshold, setSavedMaximumGasThreshold] =
    useState<Optional<bigint>>();

  useEffect(() => {
    if (selectedBroadcasterLocked && gasDetails) {
      const maximumGas = calculateMaximumGas(gasDetails);
      const threshold =
        maximumGas * 10000n + BigInt(changeThresholdBasisPoints) / 10000n;
      setSavedMaximumGasThreshold(threshold);
      return;
    }
    setSavedMaximumGasThreshold(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBroadcasterLocked]);

  const gasPriceChangedByThreshold: boolean = useMemo(() => {
    if (!isDefined(savedMaximumGasThreshold) || !gasDetails) {
      return false;
    }
    const maximumGas = calculateMaximumGas(gasDetails);
    if (maximumGas >= savedMaximumGasThreshold) {
      return true;
    }
    return false;
  }, [gasDetails, savedMaximumGasThreshold]);

  return {
    gasPriceChangedByThreshold,
  };
};
