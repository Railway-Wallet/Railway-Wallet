import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type RelayerSkiplistState = {
  railgunAddresses: string[];
};

const initialState = {
  railgunAddresses: [],
} as RelayerSkiplistState;

const slice = createSlice({
  name: 'relayer-skiplist',
  initialState,
  reducers: {
    addSkippedRelayer(state, action: PayloadAction<string>) {
      const railgunAddress = action.payload;
      state.railgunAddresses.push(railgunAddress);
    },
    resetRelayerSkiplist(state) {
      state.railgunAddresses = [];
    },
  },
});

export const { addSkippedRelayer, resetRelayerSkiplist } = slice.actions;
export const relayerSkiplistReducer = slice.reducer;
