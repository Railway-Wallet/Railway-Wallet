import {
  isDefined,
  Network,
  NETWORK_CONFIG,
  removeUndefineds,
} from "@railgun-community/shared-models";
import { SharedConstants } from "../config";
import {
  ExportedSavedTransaction,
  SavedTransaction,
  TransactionStatus,
} from "../models/transaction";
import { AvailableWallet, FrontendWallet } from "../models/wallet";
import { transactionLinkOnExternalScanSite } from "../services/api/etherscan/transaction-scan-lookup";
import { TransactionReceiptDetailsService } from "../services/history/transaction-receipt-details-service";
import {
  broadcasterFeeTransactionText,
  getGasFeeText,
  railgunFeeTransactionText,
  transactionText,
} from "./saved-transactions";

const boolToText = (bool?: boolean) => {
  if (!isDefined(bool)) {
    return "";
  }
  return bool ? "Yes" : "No";
};

const numToText = (num?: number) => {
  return isDefined(num) ? String(num) : undefined;
};

const timestampToText = (timestamp: number) => {
  return timestamp === SharedConstants.TIMESTAMP_MISSING_VALUE
    ? "Unknown"
    : new Date(timestamp * 1000).toLocaleString();
};

const exportedStatusText = (tx: SavedTransaction) => {
  switch (tx.status) {
    case TransactionStatus.completed:
      return "Complete";
    case TransactionStatus.failed:
    case TransactionStatus.timedOut:
      return "Error";
    case TransactionStatus.pending:
      return "Pending";
    case TransactionStatus.cancelled:
      return "Cancelled";
  }
};

const toWalletAddresses = (tx: SavedTransaction): Optional<string[]> => {
  if (isDefined(tx.toWalletAddress)) {
    return [tx.toWalletAddress];
  }

  const recipientAddresses = removeUndefineds(
    tx.tokenAmounts.map((ta) => ta.recipientAddress)
  );
  return recipientAddresses;
};

export const convertToExportedTransactions = (
  transactions: SavedTransaction[],
  network: Network,
  activeWallet: FrontendWallet,
  availableWallets: AvailableWallet[]
): Promise<ExportedSavedTransaction[]> => {
  const txReceiptDetailsService = new TransactionReceiptDetailsService();

  return Promise.all(
    transactions.map((tx) => {
      return convertToExportedTransaction(
        tx,
        activeWallet,
        availableWallets,
        network,
        txReceiptDetailsService
      );
    })
  );
};

export const convertToExportedTransaction = async (
  tx: SavedTransaction,
  activeWallet: FrontendWallet,
  availableWallets: AvailableWallet[],
  network: Network,
  txReceiptDetailsService: TransactionReceiptDetailsService
): Promise<ExportedSavedTransaction> => {
  const isRailgun = true;
  const receiptDetails =
    await txReceiptDetailsService.getTransactionReceiptDetails(
      network.name,
      tx.id
    );
  const broadcasterFee = broadcasterFeeTransactionText(
    tx,
    activeWallet,
    availableWallets
  );

  return {
    hash: tx.id,
    action: tx.action,
    statusText: exportedStatusText(tx),
    link: transactionLinkOnExternalScanSite(tx.network, tx.id),
    networkPublicName: NETWORK_CONFIG[tx.network].publicName,
    publicPrivateType: tx.isPrivate ? "Private" : "Public",
    walletAddress: tx.walletAddress,
    utcDate: timestampToText(tx.timestamp),
    readableTransactionText: transactionText(
      tx,
      isRailgun,
      network,
      activeWallet,
      availableWallets
    ),
    readableBroadcasterFeeText: broadcasterFee,
    readableFeeText: railgunFeeTransactionText(tx, availableWallets),
    readableGasFee: getGasFeeText(
      network,
      tx,
      receiptDetails?.gasFeeString,
      broadcasterFee
    ),
    memoText: tx.memoText,
    toWalletAddresses: toWalletAddresses(tx)?.join(", "),
    publicExecutionWalletAddress: tx.publicExecutionWalletAddress,
    spender: tx.spender,
    spenderName: tx.spenderName,
    nonceText: numToText(tx.nonce),
    confirmedSwapValueText: boolToText(tx.confirmedSwapValue),
    syncedHistoryVersionText: numToText(tx.syncedHistoryVersion),
  };
};
