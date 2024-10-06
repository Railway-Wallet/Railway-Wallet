import {
  BroadcasterConnectionStatus,
  NetworkName,
} from "@railgun-community/shared-models";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type Payload = {
  networkName: NetworkName;
  broadcasterConnectionStatus: BroadcasterConnectionStatus;
};

export type BroadcasterStatus = {
  connection: BroadcasterConnectionStatus;
};

export type BroadcasterStatusState = {
  forNetwork: MapType<BroadcasterStatus>;
};

const initialState = {
  forNetwork: {},
} as BroadcasterStatusState;

const slice = createSlice({
  name: "broadcaster-status",
  initialState,
  reducers: {
    updateBroadcasterConnectionStatus(state, action: PayloadAction<Payload>) {
      const { networkName, broadcasterConnectionStatus } = action.payload;
      state.forNetwork[networkName] = {
        connection: broadcasterConnectionStatus,
      };
    },
  },
});

export const { updateBroadcasterConnectionStatus } = slice.actions;
export const broadcasterStatusReducer = slice.reducer;
