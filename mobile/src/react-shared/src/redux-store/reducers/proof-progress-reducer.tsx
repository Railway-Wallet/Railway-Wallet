import { ProofProgressEvent } from "@railgun-community/shared-models";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ProofProgressState = {
  progress: Optional<number>;
  status: Optional<string>;
};

const initialState: ProofProgressState = {
  progress: undefined,
  status: undefined,
};

const slice = createSlice({
  name: "proofProgress",
  initialState,
  reducers: {
    setProofProgress(state, action: PayloadAction<ProofProgressEvent>) {
      state.progress = action.payload.progress;
      state.status = action.payload.status;
    },
    resetProofProgress(state) {
      state.progress = undefined;
      state.status = undefined;
    },
  },
});

export const { setProofProgress, resetProofProgress } = slice.actions;
export const proofProgressReducer = slice.reducer;
