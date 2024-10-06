import { isDefined } from "@railgun-community/shared-models";
import { useCallback, useMemo } from "react";
import { SavedTransaction } from "../../models/transaction";
import {
  transactionText,
  transactionTitle,
} from "../../utils/saved-transactions";
import { getTokenDisplayName } from "../../utils/tokens";
import { useReduxSelector } from "../hooks-redux";

export const useTransactionSearch = (
  transactions: SavedTransaction[],
  isRailgun: boolean,
  searchText?: string
) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");

  const search = searchText?.toLowerCase();

  const compareWithSearch = useCallback(
    (comparator?: string) => {
      return (
        isDefined(search) &&
        (comparator?.toLowerCase().includes(search) ?? false)
      );
    },
    [search]
  );

  const transactionsWithText: {
    transaction: SavedTransaction;
    text: string;
  }[] = useMemo(
    () =>
      transactions.map((transaction) => ({
        transaction,
        text: transactionText(
          transaction,
          isRailgun,
          network.current,
          wallets.active,
          wallets.available,
          undefined
        ),
      })),
    [isRailgun, network, transactions, wallets.active, wallets.available]
  );

  const filteredTransactions: SavedTransaction[] = useMemo(() => {
    if ((search?.length ?? 0) < 1) {
      return transactions;
    }

    const filteredTransactionsWithText = transactionsWithText.filter(
      ({ transaction, text }) => {
        return (
          compareWithSearch(text) ||
          compareWithSearch(transaction.action) ||
          compareWithSearch(transaction.id) ||
          compareWithSearch(transaction.walletAddress) ||
          compareWithSearch(transaction.toWalletAddress) ||
          compareWithSearch(transaction.spenderName) ||
          compareWithSearch(transaction.memoText) ||
          compareWithSearch(
            transaction.tokenAmounts.map((t) => t.token.address).join(",")
          ) ||
          compareWithSearch(
            transaction.tokenAmounts
              .map((t) =>
                getTokenDisplayName(
                  t.token,
                  wallets.available,
                  network.current.name
                )
              )
              .join(",")
          ) ||
          compareWithSearch(
            transaction.tokenAmounts
              .map((t) => (t.token.isAddressOnly ?? false ? "" : t.token.name))
              .join(",")
          ) ||
          compareWithSearch(transactionTitle(transaction))
        );
      }
    );
    return filteredTransactionsWithText.map(({ transaction }) => transaction);
  }, [
    search?.length,
    transactionsWithText,
    transactions,
    compareWithSearch,
    wallets.available,
    network,
  ]);

  return { filteredTransactions };
};
