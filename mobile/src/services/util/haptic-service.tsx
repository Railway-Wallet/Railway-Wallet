import ReactNativeHapticFeedback, {
  HapticOptions,
} from "react-native-haptic-feedback";
import { isAndroid } from "./platform-os-service";

export enum HapticSurface {
  BackButton = "BackButton",
  NavigationButton = "NavigationButton",
  NumPad = "NumPad",
  Slider = "Slider",
  CardSwipe = "CardSwipe",
  SelectItem = "SelectItem",
  NavigationTab = "NavigationTab",
  ClipboardCopy = "ClipboardCopy",
  EditButton = "EditButton",
  EditSuccess = "EditSuccess",
  DangerButton = "DangerButton",
  DangerAlert = "DangerAlert",
  NotifyError = "NotifyError",
  NotifySuccess = "NotifySuccess",
}

export const triggerHaptic = (surface: HapticSurface) => {
  const hapticOptions: HapticOptions = {
    enableVibrateFallback: true,
    ignoreAndroidSystemSettings: true,
  };

  if (isAndroid()) {
    switch (surface) {
      case HapticSurface.BackButton:
        return;
      case HapticSurface.SelectItem:
      case HapticSurface.NumPad:
      case HapticSurface.NavigationButton:
      case HapticSurface.CardSwipe:
      case HapticSurface.Slider:
      case HapticSurface.EditButton:
        return ReactNativeHapticFeedback.trigger("keyboardTap", hapticOptions);
      case HapticSurface.NavigationTab:
      case HapticSurface.EditSuccess:
        return ReactNativeHapticFeedback.trigger("impactLight", hapticOptions);
      case HapticSurface.ClipboardCopy:
      case HapticSurface.DangerButton:
        return ReactNativeHapticFeedback.trigger("impactMedium", hapticOptions);
      case HapticSurface.DangerAlert:
        return ReactNativeHapticFeedback.trigger(
          "notificationWarning",
          hapticOptions
        );
      case HapticSurface.NotifyError:
        return ReactNativeHapticFeedback.trigger(
          "notificationError",
          hapticOptions
        );
      case HapticSurface.NotifySuccess:
        return ReactNativeHapticFeedback.trigger(
          "notificationSuccess",
          hapticOptions
        );
    }
  }

  switch (surface) {
    case HapticSurface.BackButton:
      return;
    case HapticSurface.NumPad:
      return ReactNativeHapticFeedback.trigger("keyboardTap", hapticOptions);
    case HapticSurface.NavigationButton:
    case HapticSurface.CardSwipe:
    case HapticSurface.SelectItem:
      return ReactNativeHapticFeedback.trigger("selection", hapticOptions);
    case HapticSurface.Slider:
    case HapticSurface.EditButton:
      return ReactNativeHapticFeedback.trigger("impactLight", hapticOptions);
    case HapticSurface.ClipboardCopy:
    case HapticSurface.NavigationTab:
    case HapticSurface.DangerButton:
    case HapticSurface.EditSuccess:
      return ReactNativeHapticFeedback.trigger("impactMedium", hapticOptions);
    case HapticSurface.DangerAlert:
      return ReactNativeHapticFeedback.trigger(
        "notificationWarning",
        hapticOptions
      );
    case HapticSurface.NotifyError:
      return ReactNativeHapticFeedback.trigger(
        "notificationError",
        hapticOptions
      );
    case HapticSurface.NotifySuccess:
      return ReactNativeHapticFeedback.trigger(
        "notificationSuccess",
        hapticOptions
      );
  }
};
