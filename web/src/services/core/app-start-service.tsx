import {
  isDefined,
  POI_REQUIRED_LISTS,
} from '@railgun-community/shared-models';
import {
  AppDispatch,
  AppSettingsService,
  BlockedRelayerService,
  getRelayAdaptTransactionError,
  loadBalancesFromCache,
  NetworkService,
  PendingTransactionWatcher,
  ProviderLoader,
  refreshRailgunBalances,
  RemoteConfig,
  SavedAddressService,
} from '@react-shared';
import { startEngine } from '../engine/engine';
import { WakuRelayer } from '../networking/waku-relayer';
import { ArtifactServiceWeb } from './artifact-service-web';

export class AppStartService {
  dispatch: AppDispatch;

  constructor(dispatch: AppDispatch) {
    this.dispatch = dispatch;
  }

  runAppStartTasks = async (remoteConfig: RemoteConfig) => {
    await AppSettingsService.loadSettingsFromStorage(this.dispatch);

    const networkService = new NetworkService(this.dispatch);
    const network = await networkService.loadNetworkFromStorage();

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    networkService.loadProviderForNetwork(network);

    const { wakuPubSubTopic, additionalDirectPeers, wakuPeerDiscoveryTimeout } =
      remoteConfig;

    const poiActiveListKeys = POI_REQUIRED_LISTS.map(list => list.key);

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    WakuRelayer.start(
      this.dispatch,
      network,
      wakuPubSubTopic,
      additionalDirectPeers,
      wakuPeerDiscoveryTimeout,
      poiActiveListKeys,
    );

    const blockedRelayerService = new BlockedRelayerService(this.dispatch);
    await blockedRelayerService.loadBlockedRelayersFromStorage();

    await startEngine(this.dispatch, remoteConfig);

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    ProviderLoader.loadEngineProvider(network.name, this.dispatch);

    PendingTransactionWatcher.start(
      this.dispatch,
      getRelayAdaptTransactionError,
      refreshRailgunBalances,
    );
    const savedAddressService = new SavedAddressService(this.dispatch);

    await Promise.all([
      PendingTransactionWatcher.loadTransactionsAndWatchPending(network),
      savedAddressService.refreshSavedAddressesFromStorage(),
      loadBalancesFromCache(this.dispatch),
    ]);

    const artifactService = new ArtifactServiceWeb(this.dispatch);

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    artifactService.downloadAndLoadInitialArtifacts();
  };
}
