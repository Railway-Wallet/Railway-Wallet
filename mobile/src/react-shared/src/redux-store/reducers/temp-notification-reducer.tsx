import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type TempNotification = {
  id: string;
  title: string;
  text: string;
};

export type TempNotificationState = {
  current?: TempNotification;
};

const initialState = {
  current: undefined,
} as TempNotificationState;

const slice = createSlice({
  name: "temp-notification",
  initialState,
  reducers: {
    setTempNotification(
      state,
      action: PayloadAction<Optional<TempNotification>>
    ) {
      state.current = action.payload;
    },
  },
});

export const { setTempNotification } = slice.actions;
export const tempNotificationReducer = slice.reducer;
