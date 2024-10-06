import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ArtifactsProgressState = {
  progress: number;
};

const initialState: ArtifactsProgressState = {
  progress: 0,
};

const slice = createSlice({
  name: "artifactsProgress",
  initialState,
  reducers: {
    setArtifactsProgress(state, action: PayloadAction<number>) {
      state.progress = action.payload;
    },
    resetArtifactsProgress(state) {
      state.progress = 0;
    },
  },
});

export const { setArtifactsProgress, resetArtifactsProgress } = slice.actions;
export const artifactsProgressReducer = slice.reducer;
