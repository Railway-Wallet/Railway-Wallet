import {
  MerkletreeScanStatus,
  NetworkName,
} from "@railgun-community/shared-models";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type SetMerkletreeHistoryScanStatusPayload = {
  merkletreeType: MerkletreeType;
  networkName: NetworkName;
  status: MerkletreeScanStatus;
  progress: number;
};

export enum MerkletreeType {
  UTXO = "UTXO",
  TXID = "TXID",
}

export type MerkletreeHistoryScanState = {
  forNetwork: MapType<MerkletreeTypeScanState>;
};

export type MerkletreeTypeScanState = {
  forType: Partial<Record<MerkletreeType, MerkletreeScanCurrentStatus>>;
};

export type MerkletreeScanCurrentStatus = {
  status: MerkletreeScanStatus;
  progress: number;
};

const initialState: MerkletreeHistoryScanState = {
  forNetwork: {},
};

const slice = createSlice({
  name: "merkletreeHistoryScan",
  initialState,
  reducers: {
    setMerkletreeHistoryScanStatus(
      state,
      action: PayloadAction<SetMerkletreeHistoryScanStatusPayload>
    ) {
      const { networkName, status, progress, merkletreeType } = action.payload;
      state.forNetwork[networkName] ??= { forType: {} };
      (state.forNetwork[networkName] as MerkletreeTypeScanState).forType[
        merkletreeType
      ] = {
        status,
        progress,
      };
    },
  },
});

export const { setMerkletreeHistoryScanStatus } = slice.actions;
export const merkletreeHistoryScanReducer = slice.reducer;
