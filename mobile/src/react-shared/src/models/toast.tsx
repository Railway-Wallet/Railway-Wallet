import { NetworkName } from "@railgun-community/shared-models";

export enum ToastType {
  Success = "Success",
  Error = "Error",
  Info = "Info",
  Copy = "Copy",
}

export enum ToastAction {
  Navigate = "Navigate",
}

export enum ToastActionStack {
  Wallets = "Wallets",
}

export enum ToastActionScreen {
  TokenInfo = "TokenInfo",
}

export type ToastActionData = {
  toastAction: ToastAction;
  navigationDataUNSAFE?: {
    stack: string;
    screen: ToastActionScreen;
    params: any;
  };
};

export type ShowToastProps = {
  message: string;
  subtext?: string;
  networkName?: NetworkName;
  id?: string;
  type?: ToastType;
  actionData?: ToastActionData;
};
