import { isDefined, NetworkName } from "@railgun-community/shared-models";
import { SharedConstants } from "../../config/shared-constants";
import {
  NetworkStoredSettings,
  SettingsForNetwork,
} from "../../models/network";
import { StorageService } from "../storage/storage-service";

export class NetworkStoredSettingsService {
  static async storeSettingsForNetwork(
    networkName: NetworkName,
    settings: SettingsForNetwork
  ) {
    const networkStoredSettings: NetworkStoredSettings =
      await NetworkStoredSettingsService.getAllSettings();
    networkStoredSettings.forNetwork = {
      ...networkStoredSettings.forNetwork,
      [networkName]: settings,
    };
    await StorageService.setItem(
      SharedConstants.NETWORK_STORED_SETTINGS,
      JSON.stringify(networkStoredSettings)
    );
  }

  static async getAllSettings(): Promise<NetworkStoredSettings> {
    const value = await StorageService.getItem(
      SharedConstants.NETWORK_STORED_SETTINGS
    );
    if (isDefined(value)) {
      return JSON.parse(value) as NetworkStoredSettings;
    }
    return NetworkStoredSettingsService.emptyNetworkStoredSettings();
  }

  static async getSettingsForNetwork(
    networkName: NetworkName
  ): Promise<SettingsForNetwork> {
    const allSettings = await NetworkStoredSettingsService.getAllSettings();
    const storedSettingsForNetwork: Optional<SettingsForNetwork> =
      allSettings.forNetwork[networkName];
    if (storedSettingsForNetwork) {
      return storedSettingsForNetwork;
    }
    return NetworkStoredSettingsService.defaultSettingsForNetwork();
  }

  static defaultSettingsForNetwork = (): SettingsForNetwork => {
    return {
      rpcCustomURLs: [],
      useDefaultRailwayRPCsAsBackup: false,
    };
  };

  private static emptyNetworkStoredSettings = (): NetworkStoredSettings => {
    return { forNetwork: {} };
  };
}
