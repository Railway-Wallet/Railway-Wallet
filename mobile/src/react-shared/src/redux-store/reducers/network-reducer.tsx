import {
  FeesSerialized,
  isDefined,
  Network,
  NETWORK_CONFIG,
  NetworkName,
} from "@railgun-community/shared-models";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SharedConstants } from "../../config/shared-constants";

const BACKUP_DEFAULT_NETWORK =
  NETWORK_CONFIG[SharedConstants.BACKUP_DEFAULT_NETWORK_NAME];

export type NetworkState = {
  current: Network & { feesSerialized?: FeesSerialized };
};

const initialState = {
  current: { ...BACKUP_DEFAULT_NETWORK },
} as NetworkState;

const slice = createSlice({
  name: "network",
  initialState,
  reducers: {
    setNetworkByName(state, action: PayloadAction<NetworkName>) {
      const networkName = action.payload;
      const network = NETWORK_CONFIG[networkName];
      if (!isDefined(network)) {
        return;
      }
      state.current = { ...network };
    },
    setNetworkFees(state, action: PayloadAction<FeesSerialized>) {
      state.current.feesSerialized = action.payload;
    },
  },
});

export const { setNetworkByName, setNetworkFees } = slice.actions;
export const networkReducer = slice.reducer;
