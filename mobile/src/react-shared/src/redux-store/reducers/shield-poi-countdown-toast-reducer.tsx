import { NetworkName } from "@railgun-community/shared-models";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ShieldPOICountdownTx = {
  networkName: NetworkName;
  id: string;
  timestamp: number;
};

export type ShieldPOICountdownToast = {
  isOpen: boolean;
  tx?: ShieldPOICountdownTx;
};

const initialState: ShieldPOICountdownToast = {
  isOpen: false,
  tx: undefined,
};

const slice = createSlice({
  name: "shield-poi-countdown-toast",
  initialState,
  reducers: {
    openShieldPOICountdownToast(
      state,
      action: PayloadAction<ShieldPOICountdownTx>
    ) {
      state.isOpen = true;
      state.tx = action.payload;
    },
    closeShieldPOICountdownToast(state) {
      state.isOpen = false;
      state.tx = undefined;
    },
  },
});

export const { openShieldPOICountdownToast, closeShieldPOICountdownToast } =
  slice.actions;
export const ShieldPOICountdownToastReducer = slice.reducer;
