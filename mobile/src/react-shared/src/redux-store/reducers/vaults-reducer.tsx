import { NetworkName } from "@railgun-community/shared-models";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Vault } from "../../models/vault";
import { logDevRedux } from "../../utils/logging";

export type NetworkVaultsPayload = {
  networkName: NetworkName;
  depositVaultsForTokenMap: MapType<DepositVaultsState>;
  redeemVaultForTokenMap: MapType<Vault>;
};

export type DepositVaultsState = {
  list: Vault[];
  bestApy: number;
};

export type TokenVaultsState = {
  depositVaultsForToken: MapType<DepositVaultsState>;
  redeemVaultForToken: MapType<Vault>;
  updatedAt: Optional<number>;
};

export type NetworkTokenVaultsState = {
  forNetwork: MapType<TokenVaultsState>;
};

const initialState = {
  forNetwork: {},
} as NetworkTokenVaultsState;

const slice = createSlice({
  name: "vaults",
  initialState,
  reducers: {
    updateVaults(state, action: PayloadAction<NetworkVaultsPayload>) {
      const { networkName, depositVaultsForTokenMap, redeemVaultForTokenMap } =
        action.payload;

      state.forNetwork[networkName] = {
        depositVaultsForToken: depositVaultsForTokenMap,
        redeemVaultForToken: redeemVaultForTokenMap,
        updatedAt: Date.now(),
      };

      logDevRedux(`Update vaults: ${networkName}`);
      logDevRedux(state.forNetwork[networkName]);
    },
  },
});

export const { updateVaults } = slice.actions;
export const vaultsReducer = slice.reducer;
