import { isDefined, NetworkName } from "@railgun-community/shared-models";
import { SharedConstants } from "../../config/shared-constants";
import { ERC20Amount } from "../../models/token";
import {
  SavedTransaction,
  TransactionAction,
  TransactionStatus,
} from "../../models/transaction";
import {
  setTransactions,
  updateTransaction,
} from "../../redux-store/reducers/saved-transactions-reducer";
import {
  addMissingTimestampTransaction,
  removeMissingTimestampTransactionByID,
} from "../../redux-store/reducers/transactions-missing-timestamp-reducer";
import { AppDispatch, store } from "../../redux-store/store";
import { StorageService } from "../storage/storage-service";
import { NonceStorageService } from "../wallet/nonce-storage-service";

export class SavedTransactionStore {
  private dispatch: AppDispatch;

  constructor(dispatch: AppDispatch) {
    this.dispatch = dispatch;
  }

  async updateTransactionStatus(
    txHash: string,
    networkName: NetworkName,
    status: TransactionStatus,
    gasFee: Optional<bigint>,
    failedErrorMessage?: string,
    cancelling: boolean = false,
    updatedSwapBuyTokenAmount?: ERC20Amount
  ): Promise<void> {
    const transactions = await this.fetchTransactions(networkName);
    const toSaveTxs: SavedTransaction[] = [];
    const matchingTxs: SavedTransaction[] = [];
    for (const tx of transactions) {
      tx.id === txHash ? matchingTxs.push(tx) : toSaveTxs.push(tx);
    }
    for (const foundTx of matchingTxs) {
      const updatedTx: SavedTransaction = {
        ...foundTx,
        cancelling,
      };
      updatedTx.status = status;
      if (isDefined(gasFee)) {
        updatedTx.publicExecutionGasFeeString = gasFee.toString();
      }
      if (cancelling) {
        updatedTx.cancelling = cancelling;
      }
      if (isDefined(failedErrorMessage)) {
        updatedTx.failedErrorMessage = failedErrorMessage;
      } else {
        updatedTx.failedErrorMessage = undefined;
      }
      if (updatedSwapBuyTokenAmount && updatedTx.swapBuyTokenAmount) {
        if (!isDefined(updatedTx.toWalletAddress)) {
          updatedTx.swapBuyTokenAmount = updatedSwapBuyTokenAmount;
        }
        updatedTx.confirmedSwapValue = true;
      }
      toSaveTxs.push(updatedTx);
      this.dispatch(updateTransaction({ networkName, transaction: updatedTx }));
    }
    if (matchingTxs.length) {
      await this.overwriteAllTransactions(toSaveTxs, networkName);
    }
  }

  async addTransactions(
    transactions: SavedTransaction[],
    networkName: NetworkName
  ) {
    const existingTransactions = await this.fetchTransactions(networkName);
    await this.overwriteAllTransactions(
      [...transactions, ...existingTransactions],
      networkName
    );
    const allTransactions = await this.fetchTransactions(networkName);
    this.removeMissingTimestampTransactionsIfExist(transactions, networkName);
    this.dispatch(
      setTransactions({ transactions: allTransactions, networkName })
    );
  }

  addMissingTimestampTransaction(
    transaction: SavedTransaction,
    networkName: NetworkName
  ) {
    this.dispatch(addMissingTimestampTransaction({ transaction, networkName }));
  }

  private removeMissingTimestampTransactionsIfExist(
    transactions: SavedTransaction[],
    networkName: NetworkName
  ) {
    const { transactionsMissingTimestamp } = store.getState();
    const txids = transactions.map((tx) => tx.id);

    const missingTimestampTxs =
      transactionsMissingTimestamp.forNetwork[networkName];
    if (!isDefined(missingTimestampTxs)) {
      return;
    }

    missingTimestampTxs.forEach((tx) => {
      if (txids.includes(tx.id)) {
        this.dispatch(
          removeMissingTimestampTransactionByID({ id: tx.id, networkName })
        );
      }
    });
  }

  private overwriteAllTransactions(
    transactions: SavedTransaction[],
    networkName: NetworkName
  ): Promise<void> {
    const storageKey = SharedConstants.TRANSACTIONS + networkName;
    return StorageService.setItem(storageKey, JSON.stringify(transactions));
  }

  async updateTransactionAsFailed(
    txHash: string,
    networkName: NetworkName,
    walletAddress: string,
    gasFee: Optional<bigint>,
    timedOut: boolean = false,
    failedErrorMessage?: string
  ) {
    await this.updateTransactionStatus(
      txHash,
      networkName,
      timedOut ? TransactionStatus.timedOut : TransactionStatus.failed,
      gasFee,
      failedErrorMessage
    );

    const nonceStorageService = new NonceStorageService();
    await nonceStorageService.clearLastTransactionNonce(
      walletAddress,
      networkName
    );
  }

  async updateTransactionFoundBySync(txHash: string, networkName: NetworkName) {
    const transactions = await this.fetchTransactions(networkName);
    const toSaveTxs: SavedTransaction[] = [];
    const matchingTxs: SavedTransaction[] = [];
    for (const tx of transactions) {
      tx.id === txHash ? matchingTxs.push(tx) : toSaveTxs.push(tx);
    }
    for (const foundTx of matchingTxs) {
      const updatedTx: SavedTransaction = {
        ...foundTx,
        foundBySync: true,
      };
      toSaveTxs.push(updatedTx);
      this.dispatch(updateTransaction({ networkName, transaction: updatedTx }));
    }
    if (matchingTxs.length) {
      await this.overwriteAllTransactions(toSaveTxs, networkName);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private migrateTransactions(transactions: any[]): SavedTransaction[] {
    for (const tx of transactions) {
      tx.sentViaBroadcaster ??= tx.sentViaRelayer;
      tx.broadcasterFeeTokenAmount ??= tx.relayerFeeTokenAmount;
      tx.broadcasterRailgunAddress ??= tx.relayerRailgunAddress;
      delete tx.sentViaRelayer;
      delete tx.relayerFeeTokenAmount;
      delete tx.relayerRailgunAddress;
    }
    return transactions as SavedTransaction[];
  }

  async fetchTransactions(
    networkName: NetworkName
  ): Promise<SavedTransaction[]> {
    try {
      const storageKey = SharedConstants.TRANSACTIONS + networkName;
      const value = await StorageService.getItem(storageKey);
      let transactions: SavedTransaction[] = [];
      if (isDefined(value)) {
        const savedTransactions = this.migrateTransactions(JSON.parse(value));
        transactions = this.sortTransactionsByAge(savedTransactions);
      }
      return transactions;
    } catch (cause) {
      if (!(cause instanceof Error)) {
        throw cause;
      }
      throw new Error(`Error fetching stored transactions`, { cause });
    }
  }

  private sortTransactionsByAge(txs: SavedTransaction[]): SavedTransaction[] {
    return txs.sort((a, b) => {
      return a.timestamp > b.timestamp ? -1 : 0;
    });
  }

  async clearAllSyncedTransactions(networkName: NetworkName): Promise<void> {
    const syncedTransactionActions = [
      "syncedIncoming",
      "syncedOutgoing",
      TransactionAction.synced,
    ];
    const savedTransactionStore = new SavedTransactionStore(this.dispatch);
    const transactions = await savedTransactionStore.fetchTransactions(
      networkName
    );
    const filteredTransactions = transactions.filter(
      (tx) => !syncedTransactionActions.includes(tx.action)
    );
    await savedTransactionStore.overwriteAllTransactions(
      filteredTransactions,
      networkName
    );
    this.dispatch(
      setTransactions({ transactions: filteredTransactions, networkName })
    );
  }
}
