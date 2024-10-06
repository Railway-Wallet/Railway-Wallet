import { isDefined, NetworkName } from "@railgun-community/shared-models";
import {
  SavedTransaction,
  TransactionAction,
  TransactionStatus,
} from "../../models/transaction";
import { useReduxSelector } from "../hooks-redux";

export const usePendingApproveNFTCollectionTransaction = (
  networkName: NetworkName,
  nftAddress: Optional<string>,
  spender: Optional<string>
): { pendingApproveNFTCollectionTransaction: Optional<SavedTransaction> } => {
  const { savedTransactions } = useReduxSelector("savedTransactions");

  const visibleTransactions = savedTransactions.forNetwork[networkName] ?? [];

  if (!isDefined(nftAddress) || !isDefined(spender)) {
    const pendingApproveNFTCollectionTransaction = undefined;
    return { pendingApproveNFTCollectionTransaction };
  }

  const pendingApproveNFTCollectionTransaction = visibleTransactions.find(
    (tx) =>
      tx.status === TransactionStatus.pending &&
      tx.action === TransactionAction.approve &&
      tx.spender === spender &&
      tx.nftAmountRecipients &&
      tx.nftAmountRecipients
        .map((nftAmountRecipient) => nftAmountRecipient.nftAddress)
        .includes(nftAddress)
  );

  return { pendingApproveNFTCollectionTransaction };
};
