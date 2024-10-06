import { isDefined, TXIDVersion } from "@railgun-community/shared-models";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TransactionType } from "../../models/transaction";
import { useReduxSelector } from "../hooks-redux";

export const useRailgunFees = (
  transactionType: TransactionType,
  isFullyPrivateTransaction: boolean = false
) => {
  const { network } = useReduxSelector("network");
  const { txidVersion } = useReduxSelector("txidVersion");

  const [calculateFeesError, setCalculateFeesError] =
    useState<Optional<Error>>();

  const [shieldFeeV2, setShieldFeeV2] = useState(
    network.current.feesSerialized?.shieldFeeV2 ?? "0"
  );
  const [unshieldFeeV2, setUnshieldFeeV2] = useState(
    network.current.feesSerialized?.unshieldFeeV2 ?? "0"
  );
  const [shieldFeeV3, setShieldFeeV3] = useState(
    network.current.feesSerialized?.shieldFeeV3 ?? "0"
  );
  const [unshieldFeeV3, setUnshieldFeeV3] = useState(
    network.current.feesSerialized?.unshieldFeeV3 ?? "0"
  );

  const needsFees = useCallback(() => {
    switch (transactionType) {
      case TransactionType.Shield:
      case TransactionType.Unshield:
        return true;
      case TransactionType.Send:
      case TransactionType.FarmDeposit:
      case TransactionType.FarmRedeem:
      case TransactionType.AddLiquidity:
      case TransactionType.RemoveLiquidity:
      case TransactionType.Swap:
        return isFullyPrivateTransaction;
      case TransactionType.ApproveShield:
      case TransactionType.ApproveSpender:
      case TransactionType.Cancel:
      case TransactionType.Mint:
        return false;
    }
  }, [isFullyPrivateTransaction, transactionType]);

  const noFeesFound = useCallback(() => {
    if (needsFees()) {
      setCalculateFeesError(
        new Error(
          "Cannot calculate fees for this network. Please reload your app."
        )
      );
    }
  }, [needsFees]);

  useEffect(() => {
    if (!network.current.feesSerialized) {
      noFeesFound();
      return;
    }
    setCalculateFeesError(undefined);
    setShieldFeeV2(network.current.feesSerialized.shieldFeeV2);
    setUnshieldFeeV2(network.current.feesSerialized.unshieldFeeV2);
    if (isDefined(network.current.feesSerialized.shieldFeeV3)) {
      setShieldFeeV3(network.current.feesSerialized.shieldFeeV3);
    }
    if (isDefined(network.current.feesSerialized.unshieldFeeV3)) {
      setUnshieldFeeV3(network.current.feesSerialized.unshieldFeeV3);
    }
  }, [network, transactionType, isFullyPrivateTransaction, noFeesFound]);

  const shieldFee = useMemo(() => {
    switch (txidVersion.current) {
      case TXIDVersion.V2_PoseidonMerkle:
        return shieldFeeV2;
      case TXIDVersion.V3_PoseidonMerkle:
        return shieldFeeV3;
    }
  }, [shieldFeeV2, shieldFeeV3, txidVersion]);

  const unshieldFee = useMemo(() => {
    switch (txidVersion.current) {
      case TXIDVersion.V2_PoseidonMerkle:
        return unshieldFeeV2;
      case TXIDVersion.V3_PoseidonMerkle:
        return unshieldFeeV3;
    }
  }, [unshieldFeeV2, unshieldFeeV3, txidVersion]);

  return {
    shieldFee,
    unshieldFee,
    calculateFeesError,
  };
};
