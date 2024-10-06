import {
  Chain,
  isDefined,
  Network,
  RailgunWalletBalanceBucket,
  TransactionReceiptLog,
  TXIDVersion,
} from "@railgun-community/shared-models";
import { TransactionReceipt } from "ethers";
import { getPOIRequiredForNetwork } from "../../bridge/bridge-poi";
import { SharedConstants } from "../../config/shared-constants";
import { ToastType } from "../../models/toast";
import { ERC20Amount } from "../../models/token";
import {
  SavedTransaction,
  TransactionAction,
  TransactionStatus,
} from "../../models/transaction";
import { openShieldPOICountdownToast } from "../../redux-store";
import { setTransactions } from "../../redux-store/reducers/saved-transactions-reducer";
import { enqueueAsyncToast } from "../../redux-store/reducers/toast-reducer";
import { AppDispatch } from "../../redux-store/store";
import { logDev, logDevError } from "../../utils/logging";
import { poll } from "../../utils/promises";
import {
  getSavedTransactionTXIDVersion,
  transactionShouldNavigateToPrivateBalance,
} from "../../utils/saved-transactions";
import { stringifySafe } from "../../utils/stringify";
import { createNavigateToTokenInfoActionData } from "../../utils/tokens";
import { findTokenTransferAmountFromReceipt } from "../../utils/tx-receipt-parser";
import {
  capitalize,
  generateKey,
  shortenWalletAddress,
} from "../../utils/util";
import { SavedTransactionStore } from "../history/saved-transaction-store";
import { TransactionReceiptDetailsService } from "../history/transaction-receipt-details-service";
import { ProviderService } from "../providers/provider-service";
import { pullActiveWalletBalancesForNetwork } from "../wallet/wallet-balance-service";
import { storeShieldCountdownTx } from "./poi-shield-countdown";

type RelayAdaptErrorGetter = (
  txidVersion: TXIDVersion,
  receiptLogs: TransactionReceiptLog[]
) => Promise<Optional<string>>;
type ScanRailgunHistoryTrigger = (
  chain: Chain,
  railgunWalletIdFilter: Optional<string[]>
) => Promise<void>;

type TxWatcherDataStore = MapType<MapType<string>>;

export class PendingTransactionWatcher {
  private static isStarted = false;

  private static dispatch: AppDispatch;
  private static getRelayAdaptTransactionError: RelayAdaptErrorGetter;
  private static scanRailgunHistoryTrigger: ScanRailgunHistoryTrigger;

  private static watchingTransactionHashes: TxWatcherDataStore = {};
  private static ongoingPollIds: TxWatcherDataStore = {};

  static start(
    dispatch: AppDispatch,
    getRelayAdaptTransactionError: RelayAdaptErrorGetter,
    scanRailgunHistoryTrigger: ScanRailgunHistoryTrigger
  ) {
    this.dispatch = dispatch;
    this.getRelayAdaptTransactionError = getRelayAdaptTransactionError;
    this.scanRailgunHistoryTrigger = scanRailgunHistoryTrigger;
    this.isStarted = true;
  }

  static async loadTransactionsAndWatchPending(network: Network) {
    const networkName = network.name;

    const savedTransactionStore = new SavedTransactionStore(this.dispatch);
    const transactions = await savedTransactionStore.fetchTransactions(
      networkName
    );
    this.dispatch(setTransactions({ networkName, transactions }));

    this.watchPendingTransactions(transactions, network);
  }

  static watchPendingTransactions(
    transactions: SavedTransaction[],
    network: Network
  ) {
    this.removeAllWatchingTransactions(network);
    this.invalidateAllPolls(network);

    const now = Date.now() / 1000;
    for (const tx of transactions) {
      if (
        tx.status === TransactionStatus.pending ||
        (tx.status === TransactionStatus.timedOut &&
          now - tx.timestamp < SharedConstants.TIMEOUT_SEC_WATCH_TX_EXPIRATION)
      ) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.watchPendingTransaction(network, tx);
      }
    }
  }

  private static async pollForPendingTransaction(
    network: Network,
    txHash: string,
    timeoutMinutes: number
  ): Promise<TransactionReceipt> {
    this.ongoingPollIds[network.name] ??= {};
    const ongoingPollIdsForNetwork = this.ongoingPollIds[network.name];
    if (!isDefined(ongoingPollIdsForNetwork)) {
      throw new Error("Poll ID data store not initialized.");
    }

    const pollId = generateKey();
    ongoingPollIdsForNetwork[pollId] = pollId;

    const networkName = network.name;

    const pollRetryDelaySec = SharedConstants.RETRY_DELAY_SEC_GET_TX_FROM_HASH;
    const pollRetryDelayMsec = pollRetryDelaySec * 1000;
    const pollAttempts = (60 * timeoutMinutes) / pollRetryDelaySec;
    const txReceipt = await poll<Optional<TransactionReceipt>>(
      async () => {
        logDev(`[TransactionWatcher] Polling... Tx hash: ${txHash}`);
        const provider = await ProviderService.getProvider(networkName);
        logDev(
          `[TransactionWatcher] Polling... Found provider. Tx hash: ${txHash}`
        );
        if (provider == null) {
          return undefined;
        }
        const txRes = await provider.getTransactionReceipt(txHash);
        if (txRes == null) {
          return undefined;
        }
        logDev(
          `[TransactionWatcher] Polling... Tx receipt response returned. Tx hash: ${txHash}. Tx receipt: ${stringifySafe(
            txRes
          )}`
        );
        return txRes;
      },
      (result: Optional<TransactionReceipt>) =>
        isDefined(result) ||
        !isDefined(this.watchingTransactionHashes[network.name]?.[txHash]) ||
        !isDefined(ongoingPollIdsForNetwork[pollId]),
      pollRetryDelayMsec,
      pollAttempts
    );

    if (!isDefined(ongoingPollIdsForNetwork[pollId])) {
      throw new Error(SharedConstants.POLL_INVALIDATED_ERROR);
    }

    this.invalidatePoll(pollId, network);

    if (!txReceipt) {
      throw new Error("Tx receipt watcher timed out.");
    }

    return txReceipt;
  }

  static async watchPendingTransaction(
    network: Network,
    tx: SavedTransaction
  ): Promise<void> {
    if (!this.isStarted) {
      throw new Error(
        "[TransactionWatcher] TransactionWatcher needs to be started."
      );
    }

    this.watchingTransactionHashes[network.name] ??= {};
    const watchingTransactionHashesForNetwork =
      this.watchingTransactionHashes[network.name];
    if (!isDefined(watchingTransactionHashesForNetwork)) {
      throw new Error("Tx hash data store not initialized.");
    }

    const txHash = tx.id;
    logDev(
      `[TransactionWatcher] Starting transaction watcher. Tx hash: ${txHash}`
    );
    if (isDefined(watchingTransactionHashesForNetwork[txHash])) {
      logDev(
        `[TransactionWatcher] Already watching transaction. Returning early. Tx hash: ${txHash}`
      );
      return;
    }

    watchingTransactionHashesForNetwork[txHash] = txHash;

    const timeoutMinutes = SharedConstants.TIMEOUT_MIN_WATCH_PENDING_PROMISE;

    let txReceipt: TransactionReceipt;

    try {
      txReceipt = await this.pollForPendingTransaction(
        network,
        txHash,
        timeoutMinutes
      );
    } catch (error) {
      if (
        !isDefined(watchingTransactionHashesForNetwork[txHash]) ||
        error.message === SharedConstants.POLL_INVALIDATED_ERROR
      ) {
        logDevError(
          new Error(
            `[TransactionWatcher] Poller was invalidated. Tx hash: ${txHash}`,
            { cause: error }
          )
        );
        return;
      }

      logDevError(
        new Error(`Error watching pending transaction: ${txHash}`, {
          cause: error,
        })
      );
      this.removeFromWatchingTransactions(txHash, network);

      if (tx.status === TransactionStatus.pending) {
        const timedOut = true;
        await this.transactionFailed(network, tx, txHash, timedOut);
      }

      logDev(
        `[TransactionWatcher] Retrying transaction watcher. Tx hash: ${txHash}`
      );
      return this.watchPendingTransaction(network, tx);
    }

    if (!isDefined(watchingTransactionHashesForNetwork[txHash])) {
      logDev(
        `[TransactionWatcher] Poller returned successfully, but we are no longer watching this transaction. Tx hash: ${txHash}`
      );
      return;
    }

    logDev(
      `[TransactionWatcher] Poller found tx receipt. Tx hash: ${txHash}. Tx receipt: ${stringifySafe(
        txReceipt
      )}`
    );

    try {
      await this.handleFinishedTransaction(
        network,
        tx,
        txHash,
        txReceipt,
        tx.nonce
      );
    } catch (err) {
      const error = new Error(
        `[TransactionWatcher] Transaction watcher error`,
        {
          cause: err,
        }
      );

      logDevError(error);

      this.removeFromWatchingTransactions(txHash, network);
      if (!(err instanceof Error)) {
        throw err;
      }

      if (err.message.toLowerCase().includes("transaction failed")) {
        return this.transactionFailed(network, tx, txHash);
      }
      throw error;
    }
  }

  private static validateRelayAdaptTransaction(
    tx: SavedTransaction,
    txReceipt: TransactionReceipt
  ): Promise<Optional<string>> {
    if (!(tx.needsRelayAdaptSuccessCheck ?? false)) {
      return Promise.resolve(undefined);
    }

    const txReceiptLogs: TransactionReceiptLog[] = txReceipt.logs.map(
      (log) => ({
        topics: log.topics as string[],
        data: log.data,
      })
    );

    return this.getRelayAdaptTransactionError(
      getSavedTransactionTXIDVersion(tx),
      txReceiptLogs
    );
  }

  private static async handleFinishedTransaction(
    network: Network,
    tx: SavedTransaction,
    txHash: string,
    txReceipt: TransactionReceipt,
    nonce: Optional<number>
  ) {
    logDev(
      `[TransactionWatcher] Handling finished transaction. Tx hash: ${txHash}`
    );
    if (!isDefined(this.watchingTransactionHashes[network.name]?.[txHash])) {
      logDev(
        `[TransactionWatcher] No longer watching this transaction. Tx hash: ${txHash}`
      );
      return;
    }

    const networkName = network.name;
    this.removeFromWatchingTransactions(txHash, network);

    if (txReceipt.status !== 1) {
      logDevError(
        new Error(`[TransactionWatcher] Transaction failed. Tx hash: ${txHash}`)
      );
      return this.transactionFailed(network, tx, txHash);
    }

    let updatedSwapBuyTokenAmount: Optional<ERC20Amount>;
    if (tx.action === TransactionAction.swap && tx.swapBuyTokenAmount) {
      logDev(
        `[TransactionWatcher] Finding token transfer amount from receipt... Tx hash: ${txHash}`
      );
      updatedSwapBuyTokenAmount = await findTokenTransferAmountFromReceipt(
        txReceipt,
        tx.swapBuyTokenAmount,
        tx.walletAddress,
        tx.isPrivate
      );
    }

    logDev(
      `[TransactionWatcher] Validating relay adapt transaction... Tx hash: ${txHash}`
    );
    const relayAdaptError = await this.validateRelayAdaptTransaction(
      tx,
      txReceipt
    );
    if (isDefined(relayAdaptError)) {
      logDev(
        `[TransactionWatcher] Transaction succeeded, but validation failed: ${txHash}`
      );
      const timedOut = false;
      return this.transactionFailed(
        network,
        tx,
        txHash,
        timedOut,
        relayAdaptError
      );
    }

    logDev(
      `[TransactionWatcher] Transaction succeeded. Pulling balanaces Tx hash: ${txHash}`
    );

    await Promise.all([
      pullActiveWalletBalancesForNetwork(this.dispatch, network),

      this.scanRailgunHistoryTrigger(network.chain, undefined),
    ]);

    const toastSubtext = `${network.publicName} | ${shortenWalletAddress(
      tx.walletAddress
    )}`;
    const firstToken = tx.tokenAmounts.length
      ? tx.tokenAmounts[0].token
      : undefined;

    const isRailgun = transactionShouldNavigateToPrivateBalance(tx);
    const toastActionData = firstToken
      ? createNavigateToTokenInfoActionData(
          networkName,
          firstToken,
          isRailgun,
          [RailgunWalletBalanceBucket.Spendable]
        )
      : undefined;

    const savedTransactionStore = new SavedTransactionStore(this.dispatch);

    const isCancelling = false;

    if (
      tx.action === TransactionAction.cancel &&
      isDefined(tx.cancelTransactionID)
    ) {
      this.dispatch(
        enqueueAsyncToast({
          message: `Transaction${
            isDefined(nonce) ? ` ${nonce}` : ""
          } cancelled.`,
          subtext: toastSubtext,
          type: ToastType.Error,
          networkName,
          actionData: toastActionData,
        })
      );

      const gasFee = TransactionReceiptDetailsService.getGasFee(txReceipt);

      await savedTransactionStore.updateTransactionStatus(
        tx.cancelTransactionID,
        networkName,
        TransactionStatus.cancelled,
        gasFee
      );

      await savedTransactionStore.updateTransactionStatus(
        txHash,
        networkName,
        TransactionStatus.completed,
        gasFee,
        undefined,
        isCancelling,
        updatedSwapBuyTokenAmount
      );
      return;
    }
    this.dispatch(
      enqueueAsyncToast({
        message: tx.sentViaBroadcaster
          ? `Success: ${capitalize(tx.action)} through Broadcaster.`
          : `Success: ${capitalize(tx.action)} transaction${
              isDefined(nonce) ? `: ${nonce}` : ""
            }.`,
        subtext: toastSubtext,
        type: ToastType.Success,
        networkName: networkName,
        actionData: toastActionData,
      })
    );

    if (tx.action === TransactionAction.shield) {
      const poiRequired = await getPOIRequiredForNetwork(tx.network);
      if (poiRequired) {
        const shieldCountdownTx = {
          networkName: tx.network,
          id: tx.id,
          timestamp: tx.timestamp,
        };
        this.dispatch(openShieldPOICountdownToast(shieldCountdownTx));

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        storeShieldCountdownTx(shieldCountdownTx);
      }
    }

    logDev(
      `[TransactionWatcher] Updating successful transaction status. Tx hash: ${txHash}`
    );

    const gasFee = TransactionReceiptDetailsService.getGasFee(txReceipt);

    await savedTransactionStore.updateTransactionStatus(
      txHash,
      networkName,
      TransactionStatus.completed,
      gasFee,
      undefined,
      isCancelling,
      updatedSwapBuyTokenAmount
    );
  }

  private static async transactionFailed(
    network: Network,
    tx: SavedTransaction,
    txHash: string,
    timedOut: boolean = false,
    failedErrorMessage?: string
  ) {
    logDev(`Transaction failed: ${txHash}`);

    const firstToken = tx.tokenAmounts.length
      ? tx.tokenAmounts[0].token
      : undefined;

    const isRailgun = transactionShouldNavigateToPrivateBalance(tx);

    const nonce = tx.nonce;
    let message = isDefined(nonce)
      ? `Transaction ${nonce} failed`
      : "Transaction failed";
    if (timedOut) {
      message = isDefined(nonce)
        ? `Transaction ${nonce} timed out`
        : "Transaction timed out";
    }

    this.dispatch(
      enqueueAsyncToast({
        message,
        subtext: `${network.publicName} | ${shortenWalletAddress(
          tx.walletAddress
        )}`,
        type: ToastType.Error,
        actionData: firstToken
          ? createNavigateToTokenInfoActionData(
              network.name,
              firstToken,
              isRailgun,
              [RailgunWalletBalanceBucket.Spendable]
            )
          : undefined,
      })
    );

    const savedTransactionStore = new SavedTransactionStore(this.dispatch);
    await savedTransactionStore.updateTransactionAsFailed(
      txHash,
      network.name,
      tx.walletAddress,
      undefined,
      timedOut,
      failedErrorMessage
    );
  }

  private static removeFromWatchingTransactions(
    txHash: string,
    network: Network
  ) {
    delete this.watchingTransactionHashes[network.name]?.[txHash];
  }

  private static removeAllWatchingTransactions(network: Network) {
    this.watchingTransactionHashes[network.name] = {};
  }

  private static invalidatePoll(pollId: string, network: Network) {
    delete this.ongoingPollIds[network.name]?.[pollId];
  }

  private static invalidateAllPolls(network: Network) {
    this.ongoingPollIds[network.name] = {};
  }
}
