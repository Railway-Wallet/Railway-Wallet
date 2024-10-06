import {
  isDefined,
  NetworkName,
  POIProofEventStatus,
  TXIDVersion,
} from "@railgun-community/shared-models";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { copyByValue, logDev } from "../../utils";

export enum POIProofEventStatusUI {
  NewTransactionLoading = "NewTransactionLoading",
}

export type POIProofProgress = {
  status: POIProofEventStatus | POIProofEventStatusUI;
  progress: number;
  listKey: string;
  txid: string;
  railgunTxid: string;
  index: number;
  totalCount: number;
  errMessage: Optional<string>;
};

export type POIProofProgressPayload = POIProofProgress & {
  networkName: NetworkName;
  walletID: string;
  txidVersion: TXIDVersion;
};

export type POIProofProgressStatusPayload = {
  networkName: NetworkName;
  walletID: string;
  txidVersion: TXIDVersion;
  status: POIProofEventStatus | POIProofEventStatusUI;
};

export type POIProofProgressWalletMap = {
  forWallet: MapType<POIProofProgress>;
};

export type POIProofProgressTXIDVersionMap = {
  forTXIDVersion: Partial<Record<TXIDVersion, POIProofProgressWalletMap>>;
};
export type POIProofProgressNetworkMap = {
  forNetwork: MapType<POIProofProgressTXIDVersionMap>;
};

const DEFAULT_WALLET_MAP: POIProofProgressWalletMap = {
  forWallet: {},
};

const DEFAULT_TXIDVERSION__MAP: POIProofProgressTXIDVersionMap = {
  forTXIDVersion: {
    [TXIDVersion.V2_PoseidonMerkle]: {
      forWallet: {},
    },
  },
};

const initialState = {
  forNetwork: {},
} as POIProofProgressNetworkMap;

const slice = createSlice({
  name: "poi-proof-progress",
  initialState,
  reducers: {
    updatePOIProofProgressStatus(
      state,
      action: PayloadAction<POIProofProgressStatusPayload>
    ) {
      const { networkName, walletID, txidVersion, status } = action.payload;
      if (
        !isDefined(networkName) ||
        !isDefined(walletID) ||
        !isDefined(txidVersion) ||
        !isDefined(status)
      ) {
        logDev("Invalid POIProofProgressStatusPayload");
        return;
      }

      const poiProofProgressTXIDVersionMap: POIProofProgressTXIDVersionMap =
        state.forNetwork[networkName] ?? copyByValue(DEFAULT_TXIDVERSION__MAP);

      const poiProofProgressWalletMap =
        poiProofProgressTXIDVersionMap.forTXIDVersion[txidVersion] ??
        copyByValue(DEFAULT_WALLET_MAP);

      const proofProgress: POIProofProgress = {
        status,
        progress: 0,
        listKey: "N/A",
        txid: "N/A",
        railgunTxid: "N/A",
        index: 0,
        totalCount: 0,
        errMessage: undefined,
      };

      poiProofProgressWalletMap.forWallet[walletID] = proofProgress;

      poiProofProgressTXIDVersionMap.forTXIDVersion[txidVersion] =
        poiProofProgressWalletMap;

      state.forNetwork[networkName] = poiProofProgressTXIDVersionMap;
    },
    updatePOIProofProgress(
      state,
      action: PayloadAction<POIProofProgressPayload>
    ) {
      const {
        networkName,
        walletID,
        txidVersion,
        status,
        progress,
        listKey,
        txid,
        railgunTxid,
        index,
        totalCount,
        errMessage,
      } = action.payload;
      if (
        !isDefined(networkName) ||
        !isDefined(walletID) ||
        !isDefined(txidVersion) ||
        !isDefined(status) ||
        !isDefined(progress) ||
        !isDefined(listKey) ||
        !isDefined(txid) ||
        !isDefined(railgunTxid) ||
        !isDefined(index) ||
        !isDefined(totalCount)
      ) {
        logDev("Invalid POIProofProgressPayload");
        return;
      }

      const poiProofProgressTXIDVersionMap: POIProofProgressTXIDVersionMap =
        state.forNetwork[networkName] ?? copyByValue(DEFAULT_TXIDVERSION__MAP);

      const poiProofProgressWalletMap =
        poiProofProgressTXIDVersionMap.forTXIDVersion[txidVersion] ??
        copyByValue(DEFAULT_WALLET_MAP);

      const proofProgress: POIProofProgress = {
        status,
        progress,
        listKey,
        txid,
        railgunTxid,
        index,
        totalCount,
        errMessage,
      };

      poiProofProgressWalletMap.forWallet[walletID] = proofProgress;

      poiProofProgressTXIDVersionMap.forTXIDVersion[txidVersion] =
        poiProofProgressWalletMap;

      state.forNetwork[networkName] = poiProofProgressTXIDVersionMap;
    },
  },
});

export const { updatePOIProofProgress, updatePOIProofProgressStatus } =
  slice.actions;
export const poiProofProgressReducer = slice.reducer;
