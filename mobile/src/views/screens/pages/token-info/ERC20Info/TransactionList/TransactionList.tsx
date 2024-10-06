import React from "react";
import { Text, View } from "react-native";
import { TransactionResponse } from "ethers";
import { ERC20Token, SavedTransaction } from "@react-shared";
import { TransactionItem } from "./TransactionItem/TransactionItem";
import { TransactionsMissingTimestampItem } from "./TransactionItem/TransactionsMissingTimestampItem";
import { styles } from "./styles";

type Props = {
  transactionsMissingTimestamp: SavedTransaction[];
  transactions: SavedTransaction[];
  resyncTransactions: () => Promise<void>;
  filteredToken?: ERC20Token;
  onCancelTransaction: (
    transaction: SavedTransaction,
    txResponse: TransactionResponse
  ) => void;
  generatePOIs?: () => void;
  refreshPOILists?: () => void;
  poiRequired: boolean;
};

export const TransactionList: React.FC<Props> = ({
  transactionsMissingTimestamp,
  transactions,
  resyncTransactions,
  filteredToken,
  onCancelTransaction,
  generatePOIs,
  refreshPOILists,
  poiRequired,
}) => {
  const renderTransaction = (transaction: SavedTransaction, index: number) => {
    return (
      <TransactionItem
        transaction={transaction}
        key={index}
        filteredToken={filteredToken}
        onCancelTransaction={onCancelTransaction}
        generatePOIs={generatePOIs}
        refreshPOILists={refreshPOILists}
        poiRequired={poiRequired}
      />
    );
  };

  return (
    <>
      <TransactionsMissingTimestampItem
        resyncTransactions={resyncTransactions}
        transactions={transactionsMissingTimestamp}
      />
      {transactions.map(renderTransaction)}
      {transactions.length === 0 && (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>No transactions yet.</Text>
        </View>
      )}
    </>
  );
};
