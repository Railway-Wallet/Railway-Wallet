import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type BlockedBroadcaster = {
  railgunAddress: string;
  blockedTimestamp: number;
  expiration?: number;
};

export type BroadcasterBlocklistState = {
  broadcasters: BlockedBroadcaster[];
};

const initialState = {
  broadcasters: [],
} as BroadcasterBlocklistState;

const slice = createSlice({
  name: "broadcaster-blocklist",
  initialState,
  reducers: {
    setBlockedBroadcasters(state, action: PayloadAction<BlockedBroadcaster[]>) {
      state.broadcasters = action.payload;
    },
  },
});

export const { setBlockedBroadcasters } = slice.actions;
export const broadcasterBlocklistReducer = slice.reducer;
