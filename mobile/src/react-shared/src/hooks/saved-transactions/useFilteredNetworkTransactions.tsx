import { isDefined } from "@railgun-community/shared-models";
import { useEffect, useMemo, useState } from "react";
import { getChainTxidsStillPendingSpentPOIs } from "../../bridge/bridge-poi";
import { getWalletTransactionHistory } from "../../bridge/bridge-wallets";
import {
  NonSpendableTransaction,
  SavedTransaction,
} from "../../models/transaction";
import { RailgunTransactionHistoryService } from "../../services/history/railgun-transaction-history-service";
import { transactionIncludesAnyWalletAddress } from "../../utils/saved-transactions";
import { dedupeByParam } from "../../utils/util";
import { useAppDispatch, useReduxSelector } from "../hooks-redux";
import { usePOIProofStatus } from "../poi/usePOIProofStatus";

export const useFilteredNetworkTransactions = (POIRequired: boolean) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");
  const { savedTransactions } = useReduxSelector("savedTransactions");
  const { txidVersion } = useReduxSelector("txidVersion");

  const [nonSpendableTransactions, setNonSpendableTransactions] = useState<
    NonSpendableTransaction[]
  >([]);
  const [pendingSpentPoiTxidList, setPendingSpentPoiTxidList] = useState<
    string[]
  >([]);

  const dispatch = useAppDispatch();
  const savedTransactionsForNetwork =
    savedTransactions.forNetwork[network.current.name];

  const unformattedTransactions: SavedTransaction[] = useMemo(() => {
    const unfilteredTxs = savedTransactionsForNetwork ?? [];
    const filteredTxs = unfilteredTxs.filter((tx) => {
      return transactionIncludesAnyWalletAddress(tx, wallets.active);
    });
    const dedupedTxs = dedupeByParam(filteredTxs, "id");
    return dedupedTxs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallets.active?.id, network.current.name, savedTransactionsForNetwork]);

  const refreshNonSpendableReceivedTransactions = async () => {
    if (!wallets.active) return;

    const txHistoryService = new RailgunTransactionHistoryService(dispatch);
    const railgunTransactions = await getWalletTransactionHistory(
      network.current.chain,
      wallets.active.railWalletID,
      0
    );
    const txItems = await txHistoryService.getNonPOITransactions(
      network.current.name,
      wallets.active,
      wallets.available,
      railgunTransactions
    );

    setNonSpendableTransactions(txItems);
  };

  const refreshPendingSpentPoiTxidList = async () => {
    if (!wallets.active) return;

    const txidList = await getChainTxidsStillPendingSpentPOIs(
      txidVersion.current,
      network.current.name,
      wallets.active.railWalletID
    );

    setPendingSpentPoiTxidList(txidList);
  };

  const refreshPoiLists = () => {
    if (!POIRequired) return;
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    refreshNonSpendableReceivedTransactions();

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    refreshPendingSpentPoiTxidList();
  };

  const { shouldShowAllProofsCompleted } = usePOIProofStatus();
  useEffect(() => {
    if (shouldShowAllProofsCompleted) {
      refreshPoiLists();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldShowAllProofsCompleted]);

  useEffect(() => {
    refreshPoiLists();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    network.current.name,
    wallets.active?.id,
    unformattedTransactions,
    POIRequired,
  ]);

  const networkTransactions: SavedTransaction[] = useMemo(() => {
    return unformattedTransactions.map((transaction) => {
      let finalTx = transaction;

      if (POIRequired) {
        const nonSpendableTransaction = nonSpendableTransactions.find(
          (nonSpendableTransaction) =>
            nonSpendableTransaction.transaction.id === transaction.id
        );

        if (nonSpendableTransaction) {
          finalTx = {
            ...transaction,
            balanceBucket: nonSpendableTransaction.balanceBucket,
          };
        }

        const pendingSpentTxid = pendingSpentPoiTxidList.find(
          (pendingSpentTxid) =>
            `0x${pendingSpentTxid.toLowerCase()}` ===
            transaction.id.toLowerCase()
        );

        if (isDefined(pendingSpentTxid)) {
          finalTx = {
            ...transaction,
            pendingSpentPOI: true,
          };
        }
      }

      return finalTx;
    });
  }, [
    unformattedTransactions,
    nonSpendableTransactions,
    pendingSpentPoiTxidList,
    POIRequired,
  ]);

  return { networkTransactions, refreshPoiLists };
};
