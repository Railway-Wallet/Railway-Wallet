import {
  isDefined,
  NetworkName,
  removeUndefineds,
  TransactionHistoryItem,
} from "@railgun-community/shared-models";
import { FrontendWallet } from "../../models";
import {
  KoinlyTransaction,
  TransactionHistoryItemWithReceiptData,
} from "../../models/transaction";
import { TransactionHistoryStatus } from "../../redux-store/reducers/transaction-history-status-reducer";
import { store } from "../../redux-store/store";
import { logDevError, networkForName } from "../../utils";
import { createKoinlyTransactionsForTransactionHistoryItem } from "../../utils/koinly-export";
import { GetWalletTransactionHistory } from "./railgun-transaction-history-sync";
import { TransactionReceiptDetailsService } from "./transaction-receipt-details-service";

export class KoinlyTransactionHistory {
  private txReceiptDetailsService: TransactionReceiptDetailsService;

  constructor() {
    this.txReceiptDetailsService = new TransactionReceiptDetailsService();
  }

  getHistory = async (
    networkName: NetworkName,
    getWalletTransactionHistory: GetWalletTransactionHistory,
    year?: string
  ): Promise<Optional<KoinlyTransaction[]>> => {
    try {
      const { wallets } = store.getState();
      const transactions = await this.getTransactionsWithReceiptData(
        getWalletTransactionHistory
      );
      if (!isDefined(transactions)) {
        return [];
      }

      const transactionsWithReceiptData = removeUndefineds(transactions);
      const countMissingReceiptData =
        transactions.length - transactionsWithReceiptData.length;
      if (countMissingReceiptData > 0) {
        throw new Error(
          `Missing receipt data for ${countMissingReceiptData} transactions. Please re-sync your transaction history.`
        );
      }

      const filteredTransactions = isDefined(year)
        ? transactionsWithReceiptData.filter(
            (transaction) =>
              new Date(transaction.timestamp * 1000)
                .getFullYear()
                .toString() === year
          )
        : transactionsWithReceiptData;

      return this.serializeTransactionsForKoinly(
        networkName,
        filteredTransactions,
        wallets.active
      );
    } catch (cause) {
      const err = new Error("Failed to get Koinly transaction history.", {
        cause,
      });
      logDevError(err);
      throw err;
    }
  };

  resyncAndCountTransactionsMissingReceiptData = async (
    getWalletTransactionHistory: GetWalletTransactionHistory
  ): Promise<number> => {
    const totalTransactions = await this.getTransactionsWithReceiptData(
      getWalletTransactionHistory
    );
    return totalTransactions.filter((tx) => tx == null).length;
  };

  private getTransactionsWithReceiptData = async (
    getWalletTransactionHistory: GetWalletTransactionHistory
  ): Promise<Optional<TransactionHistoryItemWithReceiptData>[]> => {
    const { network, transactionHistoryStatus, wallets } = store.getState();
    const status =
      transactionHistoryStatus.forNetwork[network.current.name]?.status;
    const isFullySynced = status === TransactionHistoryStatus.Synced;

    if (!isFullySynced) {
      throw new Error(
        "Transaction history is not fully synced. Please re-sync your transaction history to continue."
      );
    }
    if (!isDefined(wallets.active) || !isDefined(wallets.active.railWalletID)) {
      throw new Error("No active wallet.");
    }

    const startingBlock = 0;
    const railgunTransactions = await getWalletTransactionHistory(
      network.current.chain,
      wallets.active.railWalletID,
      startingBlock
    );

    const transactionsWithPossibleReceiptData =
      await this.addReceiptDataToTransactions(
        network.current.name,
        railgunTransactions ?? []
      );

    return transactionsWithPossibleReceiptData;
  };

  private async addReceiptDataToTransactions(
    networkName: NetworkName,
    transactions: TransactionHistoryItem[]
  ): Promise<Optional<TransactionHistoryItemWithReceiptData>[]> {
    return Promise.all(
      transactions.map((transaction) => {
        return this.addReceiptDataToTransaction(networkName, transaction);
      })
    );
  }

  private async addReceiptDataToTransaction(
    networkName: NetworkName,
    transaction: TransactionHistoryItem
  ): Promise<Optional<TransactionHistoryItemWithReceiptData>> {
    const { txid } = transaction;
    const receiptDetails =
      await this.txReceiptDetailsService.getTransactionReceiptDetails(
        networkName,
        txid
      );
    if (!receiptDetails) {
      return undefined;
    }
    return {
      ...transaction,
      timestamp: receiptDetails.timestamp,
      gasFeeString: receiptDetails.gasFeeString,
    };
  }

  private async serializeTransactionsForKoinly(
    networkName: NetworkName,
    transactions: TransactionHistoryItemWithReceiptData[],
    wallet: Optional<FrontendWallet>
  ): Promise<KoinlyTransaction[]> {
    const network = networkForName(networkName);
    if (!network) {
      throw new Error("Network not found");
    }

    const koinlyTransactionRowLists: KoinlyTransaction[][] = await Promise.all(
      transactions.map(async (transaction) => {
        return createKoinlyTransactionsForTransactionHistoryItem(
          network,
          transaction,
          wallet
        );
      })
    );
    const koinlyTransactions: KoinlyTransaction[] =
      koinlyTransactionRowLists.flat();

    koinlyTransactions.sort((a, b) => {
      const dateA: Date =
        a.utcDate !== "Unknown date" ? new Date(a.utcDate) : new Date(0);
      const dateB: Date =
        b.utcDate !== "Unknown date" ? new Date(b.utcDate) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });

    return koinlyTransactions;
  }
}
