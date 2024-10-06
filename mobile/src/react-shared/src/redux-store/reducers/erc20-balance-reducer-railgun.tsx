import {
  isDefined,
  NetworkName,
  RailgunWalletBalanceBucket,
  TXIDVersion,
} from "@railgun-community/shared-models";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { BASE_TOKEN_ADDRESS } from "../../models/token";
import {
  RailgunERC20BalanceMapSerialized,
  RailgunTXIDBalanceMap,
} from "../../models/wallet";
import { cacheERC20BalancesRailgun } from "../../services/wallet/wallet-balance-cache";
import { logDevRedux } from "../../utils/logging";
import { copyByValue } from "../../utils/util";

export type UpdateRailgunTokenBalancesPayload = {
  networkName: NetworkName;
  walletID: string;
  newBalanceBucketMap: Partial<RailgunERC20BalanceMapSerialized>;
};

export type RailgunWalletBalances = {
  forWallet: MapType<RailgunTXIDBalanceMap>;
};
export type RailgunWalletBalanceState = {
  forNetwork: MapType<RailgunWalletBalances>;
};

const DEFAULT_RAILGUN_WALLET_BALANCE_MAP: RailgunWalletBalances = {
  forWallet: {},
};

const defaultBuckets: Record<
  RailgunWalletBalanceBucket,
  Partial<Record<string, string>>
> = {
  [RailgunWalletBalanceBucket.Spendable]: {},
  [RailgunWalletBalanceBucket.ShieldPending]: {},
  [RailgunWalletBalanceBucket.ShieldBlocked]: {},
  [RailgunWalletBalanceBucket.ProofSubmitted]: {},
  [RailgunWalletBalanceBucket.MissingInternalPOI]: {},
  [RailgunWalletBalanceBucket.MissingExternalPOI]: {},
  [RailgunWalletBalanceBucket.Spent]: {},
};

const DEFAULT_RAILGUN_TXID_BUCKET_MAP: RailgunTXIDBalanceMap = {
  [TXIDVersion.V2_PoseidonMerkle]: defaultBuckets,
  [TXIDVersion.V3_PoseidonMerkle]: defaultBuckets,
};

const initialState = {
  forNetwork: {},
} as RailgunWalletBalanceState;

const slice = createSlice({
  name: "erc20-balances-railgun",
  initialState,
  reducers: {
    updateERC20BalancesRailgun(
      state,
      action: PayloadAction<UpdateRailgunTokenBalancesPayload>
    ) {
      const { networkName, walletID, newBalanceBucketMap } = action.payload;
      if (
        !isDefined(networkName) ||
        !isDefined(walletID) ||
        !isDefined(newBalanceBucketMap)
      ) {
        return;
      }

      const railgunWalletBalanceMap: RailgunWalletBalances =
        state.forNetwork[networkName] ??
        copyByValue(DEFAULT_RAILGUN_WALLET_BALANCE_MAP);

      if (!isDefined(railgunWalletBalanceMap.forWallet[walletID])) {
        railgunWalletBalanceMap.forWallet[walletID] = copyByValue(
          DEFAULT_RAILGUN_TXID_BUCKET_MAP
        );
      }

      const txidBalanceBucketMap = railgunWalletBalanceMap.forWallet[walletID];
      if (!txidBalanceBucketMap) return;

      for (const txidVersionKey in newBalanceBucketMap) {
        const txidVersion = txidVersionKey as TXIDVersion;

        for (const balanceBucketKey in newBalanceBucketMap[txidVersion]) {
          const balanceBucket = balanceBucketKey as RailgunWalletBalanceBucket;

          const newBalances = newBalanceBucketMap[txidVersion]?.[balanceBucket];
          if (!newBalances) continue;

          const balanceMap = {
            ...txidBalanceBucketMap[txidVersion][balanceBucket],
          };

          for (const {
            tokenAddress,
            balanceString,
            isBaseToken,
          } of newBalances) {
            if (isBaseToken) {
              balanceMap[BASE_TOKEN_ADDRESS] = balanceString;
            } else {
              balanceMap[tokenAddress.toLowerCase()] = balanceString;
            }
          }

          txidBalanceBucketMap[txidVersion][balanceBucket] = balanceMap;
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      cacheERC20BalancesRailgun(networkName, walletID, txidBalanceBucketMap);

      railgunWalletBalanceMap.forWallet[walletID] = txidBalanceBucketMap;
      state.forNetwork[networkName] = railgunWalletBalanceMap;
      logDevRedux(
        `update railgun token balances. Timestamp: ${Date.now() / 1000}`
      );
      logDevRedux(newBalanceBucketMap);
    },
    resetERC20BalancesRailgun(state, _action: PayloadAction<void>) {
      const networkNames = Object.keys(state.forNetwork);
      for (const networkName of networkNames) {
        const balances = copyByValue(DEFAULT_RAILGUN_WALLET_BALANCE_MAP);
        state.forNetwork[networkName] = balances;
      }
    },
  },
});

export const { resetERC20BalancesRailgun, updateERC20BalancesRailgun } =
  slice.actions;
export const erc20BalanceRailgunReducer = slice.reducer;
