import { NetworkName } from "@railgun-community/shared-models";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SavedTransaction } from "../../models/transaction";

type RemoveTransactionPayload = {
  networkName: NetworkName;
  id: string;
};
type AddTransactionPayload = {
  networkName: NetworkName;
  transaction: SavedTransaction;
};

export type TransactionsMissingTimestampState = {
  forNetwork: MapType<SavedTransaction[]>;
};

const initialState = {
  forNetwork: {},
} as TransactionsMissingTimestampState;

const slice = createSlice({
  name: "transactionsMissingTimestamp",
  initialState,
  reducers: {
    addMissingTimestampTransaction(
      state,
      action: PayloadAction<AddTransactionPayload>
    ) {
      const { transaction, networkName } = action.payload;
      state.forNetwork[networkName] = state.forNetwork[networkName] ?? [];

      const transactions = state.forNetwork[networkName] ?? [];
      for (const tx of transactions) {
        if (tx.id === transaction.id) {
          return;
        }
      }

      state.forNetwork[networkName]?.unshift(transaction);
    },
    removeMissingTimestampTransactionByID(
      state,
      action: PayloadAction<RemoveTransactionPayload>
    ) {
      const { id, networkName } = action.payload;
      state.forNetwork[networkName] = (
        state.forNetwork[networkName] ?? []
      ).filter((t) => t.id !== id);
    },
    resetMissingTimestampTransactions(
      state,
      action: PayloadAction<NetworkName>
    ) {
      const networkName: NetworkName = action.payload;
      state.forNetwork[networkName] = [];
    },
  },
});

export const {
  addMissingTimestampTransaction,
  removeMissingTimestampTransactionByID,
  resetMissingTimestampTransactions,
} = slice.actions;
export const transactionsMissingTimestampReducer = slice.reducer;
