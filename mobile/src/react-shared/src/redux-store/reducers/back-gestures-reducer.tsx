import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type BackGesturesState = {
  enabled: boolean;
};

const initialState = {
  enabled: true,
} as BackGesturesState;

const slice = createSlice({
  name: "backGestures",
  initialState,
  reducers: {
    setBackGesturesEnabled(state, action: PayloadAction<boolean>) {
      state.enabled = action.payload;
    },
  },
});

export const { setBackGesturesEnabled } = slice.actions;
export const backGesturesReducer = slice.reducer;
