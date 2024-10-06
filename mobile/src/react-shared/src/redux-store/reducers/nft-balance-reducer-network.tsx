import {
  isDefined,
  NetworkName,
  NFTAmount,
} from "@railgun-community/shared-models";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { cacheNFTBalances } from "../../services/wallet/wallet-balance-cache";
import { copyByValue } from "../../utils/util";

export type UpdateNFTBalancesPayload = {
  networkName: NetworkName;
  walletID: string;
  nftAmounts: NFTAmount[];
};

export type NFTWalletBalances = {
  forWallet: MapType<NFTAmount[]>;
};
export type NFTBalanceState = {
  forNetwork: MapType<NFTWalletBalances>;
};
const DEFAULT_NETWORK_WALLET_BALANCE_MAP: NFTWalletBalances = {
  forWallet: {},
};

const initialState = {
  forNetwork: {},
} as NFTBalanceState;

const slice = createSlice({
  name: "nft-balances-network",
  initialState,
  reducers: {
    updateNFTBalancesNetwork(
      state,
      action: PayloadAction<UpdateNFTBalancesPayload>
    ) {
      const { networkName, walletID, nftAmounts } = action.payload;
      if (
        !isDefined(networkName) ||
        !isDefined(walletID) ||
        !isDefined(nftAmounts)
      ) {
        return;
      }

      const nftWalletBalances: NFTWalletBalances =
        state.forNetwork[networkName] ??
        copyByValue(DEFAULT_NETWORK_WALLET_BALANCE_MAP);

      nftWalletBalances.forWallet[walletID] = nftAmounts;

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      cacheNFTBalances(networkName, walletID, nftAmounts);

      state.forNetwork[networkName] = nftWalletBalances;
    },
    resetNFTBalancesNetwork(state, _action: PayloadAction<void>) {
      const networkNames = Object.keys(state.forNetwork);
      for (const networkName of networkNames) {
        const balances = copyByValue(DEFAULT_NETWORK_WALLET_BALANCE_MAP);
        state.forNetwork[networkName] = balances;
      }
    },
  },
});

export const { resetNFTBalancesNetwork, updateNFTBalancesNetwork } =
  slice.actions;
export const nftBalanceNetworkReducer = slice.reducer;
