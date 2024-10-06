import { versionCompare } from "@railgun-community/shared-models";
import VersionNumber from "react-native-version-number";
import { RemoteConfig } from "@react-shared";
import { isAndroid } from "../util/platform-os-service";

export const needsVersionUpdate = (remoteConfig: RemoteConfig): boolean => {
  return (
    versionCompare(
      VersionNumber.appVersion,
      minVersionForPlatform(remoteConfig)
    ) < 0
  );
};

export const minVersionForPlatform = (remoteConfig: RemoteConfig) => {
  const { minVersionNumberAndroid, minVersionNumberIOS } = remoteConfig;

  return isAndroid() ? minVersionNumberAndroid : minVersionNumberIOS;
};
