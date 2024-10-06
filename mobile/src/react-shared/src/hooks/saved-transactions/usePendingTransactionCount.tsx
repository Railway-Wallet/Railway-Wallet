import { TransactionStatus } from "../../models/transaction";
import { useFilteredNetworkTransactions } from "./useFilteredNetworkTransactions";

export const usePendingTransactionCount = () => {
  const { networkTransactions } = useFilteredNetworkTransactions(false);

  const pendingTransactionCount = networkTransactions.filter(
    (tx) => tx.status === TransactionStatus.pending
  ).length;

  return {
    pendingTransactionCount,
  };
};
