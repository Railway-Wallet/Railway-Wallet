import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ShowToastProps } from "../../models/toast";
import { generateKey } from "../../utils/util";

type ReduxToastProps = ShowToastProps & {
  id: string;
};

export type ToastState = {
  immediate?: ReduxToastProps;
  asyncQueue: ReduxToastProps[];
};

const initialState = {
  immediate: undefined,
  asyncQueue: [],
} as ToastState;

const slice = createSlice({
  name: "toast",
  initialState,
  reducers: {
    showImmediateToast(state, action: PayloadAction<ShowToastProps>) {
      state.immediate = {
        ...action.payload,
        id: generateKey(),
      };
    },
    hideImmediateToast(state) {
      state.immediate = undefined;
    },
    enqueueAsyncToast(state, action: PayloadAction<ShowToastProps>) {
      state.asyncQueue.push({
        ...action.payload,
        id: generateKey(),
      });
    },
    dismissAsyncToast(state) {
      state.asyncQueue.shift();
    },
  },
});

export const {
  showImmediateToast,
  hideImmediateToast,
  enqueueAsyncToast,
  dismissAsyncToast,
} = slice.actions;
export const toastReducer = slice.reducer;
