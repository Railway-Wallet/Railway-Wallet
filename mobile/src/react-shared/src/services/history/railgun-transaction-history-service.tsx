import {
  isDefined,
  NetworkName,
  RailgunHistoryERC20Amount,
  RailgunHistoryReceiveERC20Amount,
  RailgunHistoryReceiveNFTAmount,
  RailgunHistorySendERC20Amount,
  RailgunHistorySendNFTAmount,
  RailgunHistoryUnshieldERC20Amount,
  RailgunWalletBalanceBucket,
  removeUndefineds,
  TransactionHistoryItem,
} from "@railgun-community/shared-models";
import { SharedConstants } from "../../config";
import {
  ERC20Amount,
  ERC20Token,
  ERC20TokenAddressOnly,
} from "../../models/token";
import {
  NonSpendableTransaction,
  ReceiveERC20Amount,
  ReceiveNFTAmountRecipient,
  SavedTransaction,
  TransactionAction,
  TransactionReceiptDetails,
  TransactionStatus,
  TransferNFTAmountRecipient,
  TransferRecipientERC20Amount,
} from "../../models/transaction";
import { AvailableWallet, FrontendWallet } from "../../models/wallet";
import { AppDispatch } from "../../redux-store/store";
import { isNonSpendableBucket } from "../../utils";
import { logDev } from "../../utils/logging";
import { findMatchingAddedToken } from "../../utils/tokens";
import { getERC20Decimals } from "../token/erc20";
import { LatestSyncedBlockNumberStore } from "./latest-synced-block-number-store";
import { SavedTransactionStore } from "./saved-transaction-store";
import { TransactionReceiptDetailsService } from "./transaction-receipt-details-service";

export class RailgunTransactionHistoryService {
  private savedTransactionStore: SavedTransactionStore;
  private cachedTokenMap: MapType<ERC20Token> = {};
  private txReceiptDetailsService: TransactionReceiptDetailsService;

  private lookupMissingTimestampCount = 0;

  constructor(dispatch: AppDispatch) {
    this.savedTransactionStore = new SavedTransactionStore(dispatch);
    this.txReceiptDetailsService = new TransactionReceiptDetailsService();
  }

  async syncTransactions(
    networkName: NetworkName,
    activeWallet: FrontendWallet,
    availableWallets: AvailableWallet[],
    railgunTransactions: TransactionHistoryItem[]
  ): Promise<void> {
    this.cachedTokenMap = {};

    const savedTransactions =
      await this.savedTransactionStore.fetchTransactions(networkName);

    await this.updateLocalTransactionsFoundBySync(
      railgunTransactions,
      savedTransactions,
      networkName
    );

    const newTransactionsToSync = railgunTransactions.filter((historyItem) => {
      return this.hasNoFullMatchingSavedTransaction(
        historyItem,
        savedTransactions
      );
    });

    this.lookupMissingTimestampCount = 0;

    const transactions = await Promise.all(
      newTransactionsToSync.map((railgunTransaction) =>
        this.createNewSyncedTransaction(
          networkName,
          activeWallet,
          availableWallets,
          railgunTransaction
        )
      )
    );

    const nonnullTransactions = removeUndefineds(transactions);
    if (nonnullTransactions.length) {
      logDev(`Syncing new RAILGUN transactions: ${nonnullTransactions.length}`);
      logDev(nonnullTransactions);
    }

    await this.savedTransactionStore.addTransactions(
      nonnullTransactions,
      networkName
    );
  }

  async getNonPOITransactions(
    networkName: NetworkName,
    activeWallet: FrontendWallet,
    availableWallets: AvailableWallet[],
    railgunTransactions: TransactionHistoryItem[]
  ): Promise<NonSpendableTransaction[]> {
    const nonSpendableHistoryItems = railgunTransactions.filter(
      (historyItem) => {
        const allReceiveTypeAmounts = [
          ...historyItem.receiveERC20Amounts,
          ...historyItem.receiveNFTAmounts,
          ...historyItem.changeERC20Amounts,
        ];
        return allReceiveTypeAmounts.some(
          (receiveTypeAmount) => !receiveTypeAmount.hasValidPOIForActiveLists
        );
      }
    );

    const nonPOITransactions: Optional<NonSpendableTransaction>[] =
      await Promise.all(
        nonSpendableHistoryItems.map(async (historyItem) => {
          const transaction = await this.createNewSyncedTransaction(
            networkName,
            activeWallet,
            availableWallets,
            historyItem
          );
          if (!transaction) {
            return;
          }
          return {
            transaction,
            balanceBucket:
              this.getBalanceBucketForNonSpendableHistoryItem(historyItem),
          };
        })
      );

    return removeUndefineds(nonPOITransactions);
  }

  private getBalanceBucketForNonSpendableHistoryItem = (
    historyItem: TransactionHistoryItem
  ): RailgunWalletBalanceBucket => {
    for (const change of historyItem.changeERC20Amounts) {
      if (!change.hasValidPOIForActiveLists) {
        return RailgunWalletBalanceBucket.MissingInternalPOI;
      }
    }

    const allReceiveTypeAmounts = [
      ...historyItem.receiveERC20Amounts,
      ...historyItem.receiveNFTAmounts,
    ];

    const nonSpendableBalanceBuckets: RailgunWalletBalanceBucket[] = [];
    Object.values(RailgunWalletBalanceBucket).forEach((balanceBucket) => {
      if (isNonSpendableBucket(balanceBucket)) {
        nonSpendableBalanceBuckets.push(balanceBucket);
      }
    });

    for (const balanceBucket of nonSpendableBalanceBuckets) {
      if (
        allReceiveTypeAmounts.some(
          (receive) => receive.balanceBucket === balanceBucket
        )
      ) {
        return balanceBucket;
      }
    }

    return RailgunWalletBalanceBucket.Spendable;
  };

  private storeLatestSyncedBlockNumber = async (
    railgunTransactions: TransactionHistoryItem[]
  ) => {
    let latestSyncedBlockNumber = 0;
    railgunTransactions.forEach((transaction) => {
      if (
        isDefined(transaction.blockNumber) &&
        transaction.blockNumber > latestSyncedBlockNumber
      ) {
        latestSyncedBlockNumber = transaction.blockNumber;
      }
    });
    await LatestSyncedBlockNumberStore.store(latestSyncedBlockNumber);
  };

  private createERC20Token = async (
    networkName: NetworkName,
    availableWallets: Optional<AvailableWallet[]>,
    tokenAddress: string
  ): Promise<ERC20Token> => {
    const tokenAddressLowercase = tokenAddress.toLowerCase();

    const cachedToken = this.cachedTokenMap[tokenAddressLowercase];
    if (isDefined(cachedToken)) {
      return cachedToken;
    }

    const tokenAddressOnly: ERC20TokenAddressOnly = {
      isAddressOnly: true,
      address: tokenAddressLowercase,
      decimals: 0,
    };

    const matchingAddedToken: Optional<ERC20Token> = findMatchingAddedToken(
      tokenAddressOnly,
      availableWallets,
      networkName
    );
    if (matchingAddedToken) {
      this.cachedTokenMap[tokenAddressLowercase] = matchingAddedToken;
      return matchingAddedToken;
    }

    tokenAddressOnly.decimals = Number(
      await getERC20Decimals(networkName, tokenAddressLowercase)
    );

    this.cachedTokenMap[tokenAddressLowercase] = tokenAddressOnly;
    return tokenAddressOnly;
  };

  private createERC20Amount = async (
    networkName: NetworkName,
    availableWallets: Optional<AvailableWallet[]>,
    erc20Amount: RailgunHistoryERC20Amount
  ): Promise<ERC20Amount> => {
    const token = await this.createERC20Token(
      networkName,
      availableWallets,
      erc20Amount.tokenAddress
    );
    return {
      token,
      amountString: erc20Amount.amount.toString(),
    };
  };

  private createReceiveERC20Amount = async (
    networkName: NetworkName,
    availableWallets: Optional<AvailableWallet[]>,
    receiveERC20Amount: RailgunHistoryReceiveERC20Amount
  ): Promise<ReceiveERC20Amount> => {
    const erc20Amount = await this.createERC20Amount(
      networkName,
      availableWallets,
      receiveERC20Amount
    );
    return {
      token: erc20Amount.token,
      amountString: erc20Amount.amountString,
      memoText: receiveERC20Amount.memoText,
      senderAddress: receiveERC20Amount.senderAddress,
    };
  };

  private createTransferERC20Amount = async (
    networkName: NetworkName,
    availableWallets: Optional<AvailableWallet[]>,
    transferERC20Amount: RailgunHistorySendERC20Amount
  ): Promise<TransferRecipientERC20Amount> => {
    const erc20Amount = await this.createERC20Amount(
      networkName,
      availableWallets,
      transferERC20Amount
    );
    return {
      token: erc20Amount.token,
      amountString: erc20Amount.amountString,
      recipientAddress: transferERC20Amount.recipientAddress,
      memoText: transferERC20Amount.memoText,
    };
  };

  private createReceiveNFTAmountRecipient = (
    wallet: FrontendWallet,
    receiveNFTAmount: RailgunHistoryReceiveNFTAmount
  ): ReceiveNFTAmountRecipient => {
    return {
      nftAddress: receiveNFTAmount.nftAddress,
      nftTokenType: receiveNFTAmount.nftTokenType,
      tokenSubID: receiveNFTAmount.tokenSubID,
      amountString: receiveNFTAmount.amount.toString(),
      recipientAddress: wallet.railAddress,
      senderAddress: receiveNFTAmount.senderAddress,
    };
  };

  private createTransferNFTAmountRecipient = (
    nftSendAmount: RailgunHistorySendNFTAmount
  ): TransferNFTAmountRecipient => {
    return {
      nftAddress: nftSendAmount.nftAddress,
      nftTokenType: nftSendAmount.nftTokenType,
      tokenSubID: nftSendAmount.tokenSubID,
      amountString: nftSendAmount.amount.toString(),
      recipientAddress: nftSendAmount.recipientAddress ?? "",
    };
  };

  private shieldFeesFromReceiveERC20Amounts = async (
    networkName: NetworkName,
    availableWallets: Optional<AvailableWallet[]>,
    receiveERC20Amounts: RailgunHistoryReceiveERC20Amount[]
  ): Promise<ERC20Amount[]> => {
    const shieldFees: ERC20Amount[] = await Promise.all(
      receiveERC20Amounts
        .filter((receiveERC20Amount) => receiveERC20Amount.shieldFee)
        .map(async (receiveERC20Amount) => {
          const token = await this.createERC20Token(
            networkName,
            availableWallets,
            receiveERC20Amount.tokenAddress
          );
          return {
            token,
            amountString: receiveERC20Amount.shieldFee as string,
          };
        })
    );
    return shieldFees;
  };

  private unshieldFeesFromUnshieldERC20Amounts = async (
    networkName: NetworkName,
    availableWallets: Optional<AvailableWallet[]>,
    unshieldERC20Amounts: RailgunHistoryUnshieldERC20Amount[]
  ): Promise<ERC20Amount[]> => {
    const unshieldFees: ERC20Amount[] = await Promise.all(
      unshieldERC20Amounts
        .filter((unshieldERC20Amount) => unshieldERC20Amount.unshieldFee)
        .map(async (unshieldERC20Amount) => {
          const token = await this.createERC20Token(
            networkName,
            availableWallets,
            unshieldERC20Amount.tokenAddress
          );
          return {
            token,
            amountString: unshieldERC20Amount.unshieldFee as string,
          };
        })
    );
    return unshieldFees;
  };

  private createRailgunFeeTokenAmounts = async (
    networkName: NetworkName,
    availableWallets: Optional<AvailableWallet[]>,
    receiveERC20Amounts: RailgunHistoryReceiveERC20Amount[],
    unshieldERC20Amounts: RailgunHistoryUnshieldERC20Amount[]
  ): Promise<Optional<ERC20Amount[]>> => {
    const shieldFees: ERC20Amount[] =
      await this.shieldFeesFromReceiveERC20Amounts(
        networkName,
        availableWallets,
        receiveERC20Amounts
      );
    const unshieldFees: ERC20Amount[] =
      await this.unshieldFeesFromUnshieldERC20Amounts(
        networkName,
        availableWallets,
        unshieldERC20Amounts
      );
    const allRailgunFees = [...shieldFees, ...unshieldFees];
    if (allRailgunFees.length) {
      return allRailgunFees;
    }
    return undefined;
  };

  private static extractMemo(
    receiveERC20Amounts: ReceiveERC20Amount[],
    transferERC20Amounts: TransferRecipientERC20Amount[],
    receiveNFTAmountRecipients: ReceiveNFTAmountRecipient[],
    transferNFTAmountRecipients: TransferNFTAmountRecipient[]
  ): Optional<string> {
    for (const tokenAmount of [
      ...receiveERC20Amounts,
      ...transferERC20Amounts,
      ...receiveNFTAmountRecipients,
      ...transferNFTAmountRecipients,
    ]) {
      if (isDefined(tokenAmount.memoText)) {
        return tokenAmount.memoText;
      }
    }
    return undefined;
  }

  private async createNewSyncedTransaction(
    networkName: NetworkName,
    activeWallet: FrontendWallet,
    availableWallets: AvailableWallet[],
    railgunTransaction: TransactionHistoryItem
  ): Promise<Optional<SavedTransaction>> {
    try {
      const receiveERC20Amounts: ReceiveERC20Amount[] = await Promise.all(
        railgunTransaction.receiveERC20Amounts.map((ta) =>
          this.createReceiveERC20Amount(networkName, availableWallets, ta)
        )
      );
      const transferERC20Amounts: TransferRecipientERC20Amount[] =
        await Promise.all(
          [
            ...railgunTransaction.transferERC20Amounts,
            ...railgunTransaction.unshieldERC20Amounts,
          ].map((ta) =>
            this.createTransferERC20Amount(networkName, availableWallets, ta)
          )
        );

      const receiveNFTAmountRecipients: ReceiveNFTAmountRecipient[] =
        railgunTransaction.receiveNFTAmounts.map((nftReceiveAmount) =>
          this.createReceiveNFTAmountRecipient(activeWallet, nftReceiveAmount)
        );
      const transferNFTAmountRecipients: TransferNFTAmountRecipient[] = [
        ...railgunTransaction.transferNFTAmounts,
        ...railgunTransaction.unshieldNFTAmounts,
      ].map((nftSendAmount) =>
        this.createTransferNFTAmountRecipient(nftSendAmount)
      );

      const broadcasterFeeERC20Amount: Optional<ERC20Amount> =
        railgunTransaction.broadcasterFeeERC20Amount
          ? await this.createERC20Amount(
              networkName,
              availableWallets,
              railgunTransaction.broadcasterFeeERC20Amount
            )
          : undefined;

      const memoText = RailgunTransactionHistoryService.extractMemo(
        receiveERC20Amounts,
        transferERC20Amounts,
        receiveNFTAmountRecipients,
        transferNFTAmountRecipients
      );

      const railgunFeeTokenAmounts = await this.createRailgunFeeTokenAmounts(
        networkName,
        availableWallets,
        railgunTransaction.receiveERC20Amounts,
        railgunTransaction.unshieldERC20Amounts
      );

      const transaction: SavedTransaction = {
        txidVersion: railgunTransaction.txidVersion,
        walletAddress: activeWallet.railAddress,
        publicExecutionWalletAddress: undefined,
        tokenAmounts: transferERC20Amounts,
        nftAmountRecipients: transferNFTAmountRecipients,
        syncedReceiveTokenAmounts: receiveERC20Amounts,
        syncedReceiveNFTAmountRecipients: receiveNFTAmountRecipients,
        broadcasterFeeTokenAmount: broadcasterFeeERC20Amount,
        railFeeTokenAmounts: railgunFeeTokenAmounts,
        network: networkName,
        timestamp:
          railgunTransaction.timestamp ??
          SharedConstants.TIMESTAMP_MISSING_VALUE,
        id: railgunTransaction.txid,
        action: TransactionAction.synced,
        status: TransactionStatus.completed,
        sentViaBroadcaster: isDefined(broadcasterFeeERC20Amount),
        isPrivate: true,
        syncedFromRailgun: true,
        foundBySync: true,
        syncedHistoryVersion: railgunTransaction.version,
        syncedCategory: railgunTransaction.category,
        memoText,
      };

      if (
        transaction.timestamp === SharedConstants.TIMESTAMP_MISSING_VALUE &&
        this.lookupMissingTimestampCount <
          SharedConstants.MAX_TIMESTAMP_ARCHIVE_NODE_LOOP_LOOKUPS
      ) {
        this.lookupMissingTimestampCount += 1;

        const transactionReceiptDetails: Optional<TransactionReceiptDetails> =
          await this.txReceiptDetailsService.getTransactionReceiptDetails(
            networkName,
            railgunTransaction.txid
          );

        if (transactionReceiptDetails) {
          transaction.timestamp = transactionReceiptDetails.timestamp;
          transaction.publicExecutionGasFeeString =
            transactionReceiptDetails.gasFeeString;
        }
      }
      if (transaction.timestamp === SharedConstants.TIMESTAMP_MISSING_VALUE) {
        logDev(
          `Add missing timestamp transaction: txid ${railgunTransaction.txid}`
        );
        this.savedTransactionStore.addMissingTimestampTransaction(
          transaction,
          networkName
        );
        return;
      }

      return transaction;
    } catch (cause) {
      if (!(cause instanceof Error)) {
        throw cause;
      }
      logDev(new Error(`Cannot sync transaction`, { cause }));
      return undefined;
    }
  }

  private hasNoFullMatchingSavedTransaction(
    historyItem: TransactionHistoryItem,
    savedTransactions: SavedTransaction[]
  ): boolean {
    return (
      savedTransactions.find((tx) => {
        return tx.id.toLowerCase() === historyItem.txid.toLowerCase();
      }) == null
    );
  }

  private async updateLocalTransactionsFoundBySync(
    railgunTransactions: TransactionHistoryItem[],
    savedTransactions: SavedTransaction[],
    networkName: NetworkName
  ): Promise<void> {
    await Promise.all(
      savedTransactions.map((tx) =>
        this.markSavedTransactionFoundBySync(
          railgunTransactions,
          tx,
          networkName
        )
      )
    );
  }

  private async markSavedTransactionFoundBySync(
    railgunTransactions: TransactionHistoryItem[],
    tx: SavedTransaction,
    networkName: NetworkName
  ) {
    if (tx.foundBySync ?? false) {
      return;
    }
    if (!tx.sentViaBroadcaster) {
      return;
    }

    const found = railgunTransactions.find((railgunTx) => {
      return railgunTx.txid.toLowerCase() === tx.id.toLowerCase();
    });
    if (found) {
      await this.savedTransactionStore.updateTransactionFoundBySync(
        tx.id,
        networkName
      );
    }
  }
}
