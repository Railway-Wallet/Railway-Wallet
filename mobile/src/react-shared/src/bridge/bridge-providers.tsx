import { setRailgunFees } from "@railgun-community/cookbook";
import {
  FeesSerialized,
  LoadProviderResponse,
  NETWORK_CONFIG,
  NetworkName,
} from "@railgun-community/shared-models";
import {
  BridgeCallEvent,
  LoadProviderParams,
  ResumeIsolatedPollingProviderForNetworkParams,
} from "../models/bridge";
import { ProviderNodeType } from "../models/providers";
import { setNetworkFees } from "../redux-store/reducers/network-reducer";
import { AppDispatch, store } from "../redux-store/store";
import { getNetworkFallbackProviderJsonConfig } from "../utils/networks";
import { bridgeCall } from "./ipc";

export class ProviderLoader {
  static firstProviderLoaded = false;
  static firstProviderLoadError: Optional<Error> = undefined;

  static loadEngineProvider = async (
    networkName: NetworkName,
    dispatch: AppDispatch
  ): Promise<FeesSerialized> => {
    const providerConfig = await getNetworkFallbackProviderJsonConfig(
      networkName,
      ProviderNodeType.FullNode
    );
    if (!providerConfig) {
      const network = NETWORK_CONFIG[networkName];
      throw new Error(
        `No provider config for network ${network.publicName ?? networkName}`
      );
    }

    try {
      const remoteConfig = store.getState().remoteConfig.current;
      if (!remoteConfig) {
        throw new Error("Config not available to load providers.");
      }

      const { feesSerialized } = await bridgeCall<
        LoadProviderParams,
        LoadProviderResponse
      >(BridgeCallEvent.LoadProvider, {
        providerConfig,
        networkName,
        pollingInterval: remoteConfig.pollingInterval,
      });
      this.firstProviderLoaded = true;
      dispatch(setNetworkFees(feesSerialized));
      setRailgunFees(
        networkName,
        BigInt(feesSerialized.shieldFeeV2),
        BigInt(feesSerialized.unshieldFeeV2)
      );
      return feesSerialized;
    } catch (cause) {
      const error = new Error("Failed to load provider.", { cause });
      if (!this.firstProviderLoaded) {
        this.firstProviderLoadError = error;
      }
      throw error;
    }
  };

  static unloadEngineProvider = async (networkName: NetworkName) => {
    await bridgeCall<{ networkName: NetworkName }, void>(
      BridgeCallEvent.UnloadProvider,
      {
        networkName,
      }
    );
  };

  static async pauseAllBridgePollingProviders() {
    await bridgeCall<Record<string, never>, void>(
      BridgeCallEvent.PauseAllPollingProviders,
      {}
    );
  }

  static async resumeIsolatedBridgePollingProviderForNetwork(
    networkName: NetworkName
  ) {
    await bridgeCall<ResumeIsolatedPollingProviderForNetworkParams, void>(
      BridgeCallEvent.ResumeIsolatedPollingProviderForNetwork,
      {
        networkName,
      }
    );
  }

  static _reset() {
    ProviderLoader.firstProviderLoaded = false;
    ProviderLoader.firstProviderLoadError = undefined;
  }
}
