import {
  ChainType,
  FallbackProviderJsonConfig,
  getAvailableProviderJSONs,
  isDefined,
  Network,
  NETWORK_CONFIG,
  NetworkName,
  ProviderJson,
} from "@railgun-community/shared-models";
import { ReactConfig } from "../config/react-config";
import { ImageChainEthereum } from "../images/images";
import { ProviderNodeType } from "../models/providers";
import { store } from "../redux-store/store";
import { NetworkStoredSettingsService } from "../services/network/network-stored-settings";
import { logDev, logDevError } from "./logging";
import { getNetworkFrontendConfig } from "./networks-frontend";

const getNetworkProvidersConfig = (providerNodeType: ProviderNodeType) => {
  const remoteConfig = store.getState().remoteConfig;
  switch (providerNodeType) {
    case ProviderNodeType.FullNode:
      return remoteConfig.current?.networkProvidersConfig;
    case ProviderNodeType.ArchiveNode:
      return remoteConfig.current?.networkProvidersConfigArchiveNodes;
  }
};

export const getNetworkFallbackProviderJsonConfig = async (
  networkName: NetworkName,
  providerNodeType: ProviderNodeType
): Promise<Optional<FallbackProviderJsonConfig>> => {
  const networkProvidersConfig = getNetworkProvidersConfig(providerNodeType);
  if (!networkProvidersConfig) {
    logDev(`No network providers in remote config`);
    return undefined;
  }
  const fallbackProviderConfig = networkProvidersConfig[networkName];
  if (!isDefined(fallbackProviderConfig)) {
    logDev(`No network providers for ${networkName} in remote config`);
    return undefined;
  }

  const possibleProviderJSONs = [...fallbackProviderConfig.providers];

  const finalConfig: FallbackProviderJsonConfig = {
    chainId: fallbackProviderConfig.chainId,
    providers: [],
  };

  const storedSettings =
    await NetworkStoredSettingsService.getSettingsForNetwork(networkName);

  if (storedSettings.rpcCustomURLs.length) {
    if (!storedSettings.useDefaultRailwayRPCsAsBackup) {
      possibleProviderJSONs.splice(0, possibleProviderJSONs.length);
    }
    storedSettings.rpcCustomURLs.forEach((url) => {
      possibleProviderJSONs.unshift(providerJSONForCustomRPCURL(url));
    });
  }

  const availableProviderJSONs = await getAvailableProviderJSONs(
    fallbackProviderConfig.chainId,
    possibleProviderJSONs,
    logDevError
  );
  if (!availableProviderJSONs.length) {
    logDev("possibleProviderJSONs");
    logDev(possibleProviderJSONs);
    logDev("availableProviderJSONs");
    logDev(availableProviderJSONs);
    return undefined;
  }

  finalConfig.providers = availableProviderJSONs;
  return finalConfig;
};

const providerJSONForCustomRPCURL = (url: string): ProviderJson => {
  return {
    provider: url,
    priority: 1,
    weight: 2,
  };
};

export const allNetworks = () => {
  return Object.values(NETWORK_CONFIG);
};

export const networkForName = (name: NetworkName): Optional<Network> => {
  return allNetworks().find((network) => network.name === name);
};

export const getSupportedNetworks = () => {
  const remoteConfig = store.getState().remoteConfig;
  const availableNetworksRemoteConfig =
    remoteConfig.current?.availableNetworks ?? {};

  return Object.values(NETWORK_CONFIG)
    .filter((n) => {
      if (availableNetworksRemoteConfig[n.name]?.isDevOnly ?? false) {
        return ReactConfig.IS_DEV;
      }
      return availableNetworksRemoteConfig[n.name];
    })
    .filter((n) => !(n.deprecated ?? false));
};

export const getSupportedEVMNetworks = () => {
  return getSupportedNetworks()
    .filter((n) => {
      switch (n.chain.type) {
        case ChainType.EVM:
          return true;
      }
    })
    .sort((a, b) => {
      if (a.isTestnet === b.isTestnet) {
        return 0;
      }
      if ((a.isTestnet ?? false) && !(b.isTestnet ?? false)) {
        return 1;
      }
      return -1;
    });
};

export const railgunContractName = (networkPublicName: string) => {
  return `RAILGUN: ${networkPublicName}`;
};

export const getSupportedEVMNetworkLogos = (): any[] => {
  const evmLogos: any[] = [];
  const networks = getSupportedEVMNetworks();
  for (const network of networks) {
    const { icon } = getNetworkFrontendConfig(network.name);
    if (isDefined(icon)) {
      evmLogos.push(icon);
    }
  }
  if (!evmLogos.length) {
    evmLogos.push(ImageChainEthereum());
  }
  return evmLogos;
};

export const shouldEnableKoinlyTaxExport = (
  currentNetworkName: NetworkName
) => {
  switch (currentNetworkName) {
    case NetworkName.Ethereum:
    case NetworkName.BNBChain:
    case NetworkName.Polygon:
    case NetworkName.Arbitrum:
      return true;
    case NetworkName.EthereumSepolia:
    case NetworkName.PolygonAmoy:
    case NetworkName.EthereumRopsten_DEPRECATED:
    case NetworkName.EthereumGoerli_DEPRECATED:
    case NetworkName.PolygonMumbai_DEPRECATED:
    case NetworkName.ArbitrumGoerli_DEPRECATED:
    case NetworkName.Hardhat:
      return false;
  }
};
