import { NativeModules, Platform } from "react-native";

export const getCurrentLocaleMobile = (): string => {
  return String(
    Platform.OS === "ios"
      ? NativeModules.SettingsManager.settings.AppleLocale ??
          NativeModules.SettingsManager.settings.AppleLanguages[0]
      : NativeModules.I18nManager.localeIdentifier
  ).replace(/_/g, "-");
};
