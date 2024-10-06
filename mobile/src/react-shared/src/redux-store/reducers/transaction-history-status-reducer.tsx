import { NetworkName } from "@railgun-community/shared-models";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export enum TransactionHistoryStatus {
  NeedsSync = "NeedsSync",
  Syncing = "Syncing",
  Synced = "Synced",
  Error = "Error",
}

type SetTransactionHistoryStatusPayload = {
  networkName: NetworkName;
  status: TransactionHistoryStatus;
};

type TransactionHistoryCurrentStatus = {
  status: TransactionHistoryStatus;
};

export type TransactionHistoryStatusState = {
  forNetwork: MapType<TransactionHistoryCurrentStatus>;
};

const defaultAllNetworksMapNeedsSync: MapType<TransactionHistoryCurrentStatus> =
  {};
Object.values(NetworkName).forEach((networkName) => {
  defaultAllNetworksMapNeedsSync[networkName] = {
    status: TransactionHistoryStatus.NeedsSync,
  };
});

const initialState: TransactionHistoryStatusState = {
  forNetwork: defaultAllNetworksMapNeedsSync,
};

const slice = createSlice({
  name: "transactionHistoryStatus",
  initialState,
  reducers: {
    setTransactionHistoryStatus(
      state,
      action: PayloadAction<SetTransactionHistoryStatusPayload>
    ) {
      const { networkName, status } = action.payload;
      state.forNetwork[networkName] = { status };
    },
  },
});

export const { setTransactionHistoryStatus } = slice.actions;
export const transactionHistoryStatusReducer = slice.reducer;
