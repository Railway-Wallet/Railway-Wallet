import { isDefined } from "@railgun-community/shared-models";
import * as fs from "react-native-fs";
import {
  AppDispatch,
  getLocalRemoteConfigDevOnly,
  getRemoteConfigPath,
  logDevError,
  ReactConfig,
  RemoteConfig,
  setRemoteConfig,
} from "@react-shared";
import { Constants } from "@utils/constants";
import { downloadFailed } from "@utils/downloads";
import { fileExists } from "../util/fs-service";

export class RemoteConfigService {
  dispatch: AppDispatch;

  constructor(dispatch: AppDispatch) {
    this.dispatch = dispatch;
  }

  private async downloadConfig(): Promise<string | undefined> {
    const path = this.getPath();

    try {
      const result = await fs.downloadFile({
        fromUrl: getRemoteConfigPath(),
        toFile: path,
        background: true,
        cacheable: false,
      }).promise;

      if (downloadFailed(result.statusCode)) {
        throw new Error();
      }
      return path;
    } catch (err) {
      logDevError(
        new Error("Could not download remote config", { cause: err })
      );
      if (await fileExists(path)) {
        return path;
      }
      return undefined;
    }
  }

  getPath() {
    return `${fs.DocumentDirectoryPath}/remote-config.json`;
  }

  private useLocalConfigDevOnly() {
    const config = getLocalRemoteConfigDevOnly();
    this.dispatch(setRemoteConfig(config));
    return config;
  }

  async getRemoteConfig(): Promise<RemoteConfig> {
    if (
      (ReactConfig.IS_DEV || isDefined(process.env.test)) &&
      Constants.USE_LOCAL_REMOTE_CONFIG_IN_DEV
    ) {
      return this.useLocalConfigDevOnly();
    }

    const path = await this.downloadConfig();
    if (!isDefined(path)) {
      throw new Error(
        "Could not download resources. Please check your network connection."
      );
    }

    try {
      const data: string = await fs.readFile(path);
      const config: RemoteConfig = JSON.parse(data);

      this.dispatch(setRemoteConfig(config));
      return config;
    } catch (err) {
      logDevError(
        new Error("Could not parse resource files", {
          cause: err,
        })
      );
      throw new Error(
        `Could not parse resource files. Please try again later.`
      );
    }
  }
}
