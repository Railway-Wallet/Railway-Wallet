import { isDefined } from '@railgun-community/shared-models';
import axios from 'axios';
import {
  AppDispatch,
  getLocalRemoteConfigDevOnly,
  getRemoteConfigPath,
  logDevError,
  ReactConfig,
  RemoteConfig,
  setRemoteConfig,
} from '@react-shared';
import { Constants } from '@utils/constants';

export class RemoteConfigService {
  dispatch: AppDispatch;

  constructor(dispatch: AppDispatch) {
    this.dispatch = dispatch;
  }

  private async getConfig(): Promise<Optional<RemoteConfig>> {
    try {
      const url = `${getRemoteConfigPath()}?cb=${Date.now()}`;
      const result = await axios.get(url);
      return result.data;
    } catch (err) {
      return undefined;
    }
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

    const data = await this.getConfig();
    if (!data) {
      throw new Error(
        'Could not download resources. Please check your network connection.',
      );
    }

    try {
      const config: RemoteConfig = data;
      this.dispatch(setRemoteConfig(config));
      return config;
    } catch (err) {
      logDevError(err.message);
      throw new Error(
        'Could not parse resource files. Please try again later.',
      );
    }
  }
}
