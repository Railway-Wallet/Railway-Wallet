import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  AvailableWallet,
  FrontendWallet,
  ViewOnlyWallet,
} from "../../models/wallet";

export type WalletsState = {
  viewOnly: ViewOnlyWallet[];
  available: AvailableWallet[];
  active: Optional<FrontendWallet>;
};

const initialState = {
  available: [],
  viewOnly: [],
  active: undefined,
} as WalletsState;

const slice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    setActiveWalletByID(state, action: PayloadAction<string>) {
      const id = action.payload;
      const availableWallets = state.available;
      const viewOnlyWallets = state.viewOnly;
      for (const wallet of [...availableWallets, ...viewOnlyWallets]) {
        wallet.isActive = wallet.id === id;
        if (wallet.isActive) {
          state.active = wallet;
        }
      }
      state.available = availableWallets;
      state.viewOnly = viewOnlyWallets;
    },
    setAvailableWallets(state, action: PayloadAction<AvailableWallet[]>) {
      state.available = action.payload;
    },
    setViewOnlyWallets(state, action: PayloadAction<ViewOnlyWallet[]>) {
      state.viewOnly = action.payload;
    },
    removeWalletByID(state, action: PayloadAction<string>) {
      const id = action.payload;
      state.available = state.available.filter((wallet) => wallet.id !== id);
      state.viewOnly = state.viewOnly.filter((wallet) => wallet.id !== id);

      if (state.active?.id === id) {
        state.active = undefined;
      }
    },
    clearAllWallets(state) {
      state.available = [];
      state.viewOnly = [];
      state.active = undefined;
    },
  },
});

export const {
  setActiveWalletByID,
  setAvailableWallets,
  setViewOnlyWallets,
  removeWalletByID,
  clearAllWallets,
} = slice.actions;
export const walletsReducer = slice.reducer;
