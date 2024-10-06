import { NetworkName } from "@railgun-community/shared-models";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SavedTransaction } from "../../models/transaction";

type SetTransactionsPayload = {
  networkName: NetworkName;
  transactions: SavedTransaction[];
};
type AddTransactionPayload = {
  networkName: NetworkName;
  transaction: SavedTransaction;
};
type RemoveTransactionPayload = {
  networkName: NetworkName;
  id: string;
};
type UpdateTransactionPayload = {
  networkName: NetworkName;
  transaction: SavedTransaction;
};

export type SavedTransactionsState = {
  forNetwork: MapType<SavedTransaction[]>;
};

const initialState = {
  forNetwork: {},
} as SavedTransactionsState;

const slice = createSlice({
  name: "transactions",
  initialState,
  reducers: {
    setTransactions(state, action: PayloadAction<SetTransactionsPayload>) {
      const { transactions, networkName } = action.payload;
      state.forNetwork[networkName] = transactions;
    },
    addTransaction(state, action: PayloadAction<AddTransactionPayload>) {
      const { transaction, networkName } = action.payload;
      state.forNetwork[networkName] = state.forNetwork[networkName] ?? [];
      state.forNetwork[networkName]?.unshift(transaction);
    },
    removeTransactionByID(
      state,
      action: PayloadAction<RemoveTransactionPayload>
    ) {
      const { id, networkName } = action.payload;
      state.forNetwork[networkName] = (
        state.forNetwork[networkName] ?? []
      ).filter((t) => t.id !== id);
    },
    updateTransaction(state, action: PayloadAction<UpdateTransactionPayload>) {
      const { transaction, networkName } = action.payload;
      const transactions = state.forNetwork[networkName] ?? [];
      transactions.forEach((tx, index) => {
        if (tx.id === transaction.id) {
          transactions[index] = transaction;
        }
      });
      state.forNetwork[networkName] = transactions;
    },
    resetTransactions(state, action: PayloadAction<NetworkName>) {
      const networkName: NetworkName = action.payload;
      state.forNetwork[networkName] = [];
    },
  },
});

export const {
  setTransactions,
  addTransaction,
  removeTransactionByID,
  updateTransaction,
  resetTransactions,
} = slice.actions;
export const savedTransactionsReducer = slice.reducer;
