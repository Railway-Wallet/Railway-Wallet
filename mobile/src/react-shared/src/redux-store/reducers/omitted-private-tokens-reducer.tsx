import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SearchableERC20 } from "../../models";

export type SetShouldShowOmittedPrivateTokensModalPayload = boolean;
export type SetOmittedPrivateTokensPayload = {
  omittedPrivateTokens: SearchableERC20[];
  shouldShowOmittedPrivateTokensModal: boolean;
};

export type OmittedPrivateTokensState = {
  omittedPrivateTokens: SearchableERC20[];
  shouldShowOmittedPrivateTokensModal: boolean;
};

const initialState = {
  omittedPrivateTokens: [],
  shouldShowOmittedPrivateTokensModal: false,
} as OmittedPrivateTokensState;

const slice = createSlice({
  name: "omitted-private-tokens",
  initialState,
  reducers: {
    setShouldShowOmittedPrivateTokensModal(
      state,
      action: PayloadAction<SetShouldShowOmittedPrivateTokensModalPayload>
    ) {
      state.shouldShowOmittedPrivateTokensModal = action.payload;
    },
    setOmittedPrivateTokens(
      state,
      action: PayloadAction<SetOmittedPrivateTokensPayload>
    ) {
      state.shouldShowOmittedPrivateTokensModal =
        action.payload.shouldShowOmittedPrivateTokensModal;
      state.omittedPrivateTokens = action.payload.omittedPrivateTokens;
    },
  },
});

export const {
  setShouldShowOmittedPrivateTokensModal,
  setOmittedPrivateTokens,
} = slice.actions;

export const omittedPrivateTokensReducer = slice.reducer;
