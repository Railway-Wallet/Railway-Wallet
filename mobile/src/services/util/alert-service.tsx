import { isDefined } from "@railgun-community/shared-models";
import { Alert, AlertButton, AlertType, Linking } from "react-native";
import CrossPlatformPrompt from "react-native-prompt-android";
import Clipboard from "@react-native-clipboard/clipboard";
import {
  AppDispatch,
  domainFromURL,
  SharedConstants,
  showImmediateToast,
  ToastType,
} from "@react-shared";
import { HapticSurface, triggerHaptic } from "./haptic-service";

export enum ExternalSiteAlertMessages {
  OPEN_EXTERNAL_SITE = "You are opening an external site, which may not have the same privacy guarantees of Railway Wallet. Viewing this risks correlating your IP address.",
  OPEN_EXTERNAL_TRANSACTION = "You are opening this transaction on an external site, which may not have the same privacy guarantees of Railway Wallet. Viewing this transaction on an external site risks correlating your IP address.",
}

export const openExternalLinkAlert = (
  url: string,
  dispatch: AppDispatch,
  customOpenURL?: () => void,
  customTitle?: string,
  customMessage?: string
) => {
  Alert.alert(
    customTitle ?? "Warning: External Site",
    customMessage ?? ExternalSiteAlertMessages.OPEN_EXTERNAL_SITE,
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: `Open ${domainFromURL(url)}`,
        onPress: () => {
          if (customOpenURL) {
            customOpenURL();
            return;
          }
          if (url) {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            Linking.openURL(url);
          }
        },
      },
      {
        text: "Copy link",
        onPress: () => {
          Clipboard.setString(url);
          triggerHaptic(HapticSurface.ClipboardCopy);
          dispatch(
            showImmediateToast({
              message: `URL copied to clipboard`,
              type: ToastType.Copy,
            })
          );
        },
      },
    ]
  );
};

export const showCreatePinAlert = (
  onPress: () => void,
  onCancel: () => void
) => {
  Alert.alert(
    "Create a PIN",
    "This is highly suggested to authenticate your app and encrypt your wallets.",
    [
      {
        text: "Add secure PIN",
        onPress,
      },
      {
        text: "Don't use a PIN",
        onPress: () => showNoPinMessage(onCancel),
        style: "destructive",
      },
    ]
  );
};

const showNoPinMessage = (onCancel: () => void) => {
  Alert.alert("No PIN set", "You may set a PIN at any time through Settings.", [
    {
      text: "OK",
    },
  ]);
  onCancel();
};

export const showSaveAddressPrompt = (success: (name: string) => void) => {
  promptAlert(
    "Save this address",
    `${SharedConstants.MAX_LENGTH_WALLET_NAME} character limit`,
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Save",
        onPress: (name?: string) => {
          if (!isDefined(name)) {
            return;
          }
          if (name.length > SharedConstants.MAX_LENGTH_WALLET_NAME) {
            Alert.alert(
              "Please try again",
              `Saved address name is limited to ${SharedConstants.MAX_LENGTH_WALLET_NAME} characters.`
            );
            return;
          }
          success(name);
        },
      },
    ]
  );
};

export const promptAlert = (
  title: string,
  message?: string,
  callbackOrButtons?: ((text: string) => void) | AlertButton[],
  type?: AlertType,
  defaultValue?: string,
  cancelable?: boolean,
  placeholder?: string
) =>
  CrossPlatformPrompt(title, message, callbackOrButtons, {
    type,
    cancelable,
    defaultValue,
    placeholder,
  });
