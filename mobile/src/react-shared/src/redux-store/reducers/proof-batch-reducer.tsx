import { ProofProgressEvent } from "@railgun-community/shared-models";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ProofBatchProgressState = {
  progress: Optional<number>;
  status: Optional<string>;
};

const initialState: ProofBatchProgressState = {
  progress: undefined,
  status: undefined,
};

const slice = createSlice({
  name: "proofBatcher",
  initialState,
  reducers: {
    setProofBatchProgress(state, action: PayloadAction<ProofProgressEvent>) {
      state.progress = action.payload.progress;
      state.status = action.payload.status;
    },
    resetProofBatchProgress(state) {
      state.progress = undefined;
      state.status = undefined;
    },
  },
});

export const { setProofBatchProgress, resetProofBatchProgress } = slice.actions;
export const proofBatchProgressReducer = slice.reducer;
