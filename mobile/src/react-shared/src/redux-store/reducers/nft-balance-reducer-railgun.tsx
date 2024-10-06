import {
  isDefined,
  NetworkName,
  NFTAmount,
  RailgunWalletBalanceBucket,
  TXIDVersion,
} from "@railgun-community/shared-models";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RailgunTXIDVersionNFTAmountMap } from "../../models/wallet";
import { cacheNFTBalancesRailgun } from "../../services/wallet/wallet-balance-cache";
import { copyByValue } from "../../utils/util";

export type UpdateRailgunNFTBalancesPayload = {
  networkName: NetworkName;
  walletID: string;
  newTXIDBalanceBucketNFTAmountsMap: Partial<RailgunTXIDVersionNFTAmountMap>;
};

export type RailgunWalletNFTAmounts = {
  forWallet: MapType<RailgunTXIDVersionNFTAmountMap>;
};
export type RailgunNFTBalanceState = {
  forNetwork: MapType<RailgunWalletNFTAmounts>;
};
const DEFAULT_NETWORK_WALLET_BALANCE_MAP: RailgunWalletNFTAmounts = {
  forWallet: {},
};

const defaultBuckets: Record<RailgunWalletBalanceBucket, NFTAmount[]> = {
  [RailgunWalletBalanceBucket.Spendable]: [],
  [RailgunWalletBalanceBucket.ShieldPending]: [],
  [RailgunWalletBalanceBucket.ShieldBlocked]: [],
  [RailgunWalletBalanceBucket.ProofSubmitted]: [],
  [RailgunWalletBalanceBucket.MissingInternalPOI]: [],
  [RailgunWalletBalanceBucket.MissingExternalPOI]: [],
  [RailgunWalletBalanceBucket.Spent]: [],
};

const DEFAULT_RAILGUN_TXID_BUCKET_MAP: RailgunTXIDVersionNFTAmountMap = {
  [TXIDVersion.V2_PoseidonMerkle]: defaultBuckets,
  [TXIDVersion.V3_PoseidonMerkle]: defaultBuckets,
};

const initialState = {
  forNetwork: {},
} as RailgunNFTBalanceState;

const slice = createSlice({
  name: "nft-balances-railgun",
  initialState,
  reducers: {
    updateNFTBalancesRailgun(
      state,
      action: PayloadAction<UpdateRailgunNFTBalancesPayload>
    ) {
      const { networkName, walletID, newTXIDBalanceBucketNFTAmountsMap } =
        action.payload;
      if (
        !isDefined(networkName) ||
        !isDefined(walletID) ||
        !isDefined(newTXIDBalanceBucketNFTAmountsMap)
      ) {
        return;
      }

      const nftWalletBalances: RailgunWalletNFTAmounts =
        state.forNetwork[networkName] ??
        copyByValue(DEFAULT_NETWORK_WALLET_BALANCE_MAP);

      if (!isDefined(nftWalletBalances.forWallet[walletID])) {
        nftWalletBalances.forWallet[walletID] = copyByValue(
          DEFAULT_RAILGUN_TXID_BUCKET_MAP
        );
      }

      const txidBalanceBucketNFTAmountsMap =
        nftWalletBalances.forWallet[walletID];
      if (!txidBalanceBucketNFTAmountsMap) return;

      for (const txidVersionKey in newTXIDBalanceBucketNFTAmountsMap) {
        const txidVersion = txidVersionKey as TXIDVersion;

        for (const balanceBucketKey in newTXIDBalanceBucketNFTAmountsMap[
          txidVersion
        ]) {
          const balanceBucket = balanceBucketKey as RailgunWalletBalanceBucket;
          txidBalanceBucketNFTAmountsMap[txidVersion][balanceBucket] =
            newTXIDBalanceBucketNFTAmountsMap[txidVersion]?.[balanceBucket];
        }
      }

      nftWalletBalances.forWallet[walletID] = txidBalanceBucketNFTAmountsMap;

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      cacheNFTBalancesRailgun(
        networkName,
        walletID,
        txidBalanceBucketNFTAmountsMap
      );

      state.forNetwork[networkName] = nftWalletBalances;
    },
    resetNFTBalancesRailgun(state, _action: PayloadAction<void>) {
      const networkNames = Object.keys(state.forNetwork);
      for (const networkName of networkNames) {
        const balances = copyByValue(DEFAULT_NETWORK_WALLET_BALANCE_MAP);
        state.forNetwork[networkName] = balances;
      }
    },
  },
});

export const { resetNFTBalancesRailgun, updateNFTBalancesRailgun } =
  slice.actions;
export const nftBalanceRailgunReducer = slice.reducer;
