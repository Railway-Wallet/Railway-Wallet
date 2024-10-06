import { useMemo } from "react";
import { SavedTransaction } from "../../models/transaction";
import { transactionIncludesAnyWalletAddress } from "../../utils/saved-transactions";
import { dedupeByParam } from "../../utils/util";
import { useReduxSelector } from "../hooks-redux";

export const useFilteredNetworkTransactionsMissingTimestamp = () => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");
  const { transactionsMissingTimestamp } = useReduxSelector(
    "transactionsMissingTimestamp"
  );

  const networkTransactionsMissingTimestamp: SavedTransaction[] =
    useMemo(() => {
      const unfilteredTxs =
        transactionsMissingTimestamp.forNetwork[network.current.name] ?? [];
      const filteredTxs = unfilteredTxs.filter((tx) => {
        return transactionIncludesAnyWalletAddress(tx, wallets.active);
      });
      const dedupedTxs = dedupeByParam(filteredTxs, "id");
      return dedupedTxs;
    }, [wallets.active, network, transactionsMissingTimestamp.forNetwork]);

  return { networkTransactionsMissingTimestamp };
};
