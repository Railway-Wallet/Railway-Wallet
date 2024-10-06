import { isDefined } from "@railgun-community/shared-models";
import { Platform } from "react-native";

type PlatformOS = "ios" | "android" | "windows" | "macos" | "web";

export const getPlatformDevice = (platformOS: PlatformOS): string => {
  switch (platformOS) {
    case "android":
      return "Android";
    case "ios":
      return "iOS";
    case "web":
      return "Web";
    case "macos":
      return "MacOS";
    case "windows":
      return "Windows";
  }
};

let isAndroidCached: boolean;
export const isAndroid = (): boolean => {
  if (isDefined(isAndroidCached)) {
    return isAndroidCached;
  }
  isAndroidCached = Platform.OS === "android";
  return isAndroidCached;
};

let isIOSCached: boolean;
export const isIOS = (): boolean => {
  if (isDefined(isIOSCached)) {
    return isIOSCached;
  }
  isIOSCached = Platform.OS === "ios";
  return isIOSCached;
};
