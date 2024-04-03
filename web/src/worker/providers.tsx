import { LoadProviderResponse } from '@railgun-community/shared-models';
import {
  loadProvider,
  pauseAllPollingProviders,
  resumeIsolatedPollingProviderForNetwork,
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
    return loadProvider(providerConfig, networkName, pollingInterval);
  },
);

bridgeRegisterCall<UnloadProviderParams, void>(
  BridgeCallEvent.UnloadProvider,
  async ({ networkName }) => {
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
    return resumeIsolatedPollingProviderForNetwork(networkName);
  },
);
