import {
  Chain,
  isDefined,
  Network,
  NetworkName,
  TransactionHistoryItem,
  versionCompare,
} from "@railgun-community/shared-models";
import { SharedConstants } from "../../config/shared-constants";
import {
  setTransactionHistoryStatus,
  TransactionHistoryStatus,
} from "../../redux-store/reducers/transaction-history-status-reducer";
import { AppDispatch, store } from "../../redux-store/store";
import { logDev, logDevError } from "../../utils/logging";
import { StorageService } from "../storage/storage-service";
import { LatestSyncedBlockNumberStore } from "./latest-synced-block-number-store";
import { RailgunTransactionHistoryService } from "./railgun-transaction-history-service";
import { SavedTransactionStore } from "./saved-transaction-store";

type IsSyncingMap = MapType<MapType<Optional<boolean>>>;

export type GetWalletTransactionHistory = (
  chain: Chain,
  railgunWalletID: string,
  startingBlock: Optional<number>
) => Promise<TransactionHistoryItem[]>;

export class RailgunTransactionHistorySync {
  private static isSyncingMap: IsSyncingMap = {};

  private static isSyncing = (
    networkName: NetworkName,
    railWalletID: string
  ) => {
    return this.isSyncingMap[networkName]?.[railWalletID] === true;
  };

  private static setIsSyncing = (
    networkName: NetworkName,
    railgunWalletID: string,
    isSyncing: boolean
  ) => {
    this.isSyncingMap[networkName] ??= {};
    const isSyncingMapNetwork = this.isSyncingMap[networkName];
    if (!isSyncingMapNetwork) {
      return;
    }
    isSyncingMapNetwork[railgunWalletID] = isSyncing;
  };

  private static async syncTransactionHistory(
    dispatch: AppDispatch,
    network: Network,
    getWalletTransactionHistory: GetWalletTransactionHistory
  ): Promise<void> {
    const { wallets } = store.getState();
    const activeWallet = wallets.active;
    if (!activeWallet) {
      return;
    }
    const { railWalletID } = activeWallet;

    const latestSyncedBlockNumber = 0;

    const railgunTransactions = await getWalletTransactionHistory(
      network.chain,
      railWalletID,
      latestSyncedBlockNumber
    );

    if (this.isSyncing(network.name, railWalletID)) {
      return;
    }
    this.setIsSyncing(network.name, railWalletID, true);

    const txHistoryService = new RailgunTransactionHistoryService(dispatch);

    await txHistoryService.syncTransactions(
      network.name,
      activeWallet,
      wallets.available,
      railgunTransactions
    );

    this.setIsSyncing(network.name, railWalletID, false);
  }

  static async safeSyncTransactionHistory(
    dispatch: AppDispatch,
    network: Network,
    getWalletTransactionHistory: GetWalletTransactionHistory
  ): Promise<void> {
    try {
      await this.unsafeSyncTransactionHistory(
        dispatch,
        network,
        getWalletTransactionHistory
      );
    } catch (cause) {
      if (!(cause instanceof Error)) {
        throw cause;
      }
      logDevError(
        new Error("Failed to safe sync transaction history", { cause })
      );
    }
  }

  static async unsafeSyncTransactionHistory(
    dispatch: AppDispatch,
    network: Network,
    getWalletTransactionHistory: GetWalletTransactionHistory
  ) {
    const networkName = network.name;
    try {
      dispatch(
        setTransactionHistoryStatus({
          status: TransactionHistoryStatus.Syncing,
          networkName,
        })
      );

      await this.syncTransactionHistory(
        dispatch,
        network,
        getWalletTransactionHistory
      );

      dispatch(
        setTransactionHistoryStatus({
          status: TransactionHistoryStatus.Synced,
          networkName,
        })
      );
    } catch (cause) {
      dispatch(
        setTransactionHistoryStatus({
          status: TransactionHistoryStatus.Error,
          networkName,
        })
      );
      if (!(cause instanceof Error)) {
        throw cause;
      }
      throw new Error(`Failed to sync transaction history`, { cause });
    }
  }

  static async clearSyncedTransactions(
    dispatch: AppDispatch,
    networkName: NetworkName
  ) {
    const savedTransactionStore = new SavedTransactionStore(dispatch);
    await savedTransactionStore.clearAllSyncedTransactions(networkName);
    await LatestSyncedBlockNumberStore.clear();
  }

  static async resyncAllTransactionsIfNecessary(
    dispatch: AppDispatch,
    network: Network,
    getWalletTransactionHistory: GetWalletTransactionHistory,
    refreshRailgunBalances: (
      chain: Chain,
      railgunWalletIdFilter: Optional<string[]>
    ) => Promise<void>,
    forceUpdate: boolean = false
  ): Promise<void> {
    const networkName = network.name;
    const savedTransactionVersionKey =
      SharedConstants.SAVED_TRANSACTION_VERSION + "|" + networkName;
    const savedVersion = await StorageService.getItem(
      savedTransactionVersionKey
    );

    const requiresUpdate =
      !isDefined(savedVersion) ||
      versionCompare(
        savedVersion,
        SharedConstants.SAVED_TRANSACTION_CURRENT_VERSION
      ) < 0 ||
      forceUpdate;
    if (!requiresUpdate) {
      logDev(`Do not update tx history: version ${savedVersion ?? ""}`);
      return;
    }
    logDev(`Update tx history: version ${savedVersion ?? "unknown"}`);

    await this.clearSyncedTransactions(dispatch, networkName);

    try {
      await refreshRailgunBalances(network.chain, undefined);

      await this.unsafeSyncTransactionHistory(
        dispatch,
        network,
        getWalletTransactionHistory
      );

      await StorageService.setItem(
        savedTransactionVersionKey,
        SharedConstants.SAVED_TRANSACTION_CURRENT_VERSION
      );
    } catch (cause) {
      if (!(cause instanceof Error)) {
        throw cause;
      }
      logDevError(new Error("Failed to resync all transactions.", { cause }));
    }
  }
}
