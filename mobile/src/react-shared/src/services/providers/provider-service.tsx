import {
  createFallbackProviderFromJsonConfig,
  isDefined,
  NETWORK_CONFIG,
  NetworkName,
} from "@railgun-community/shared-models";
import { FallbackProvider, JsonRpcProvider } from "ethers";
import { ProviderNodeType } from "../../models/providers";
import { logDev } from "../../utils/logging";
import {
  getNetworkFallbackProviderJsonConfig,
  networkForName,
} from "../../utils/networks";
import { createPollingJsonRpcProviderForListeners } from "./polling-util";

export class ProviderService {
  private static providers: Record<
    ProviderNodeType,
    MapType<FallbackProvider>
  > = {
    [ProviderNodeType.FullNode]: {},
    [ProviderNodeType.ArchiveNode]: {},
  };
  private static pollingProviders: MapType<JsonRpcProvider> = {};

  static setProvider(
    networkName: NetworkName,
    fallbackProvider: Optional<FallbackProvider>,
    providerNodeType: ProviderNodeType
  ) {
    if (!fallbackProvider) {
      logDev(`No fallback provider given for network: ${networkName}`);
      return;
    }
    this.providers[providerNodeType][networkName] = fallbackProvider;
  }

  static getProviderNodeTypeForTransactionReceipts(
    networkName: NetworkName
  ): ProviderNodeType {
    switch (networkName) {
      case NetworkName.Ethereum:
      case NetworkName.Polygon:
      case NetworkName.PolygonAmoy:
      case NetworkName.BNBChain:
      case NetworkName.Arbitrum:
      case NetworkName.EthereumSepolia:
        return ProviderNodeType.FullNode;
      case NetworkName.ArbitrumGoerli_DEPRECATED:
      case NetworkName.PolygonMumbai_DEPRECATED:
      case NetworkName.EthereumGoerli_DEPRECATED:
      case NetworkName.EthereumRopsten_DEPRECATED:
      case NetworkName.Hardhat:
        throw new Error("No Archive Nodes available for this network.");
    }
  }

  private static async createProviderFromStoredSettingsAndJsonConfig(
    networkName: NetworkName,
    providerNodeType: ProviderNodeType
  ): Promise<Optional<FallbackProvider>> {
    const config = await getNetworkFallbackProviderJsonConfig(
      networkName,
      providerNodeType
    );
    if (!config) {
      const network = networkForName(networkName);
      logDev(`Could not load RPC providers for network: ${networkName}`);
      throw new Error(
        network
          ? `Could not load RPC providers for ${network.publicName}: ${providerNodeType}.`
          : "Could not load RPC providers."
      );
    }
    return createFallbackProviderFromJsonConfig(config);
  }

  static async loadFrontendProviderForNetwork(
    networkName: NetworkName,
    providerNodeType: ProviderNodeType
  ): Promise<Optional<FallbackProvider>> {
    const newProvider =
      await ProviderService.createProviderFromStoredSettingsAndJsonConfig(
        networkName,
        providerNodeType
      );
    if (newProvider) {
      ProviderService.setProvider(networkName, newProvider, providerNodeType);
      return newProvider;
    }
    return undefined;
  }

  static getFirstProvider = async (networkName: NetworkName) => {
    const fallbackProvider = await ProviderService.getProvider(
      networkName,
      ProviderNodeType.FullNode
    );
    const provider = fallbackProvider.provider.providerConfigs[0]
      .provider as JsonRpcProvider;
    return provider;
  };

  static async getProvider(
    networkName: NetworkName,
    providerNodeType = ProviderNodeType.FullNode
  ): Promise<FallbackProvider> {
    const existingProvider = this.providers[providerNodeType][networkName];
    if (isDefined(existingProvider)) {
      return existingProvider;
    }

    const newProvider = await ProviderService.loadFrontendProviderForNetwork(
      networkName,
      providerNodeType
    );
    if (newProvider) {
      return newProvider;
    }
    throw new Error(
      `No available RPC providers for ${NETWORK_CONFIG[networkName].publicName}.`
    );
  }

  static async getPollingProvider(
    networkName: NetworkName,
    pollingIntervalInMs: number
  ): Promise<JsonRpcProvider> {
    const existingProvider = this.pollingProviders[networkName];
    if (isDefined(existingProvider)) {
      return existingProvider;
    }
    const fallbackProvider = await this.getProvider(
      networkName,
      ProviderNodeType.FullNode
    );
    const pollingProvider = await createPollingJsonRpcProviderForListeners(
      fallbackProvider,
      pollingIntervalInMs
    );
    this.pollingProviders[networkName] = pollingProvider;
    return pollingProvider;
  }

  static pauseAllPollingProviders(excludeNetworkName?: NetworkName) {
    Object.keys(this.pollingProviders).forEach((networkName) => {
      if (networkName === excludeNetworkName) {
        return;
      }
      const provider = this.pollingProviders[networkName];
      if (isDefined(provider) && provider.paused) {
        provider.pause();
      }
    });
  }

  static resumeIsolatedPollingProviderForNetwork(networkName: NetworkName) {
    ProviderService.pauseAllPollingProviders(networkName);
    const pollingProvider = ProviderService.pollingProviders[networkName];
    if (isDefined(pollingProvider) && pollingProvider.paused) {
      pollingProvider.resume();
    }
  }

  static async destroy(networkName: NetworkName) {
    this.pollingProviders[networkName]?.destroy();
    await this.providers[ProviderNodeType.FullNode][networkName]?.destroy();
    await this.providers[ProviderNodeType.ArchiveNode][networkName]?.destroy();
    delete this.pollingProviders[networkName];
    delete this.providers[ProviderNodeType.FullNode][networkName];
    delete this.providers[ProviderNodeType.ArchiveNode][networkName];
  }
}
