import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type DiscreetModeState = {
  enabled: boolean;
};

const initialState = {
  enabled: false,
} as DiscreetModeState;

const slice = createSlice({
  name: "discreetMode",
  initialState,
  reducers: {
    setDiscreetMode(state, action: PayloadAction<boolean>) {
      state.enabled = action.payload;
    },
  },
});

export const { setDiscreetMode } = slice.actions;
export const discreetModeReducer = slice.reducer;
