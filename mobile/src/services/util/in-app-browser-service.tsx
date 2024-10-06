import { Alert } from "react-native";
import {
  InAppBrowser,
  InAppBrowserOptions,
} from "react-native-inappbrowser-reborn";
import { AppDispatch, logDevError, styleguide } from "@react-shared";
import { openExternalLinkAlert } from "./alert-service";

const IAB_OPTIONS: InAppBrowserOptions = {
  preferredBarTintColor: styleguide.colors.gray(),
  preferredControlTintColor: styleguide.colors.white,
  animated: true,
  modalPresentationStyle: "fullScreen",
  modalTransitionStyle: "coverVertical",
  modalEnabled: true,
  enableBarCollapsing: true,

  toolbarColor: styleguide.colors.gray(),
  secondaryToolbarColor: styleguide.colors.black,
  navigationBarColor: styleguide.colors.black,
  navigationBarDividerColor: styleguide.colors.white,
};

export const openInAppBrowserLink = async (
  url: string,
  dispatch: AppDispatch
) => {
  try {
    const useInAppBrowser = await InAppBrowser.isAvailable();
    if (useInAppBrowser) {
      openExternalLinkAlert(url, dispatch, async () => {
        await InAppBrowser.open(url, IAB_OPTIONS);
      });
      return;
    }

    openExternalLinkAlert(url, dispatch);
  } catch (error) {
    logDevError(new Error("Error open in app browser link", { cause: error }));
    Alert.alert((error as Error).message);
  }
};
