import { RemoteConfig } from "../redux-store/reducers/remote-config-reducer";
import LocalRemoteConfigDevOnly from "./local-remote-config-dev-only.json";
import { ReactConfig } from "./react-config";

export const getLocalRemoteConfigDevOnly = (): RemoteConfig => {
  if (!ReactConfig.IS_DEV) {
    throw new Error("Not accessible");
  }
  return LocalRemoteConfigDevOnly as unknown as RemoteConfig;
};
