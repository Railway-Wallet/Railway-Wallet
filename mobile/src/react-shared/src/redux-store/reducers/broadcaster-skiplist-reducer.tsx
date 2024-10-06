import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type BroadcasterSkiplistState = {
  railgunAddresses: string[];
};

const initialState = {
  railgunAddresses: [],
} as BroadcasterSkiplistState;

const slice = createSlice({
  name: "broadcaster-skiplist",
  initialState,
  reducers: {
    addSkippedBroadcaster(state, action: PayloadAction<string>) {
      const railgunAddress = action.payload;
      state.railgunAddresses.push(railgunAddress);
    },
    resetBroadcasterSkiplist(state) {
      state.railgunAddresses = [];
    },
  },
});

export const { addSkippedBroadcaster, resetBroadcasterSkiplist } =
  slice.actions;
export const broadcasterSkiplistReducer = slice.reducer;
