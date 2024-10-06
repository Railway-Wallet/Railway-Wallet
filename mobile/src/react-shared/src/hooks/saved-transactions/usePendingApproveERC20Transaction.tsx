import { isDefined, NetworkName } from "@railgun-community/shared-models";
import {
  SavedTransaction,
  TransactionAction,
  TransactionStatus,
} from "../../models/transaction";
import { useReduxSelector } from "../hooks-redux";

export const usePendingApproveERC20Transaction = (
  networkName: NetworkName,
  tokenAddress: Optional<string>,
  spender: Optional<string>
): { pendingApproveERC20Transaction: Optional<SavedTransaction> } => {
  const { savedTransactions } = useReduxSelector("savedTransactions");

  const visibleTransactions = savedTransactions.forNetwork[networkName] ?? [];

  if (!isDefined(tokenAddress) || !isDefined(spender)) {
    const pendingApproveERC20Transaction = undefined;
    return { pendingApproveERC20Transaction };
  }

  const pendingApproveERC20Transaction = visibleTransactions.find(
    (tx) =>
      tx.status === TransactionStatus.pending &&
      tx.action === TransactionAction.approve &&
      tx.spender === spender &&
      tx.tokenAmounts.map((ta) => ta.token.address).includes(tokenAddress)
  );

  return { pendingApproveERC20Transaction };
};
