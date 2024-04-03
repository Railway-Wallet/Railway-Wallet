import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type BlockedRelayer = {
  railgunAddress: string;
  blockedTimestamp: number
  expiration?: number
};

export type RelayerBlocklistState = {
  relayers: BlockedRelayer[];
};

const initialState = {
  relayers: [],
} as RelayerBlocklistState;

const slice = createSlice({
  name: 'relayer-blocklist',
  initialState,
  reducers: {
    setBlockedRelayers(state, action: PayloadAction<BlockedRelayer[]>) {
      state.relayers = action.payload;
    },
  },
});

export const { setBlockedRelayers } = slice.actions;
export const relayerBlocklistReducer = slice.reducer;
