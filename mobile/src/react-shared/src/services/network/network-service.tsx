import {
  FeesSerialized,
  isDefined,
  Network,
  NETWORK_CONFIG,
  NetworkName,
  TXIDVersion,
} from "@railgun-community/shared-models";
import { ProviderLoader } from "../../bridge/bridge-providers";
import {
  getWalletTransactionHistory,
  refreshRailgunBalances,
} from "../../bridge/bridge-wallets";
import { SharedConstants } from "../../config/shared-constants";
import {
  PullBalances,
  PullPrices,
} from "../../hooks/balances/useBalancePriceRefresh";
import { ProviderNodeType } from "../../models";
import {
  setNetworkByName,
  setNetworkFees,
} from "../../redux-store/reducers/network-reducer";
import { closeShieldPOICountdownToast } from "../../redux-store/reducers/shield-poi-countdown-toast-reducer";
import { AppDispatch, store } from "../../redux-store/store";
import { logDev, logDevError } from "../../utils/logging";
import { getSupportedNetworks, networkForName } from "../../utils/networks";
import { RailgunTransactionHistorySync } from "../history/railgun-transaction-history-sync";
import { ProviderService } from "../providers/provider-service";
import { AppSettingsService } from "../settings/app-settings-service";
import { StorageService } from "../storage/storage-service";
import { PendingTransactionWatcher } from "../transactions/pending-transaction-watcher";
import { displayShieldCountdownTxsIfNeeded } from "../transactions/poi-shield-countdown";
import { refreshReceivedTransactionWatchers } from "../transactions/transfer-watcher-service";
import { WalletTokenService } from "../wallet/wallet-token-service";

export class NetworkService {
  dispatch: AppDispatch;

  constructor(dispatch: AppDispatch) {
    this.dispatch = dispatch;
  }

  static getDefaultNetworkName(): NetworkName {
    const { remoteConfig } = store.getState();
    const defaultNetworkName =
      remoteConfig.current?.defaultNetworkName ??
      SharedConstants.BACKUP_DEFAULT_NETWORK_NAME;

    const supportedNetworks = getSupportedNetworks();
    const defaultSupportedNetwork =
      supportedNetworks.find((n) => n.name === defaultNetworkName) ??
      supportedNetworks[0];

    return defaultSupportedNetwork.name;
  }

  async selectNetwork(
    networkName: NetworkName,
    feesSerialized: FeesSerialized
  ) {
    const network = networkForName(networkName);
    if (!network) {
      throw new Error(`No network found for name ${networkName}`);
    }
    this.dispatch(setNetworkByName(networkName));
    this.dispatch(setNetworkFees(feesSerialized));
    await StorageService.setItem(SharedConstants.SELECTED_NETWORK, networkName);
    await this.changeToV2TXIDVersionIfNecessary(network);

    this.dispatch(closeShieldPOICountdownToast());
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    displayShieldCountdownTxsIfNeeded(networkName, this.dispatch);
  }

  async tryChangeNetwork(
    currentNetworkName: NetworkName,
    newNetworkName: NetworkName,
    shouldFallbackOnError: boolean,
    pullPrices: PullPrices,
    pullBalances: PullBalances
  ) {
    const newNetwork = networkForName(newNetworkName);
    if (!newNetwork) {
      throw new Error(`Could not select network ${newNetworkName}.`);
    }

    const feesSerialized = await ProviderLoader.loadEngineProvider(
      newNetworkName,
      this.dispatch
    );

    try {
      await this.selectNetwork(newNetworkName, feesSerialized);

      const { wallets } = store.getState();

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      RailgunTransactionHistorySync.resyncAllTransactionsIfNecessary(
        this.dispatch,
        newNetwork,
        getWalletTransactionHistory,
        refreshRailgunBalances
      );

      await PendingTransactionWatcher.loadTransactionsAndWatchPending(
        newNetwork
      );

      const activeWallet = wallets.active;
      await refreshReceivedTransactionWatchers(
        activeWallet,
        newNetwork,
        this.dispatch
      );

      const walletTokenService = new WalletTokenService(this.dispatch);
      await walletTokenService.addTokensForWalletsIfNeeded(newNetworkName);
    } catch (err) {
      logDevError(err.message);
      if (shouldFallbackOnError) {
        logDev(
          `Failed to load new network ${newNetworkName}, falling back to previous network ${currentNetworkName}.`
        );

        await this.tryChangeNetwork(
          newNetworkName,
          currentNetworkName,
          false,
          pullPrices,
          pullBalances
        );
      }

      throw new Error("Failed to try changing networks", { cause: err });
    }

    if (currentNetworkName !== NetworkName.Ethereum) {
      await ProviderService.destroy(currentNetworkName);
      await ProviderLoader.unloadEngineProvider(currentNetworkName);
    }
  }

  private async changeToV2TXIDVersionIfNecessary(network: Network) {
    const { txidVersion } = store.getState();
    if (txidVersion.current !== TXIDVersion.V2_PoseidonMerkle) {
      if (!network.supportsV3) {
        await AppSettingsService.setTXIDVersion(
          this.dispatch,
          TXIDVersion.V2_PoseidonMerkle
        );
      }
    }
  }

  async loadNetworkFromStorage(): Promise<Network> {
    const value = await StorageService.getItem(
      SharedConstants.SELECTED_NETWORK
    );
    let loadedNetworkName = NetworkService.getDefaultNetworkName();
    if (isDefined(value)) {
      const supportedNetworks = getSupportedNetworks();
      for (const network of supportedNetworks) {
        if (network.name === value) {
          loadedNetworkName = network.name;
          break;
        }
      }
    }
    this.dispatch(setNetworkByName(loadedNetworkName));

    const network = NETWORK_CONFIG[loadedNetworkName];
    await this.changeToV2TXIDVersionIfNecessary(network);

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    displayShieldCountdownTxsIfNeeded(network.name, this.dispatch);

    return network;
  }

  async loadProviderForNetwork(network: Network) {
    const networkName = network.name;
    await ProviderService.loadFrontendProviderForNetwork(
      networkName,
      ProviderNodeType.FullNode
    );
  }
}
