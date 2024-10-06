import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SavedAddress } from "../../models/wallet";

export type SavedAddressesState = {
  current: SavedAddress[];
};

const initialState = {
  current: [],
} as SavedAddressesState;

const slice = createSlice({
  name: "saved-addresses",
  initialState,
  reducers: {
    setSavedAddresses(state, action: PayloadAction<SavedAddress[]>) {
      state.current = action.payload;
    },
  },
});

export const { setSavedAddresses } = slice.actions;
export const savedAddressesReducer = slice.reducer;
