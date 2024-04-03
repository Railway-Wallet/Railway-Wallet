import {
  loadProvider,
  pauseAllPollingProviders,
  resumeIsolatedPollingProviderForNetwork,
  unloadProvider,
} from '@railgun-community/wallet';
import { LoadProviderResponse } from '@railgun-community/shared-models';
import { bridgeRegisterCall } from '../../bridge/node-ipc-service';
import {
  BridgeCallEvent,
  LoadProviderParams,
  ResumeIsolatedPollingProviderForNetworkParams,
  UnloadProviderParams,
} from '../../bridge/model';

bridgeRegisterCall<LoadProviderParams, LoadProviderResponse>(
  BridgeCallEvent.LoadProvider,
  async ({ providerConfig, networkName, pollingInterval }) => {
    return loadProvider(providerConfig, networkName, pollingInterval);
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

bridgeRegisterCall<UnloadProviderParams, void>(
  BridgeCallEvent.UnloadProvider,
  async ({ networkName }) => {
    await unloadProvider(networkName);
  },
);
