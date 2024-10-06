import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type AuthKeyState = {
  key: Optional<string>;
};

const initialState = {
  key: undefined,
} as AuthKeyState;

const slice = createSlice({
  name: "authKey",
  initialState,
  reducers: {
    setAuthKey(state, action: PayloadAction<string>) {
      state.key = action.payload;
    },
  },
});

export const { setAuthKey } = slice.actions;
export const authKeyReducer = slice.reducer;
