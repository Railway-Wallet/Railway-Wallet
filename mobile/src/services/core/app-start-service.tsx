import {
  isDefined,
  POI_REQUIRED_LISTS,
} from "@railgun-community/shared-models";
import {
  AppDispatch,
  AppSettingsService,
  BlockedBroadcasterService,
  BridgeEvent,
  bridgeListen,
  getRelayAdaptTransactionError,
  loadBalancesFromCache,
  logDev,
  NetworkService,
  PendingTransactionWatcher,
  ProviderLoader,
  refreshRailgunBalances,
  RemoteConfig,
  SavedAddressService,
  setArtifactsProgress,
  setAuthKey,
} from "@react-shared";
import { startEngine } from "@services/engine/engine";
import { WakuBroadcaster } from "@services/networking/waku-broadcaster";
import { Constants } from "@utils/constants";
import { getCurrentLocaleMobile } from "@utils/locale";
import { getEncryptedPin } from "../security/secure-app-service";
import { ArtifactServiceMobile } from "./artifact-service-mobile";

export class AppStartService {
  dispatch: AppDispatch;
  needsLockScreenOnLaunch = false;
  recoveryMode = false;

  constructor(dispatch: AppDispatch, recoveryMode: boolean = false) {
    this.dispatch = dispatch;
    this.recoveryMode = recoveryMode;
  }

  runAppStartTasks = async (remoteConfig?: RemoteConfig) => {
    bridgeListen(BridgeEvent.OnArtifactsProgress, (progress: number) => {
      this.dispatch(setArtifactsProgress(progress));
    });

    if (!this.recoveryMode) {
      await AppSettingsService.loadSettingsFromStorage(this.dispatch);
      await AppSettingsService.setLocale(getCurrentLocaleMobile());

      const networkService = new NetworkService(this.dispatch);
      const network = await networkService.loadNetworkFromStorage();

      await networkService.loadProviderForNetwork(network);

      const blockedBroadcasterService = new BlockedBroadcasterService(
        this.dispatch
      );
      await blockedBroadcasterService.loadBlockedBroadcastersFromStorage();

      await startEngine(this.dispatch, remoteConfig);

      PendingTransactionWatcher.start(
        this.dispatch,
        getRelayAdaptTransactionError,
        refreshRailgunBalances
      );

      const savedAddressService = new SavedAddressService(this.dispatch);

      await Promise.all([
        PendingTransactionWatcher.loadTransactionsAndWatchPending(network),
        savedAddressService.refreshSavedAddressesFromStorage(),
        loadBalancesFromCache(this.dispatch),
      ]);

      setTimeout(async () => {
        await ProviderLoader.loadEngineProvider(network.name, this.dispatch);

        const artifactService = new ArtifactServiceMobile(this.dispatch);
        await artifactService.downloadAndLoadInitialArtifacts();

        if (remoteConfig) {
          const {
            wakuPubSubTopic,
            additionalDirectPeers,
            wakuPeerDiscoveryTimeout,
          } = remoteConfig;

          const poiActiveListKeys = POI_REQUIRED_LISTS.map((list) => list.key);

          await WakuBroadcaster.start(
            this.dispatch,
            network,
            wakuPubSubTopic,
            additionalDirectPeers,
            wakuPeerDiscoveryTimeout,
            poiActiveListKeys
          );
        }
      });
    }

    const storedPin = await getEncryptedPin();

    const hasPin = isDefined(storedPin);
    const skipLockedScreen = __DEV__ && Constants.SKIP_LOCKED_SCREEN_IN_DEV;
    this.needsLockScreenOnLaunch = !skipLockedScreen && hasPin;

    if (skipLockedScreen && hasPin) {
      logDev(`skip locked screen (DEV): use auth key ${storedPin}`);
      this.dispatch(setAuthKey(storedPin));
    } else if (!hasPin) {
      logDev(
        "skip locked screen (no lock screen needed): use default auth key"
      );
      this.dispatch(setAuthKey(Constants.DEFAULT_AUTH_KEY));
    }
  };
}
