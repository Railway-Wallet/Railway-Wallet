import { isDefined, NetworkName } from "@railgun-community/shared-models";
import { Provider, TransactionReceipt } from "ethers";
import { ProviderNodeType } from "../../models";
import { TransactionReceiptDetails } from "../../models/transaction";
import { store } from "../../redux-store/store";
import { logDevError } from "../../utils/logging";
import { ProviderService } from "../providers/provider-service";
import { TransactionReceiptDetailsCache } from "./transaction-receipt-details-cache";

export class TransactionReceiptDetailsService {
  private transactionReceiptDetailsCache: TransactionReceiptDetailsCache;

  constructor() {
    this.transactionReceiptDetailsCache = new TransactionReceiptDetailsCache();
  }

  static getGasFee = (txReceipt: TransactionReceipt): bigint => {
    return txReceipt.gasUsed * txReceipt.gasPrice;
  };

  private getTransactionReceiptDetailsFromCompletedTransaction = (
    networkName: NetworkName,
    txid: string
  ): Optional<TransactionReceiptDetails> => {
    const { savedTransactions } = store.getState();
    const transaction = savedTransactions.forNetwork[networkName]?.find(
      (tx) => tx.id === txid
    );
    if (
      transaction &&
      transaction.timestamp &&
      isDefined(transaction.publicExecutionGasFeeString)
    ) {
      return {
        timestamp: transaction.timestamp,
        gasFeeString: transaction.publicExecutionGasFeeString,
      };
    }
    return undefined;
  };

  async getTransactionReceiptDetails(
    networkName: NetworkName,
    txid: string
  ): Promise<Optional<TransactionReceiptDetails>> {
    const fullNodeProvider = await ProviderService.getProvider(
      networkName,
      ProviderNodeType.FullNode
    );
    return this.getTransactionReceiptDetailsWithProvider(
      networkName,
      txid,
      fullNodeProvider
    );
  }

  private async getTransactionReceiptDetailsWithProvider(
    networkName: NetworkName,
    txid: string,
    provider: Provider
  ): Promise<Optional<TransactionReceiptDetails>> {
    try {
      const cachedReceiptDetails =
        await this.transactionReceiptDetailsCache.getCached(txid);
      if (cachedReceiptDetails) {
        return cachedReceiptDetails;
      }

      const completedTransactionReceiptDetails =
        this.getTransactionReceiptDetailsFromCompletedTransaction(
          networkName,
          txid
        );
      if (completedTransactionReceiptDetails) {
        await this.transactionReceiptDetailsCache.store(
          txid,
          completedTransactionReceiptDetails
        );
        return completedTransactionReceiptDetails;
      }

      const txReceipt = await provider.getTransactionReceipt(txid);
      if (!txReceipt) {
        throw new Error(
          `Transaction receipt not found for ${txid} on network ${networkName}`
        );
      }

      const blockNumber = txReceipt.blockNumber;
      const block = await provider.getBlock(blockNumber);
      if (block == null) {
        throw new Error("Block not found");
      }

      const gasFee = TransactionReceiptDetailsService.getGasFee(txReceipt);
      const transactionsReceiptDetails = {
        timestamp: block.timestamp,
        gasFeeString: gasFee.toString(),
      };
      await this.transactionReceiptDetailsCache.store(
        txid,
        transactionsReceiptDetails
      );
      return transactionsReceiptDetails;
    } catch (err) {
      logDevError(
        new Error("Error getting transaction receipt", {
          cause: err,
        })
      );

      if (!(err instanceof Error)) {
        throw err;
      }
      return undefined;
    }
  }
}
