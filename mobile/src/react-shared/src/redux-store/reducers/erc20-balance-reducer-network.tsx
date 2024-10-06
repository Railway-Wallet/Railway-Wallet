import { isDefined, NetworkName } from "@railgun-community/shared-models";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  BASE_TOKEN_ADDRESS,
  ERC20Balance,
  ERC20BalancesSerialized,
} from "../../models/token";
import { cacheERC20Balances } from "../../services/wallet/wallet-balance-cache";
import { logDevRedux } from "../../utils/logging";
import { copyByValue } from "../../utils/util";

export type UpdateTokenBalancesPayload = {
  networkName: NetworkName;
  walletID: string;
  updatedTokenBalances: ERC20Balance[];
};

export type NetworkWalletBalances = {
  forWallet: MapType<ERC20BalancesSerialized>;
};
export type NetworkWalletBalanceState = {
  forNetwork: MapType<NetworkWalletBalances>;
};
const DEFAULT_NETWORK_WALLET_BALANCE_MAP: NetworkWalletBalances = {
  forWallet: {},
};

const initialState = {
  forNetwork: {},
} as NetworkWalletBalanceState;

const slice = createSlice({
  name: "erc20-balances-network",
  initialState,
  reducers: {
    updateERC20BalancesNetwork(
      state,
      action: PayloadAction<UpdateTokenBalancesPayload>
    ) {
      const { networkName, walletID, updatedTokenBalances } = action.payload;
      if (
        !isDefined(networkName) ||
        !isDefined(walletID) ||
        !isDefined(updatedTokenBalances)
      ) {
        return;
      }

      const networkWalletBalanceMap: NetworkWalletBalances =
        state.forNetwork[networkName] ??
        copyByValue(DEFAULT_NETWORK_WALLET_BALANCE_MAP);

      if (!isDefined(networkWalletBalanceMap.forWallet[walletID])) {
        networkWalletBalanceMap.forWallet[walletID] = {};
      }

      const balanceMap = {
        ...networkWalletBalanceMap.forWallet[walletID],
      };

      for (const {
        tokenAddress,
        balanceString,
        isBaseToken,
      } of updatedTokenBalances) {
        if (isBaseToken) {
          balanceMap[BASE_TOKEN_ADDRESS] = balanceString;
        } else {
          balanceMap[tokenAddress.toLowerCase()] = balanceString;
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      cacheERC20Balances(networkName, walletID, balanceMap);

      networkWalletBalanceMap.forWallet[walletID] = balanceMap;
      state.forNetwork[networkName] = networkWalletBalanceMap;
      logDevRedux(`update token balances: ${Date.now() / 1000}`);
      logDevRedux(updatedTokenBalances);
    },
    resetERC20BalancesNetwork(state, _action: PayloadAction<void>) {
      const networkNames = Object.keys(state.forNetwork);
      for (const networkName of networkNames) {
        const balances = copyByValue(DEFAULT_NETWORK_WALLET_BALANCE_MAP);
        state.forNetwork[networkName] = balances;
      }
    },
  },
});

export const { resetERC20BalancesNetwork, updateERC20BalancesNetwork } =
  slice.actions;
export const erc20BalanceNetworkReducer = slice.reducer;
