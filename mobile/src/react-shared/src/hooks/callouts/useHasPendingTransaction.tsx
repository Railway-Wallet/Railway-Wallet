import { isDefined } from "@railgun-community/shared-models";
import { useMemo } from "react";
import { AvailableWallet } from "../../models";
import { hasPendingPublicTransaction } from "../../utils/saved-transactions";
import { useReduxSelector } from "../hooks-redux";

export const useHasPendingTransaction = (
  publicWalletOverride: Optional<AvailableWallet>,
  fromWalletAddress: string,
  isShieldedFromAddress: boolean,
  excludeTxid: Optional<string>
) => {
  const { network } = useReduxSelector("network");
  const { savedTransactions } = useReduxSelector("savedTransactions");

  const hasPendingTransaction = useMemo(() => {
    const visibleTransactions =
      savedTransactions.forNetwork[network.current.name];
    if (!isDefined(visibleTransactions)) {
      return false;
    }

    const filteredTransactions = visibleTransactions.filter(
      (tx) => tx.id !== excludeTxid
    );

    const publicWalletAddress =
      publicWalletOverride?.ethAddress ??
      (!isShieldedFromAddress ? fromWalletAddress : undefined);
    if (
      isDefined(publicWalletAddress) &&
      hasPendingPublicTransaction(filteredTransactions, publicWalletAddress)
    ) {
      return true;
    }
    return false;
  }, [
    excludeTxid,
    fromWalletAddress,
    isShieldedFromAddress,
    network,
    publicWalletOverride?.ethAddress,
    savedTransactions.forNetwork,
  ]);

  return { hasPendingTransaction };
};
