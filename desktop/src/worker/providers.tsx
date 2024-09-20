import { LoadProviderResponse, NETWORK_CONFIG, type NetworkName } from '@railgun-community/shared-models';
import {
  loadProvider,
  pauseAllPollingProviders,
  pausePPOIBatchingForChain,
  resumeIsolatedPollingProviderForNetwork,
  resumePPOIBatching,
  unloadProvider,
} from '@railgun-community/wallet';
import {
  BridgeCallEvent,
  LoadProviderParams,
  ResumeIsolatedPollingProviderForNetworkParams,
  UnloadProviderParams,
} from '@react-shared';
import { bridgeRegisterCall } from './worker-ipc-service';

bridgeRegisterCall<LoadProviderParams, LoadProviderResponse>(
  BridgeCallEvent.LoadProvider,
  async ({ providerConfig, networkName, pollingInterval }) => {
    const chain = NETWORK_CONFIG[networkName as NetworkName].chain;
    resumePPOIBatching(chain);
    return loadProvider(providerConfig, networkName, pollingInterval);
  },
);

bridgeRegisterCall<UnloadProviderParams, void>(
  BridgeCallEvent.UnloadProvider,
  async ({ networkName }) => {
    const chain = NETWORK_CONFIG[networkName as NetworkName].chain;
    pausePPOIBatchingForChain(chain);
    await unloadProvider(networkName);
  },
);

bridgeRegisterCall<
  Record<string, never>, void
>(BridgeCallEvent.PauseAllPollingProviders, async () => {
  return pauseAllPollingProviders();
});

bridgeRegisterCall<ResumeIsolatedPollingProviderForNetworkParams, void>(
  BridgeCallEvent.ResumeIsolatedPollingProviderForNetwork,
  async ({ networkName }) => {
    const chain = NETWORK_CONFIG[networkName as NetworkName].chain;
    resumePPOIBatching(chain);
    return resumeIsolatedPollingProviderForNetwork(networkName);
  },
);
