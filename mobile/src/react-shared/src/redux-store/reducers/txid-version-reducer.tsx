import { TXIDVersion } from "@railgun-community/shared-models";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const DEFAULT_TXID_VERSION = TXIDVersion.V2_PoseidonMerkle;

export type TXIDVersionState = {
  current: TXIDVersion;
};

const initialState = {
  current: DEFAULT_TXID_VERSION,
} as TXIDVersionState;

const slice = createSlice({
  name: "txidVersion",
  initialState,
  reducers: {
    setTXIDVersion(state, action: PayloadAction<TXIDVersion>) {
      state.current = action.payload;
    },
  },
});

export const { setTXIDVersion } = slice.actions;
export const txidVersionReducer = slice.reducer;
