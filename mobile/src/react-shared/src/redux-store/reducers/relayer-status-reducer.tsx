import {
  NetworkName,
  RelayerConnectionStatus,
} from '@railgun-community/shared-models';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type Payload = {
  networkName: NetworkName;
  relayerConnectionStatus: RelayerConnectionStatus;
};

export type RelayerStatus = {
  connection: RelayerConnectionStatus;
};

export type RelayerStatusState = {
  forNetwork: MapType<RelayerStatus>;
};

const initialState = {
  forNetwork: {},
} as RelayerStatusState;

const slice = createSlice({
  name: 'relayer-status',
  initialState,
  reducers: {
    updateRelayerConnectionStatus(state, action: PayloadAction<Payload>) {
      const { networkName, relayerConnectionStatus } = action.payload;
      state.forNetwork[networkName] = {
        connection: relayerConnectionStatus,
      };
    },
  },
});

export const { updateRelayerConnectionStatus } = slice.actions;
export const relayerStatusReducer = slice.reducer;
