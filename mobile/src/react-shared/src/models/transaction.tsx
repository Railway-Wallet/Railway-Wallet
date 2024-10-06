import {
  NetworkName,
  NFTAmount,
  NFTAmountRecipient,
  RailgunERC20Amount,
  RailgunWalletBalanceBucket,
  TransactionGasDetails,
  TransactionHistoryItem,
  TransactionHistoryItemCategory,
  TXIDVersion,
} from "@railgun-community/shared-models";
import { LiquidityV2PoolSerialized } from "./liquidity-pool";
import { ERC20Amount } from "./token";
import { Vault } from "./vault";

export enum TransactionStatus {
  pending = "pending",
  completed = "completed",
  failed = "failed",
  cancelled = "cancelled",
  timedOut = "timedOut",
}

export enum TransactionAction {
  send = "send",
  receive = "receive",
  shield = "shield",
  unshield = "unshield",
  swap = "swap",
  approve = "approve",
  mint = "mint",
  cancel = "cancel",
  synced = "synced",
  farmDeposit = "farm deposit",
  farmRedeem = "farm redemption",
  addLiquidity = "add liquidity",
  removeLiquidity = "remove liquidity",
}

export enum TransactionType {
  ApproveShield = "Approve Shield",
  Shield = "Shield",
  Unshield = "Unshield",
  Send = "Send",
  Swap = "Swap",
  ApproveSpender = "ApproveSpender",
  Mint = "Mint",
  Cancel = "Cancel",
  FarmDeposit = "Farm Deposit",
  FarmRedeem = "Farm Redeem",
  AddLiquidity = "Add Liquidity",
  RemoveLiquidity = "Remove Liquidity",
}

export type TransactionReceiptTransfer = {
  tokenAddress: string;
  amount: bigint;
  toAddress: string;
  fromAddress: string;
};

export type TransferRecipientERC20Amount = ERC20Amount & {
  recipientAddress?: string;
  externalUnresolvedToWalletAddress?: string;
  memoText?: string;
};

export type ReceiveERC20Amount = ERC20Amount & {
  senderAddress: Optional<string>;
  memoText: Optional<string>;
};

export type TransferNFTAmountRecipient = NFTAmountRecipient & {
  memoText?: string;
};

export type ReceiveNFTAmountRecipient = NFTAmountRecipient & {
  senderAddress: Optional<string>;
  memoText?: string;
};

export type NonSpendableTransaction = {
  balanceBucket: RailgunWalletBalanceBucket;
  transaction: SavedTransaction;
};

export type SavedTransaction = {
  id: string;
  status: TransactionStatus;
  action: TransactionAction;
  network: NetworkName;
  sentViaBroadcaster: boolean;
  isPrivate: boolean;
  vault?: Vault;
  pool?: LiquidityV2PoolSerialized;
  tokenAmounts: TransferRecipientERC20Amount[];
  nftAmountRecipients: Optional<TransferNFTAmountRecipient[]>;
  walletAddress: string;
  toWalletAddress?: string;
  publicExecutionWalletAddress: Optional<string>;
  publicExecutionGasFeeString?: string;
  timestamp: number;
  railFeeTokenAmounts?: ERC20Amount[];
  broadcasterFeeTokenAmount?: ERC20Amount;
  gasDetails?: TransactionGasDetails;
  spender?: string;
  spenderName?: string;
  cancelling?: boolean;
  cancelTransactionID?: string;
  nonce?: number;
  swapSellTokenAmount?: ERC20Amount;
  swapBuyTokenAmount?: ERC20Amount;
  confirmedSwapValue?: boolean;
  needsRelayAdaptSuccessCheck?: boolean;
  isBaseTokenDepositWithdraw?: boolean;
  syncedFromRailgun?: boolean;
  syncedReceiveTokenAmounts?: ReceiveERC20Amount[];
  syncedReceiveNFTAmountRecipients?: ReceiveNFTAmountRecipient[];
  syncedHistoryVersion?: number;
  syncedCategory?: TransactionHistoryItemCategory;
  foundBySync?: boolean;
  memoText?: string;
  failedErrorMessage?: string;
  externalUnresolvedToWalletAddress?: string;
  broadcasterRailgunAddress?: string;
  balanceBucket?: RailgunWalletBalanceBucket;
  pendingSpentPOI?: boolean;
  txidVersion: Optional<TXIDVersion>;
};
export type KoinlyExportERC20Info = {
  symbol: string;
  amount: string;
};

export type ExportedSavedTransaction = {
  hash: string;
  statusText: string;
  action: string;
  link: Optional<string>;
  networkPublicName: string;
  publicPrivateType: string;
  walletAddress: string;
  utcDate: string;
  toWalletAddresses: Optional<string>;
  publicExecutionWalletAddress: Optional<string>;
  readableTransactionText: string;
  readableFeeText: Optional<string>;
  readableGasFee: Optional<string>;
  readableBroadcasterFeeText: Optional<string>;
  memoText: Optional<string>;
  spender: Optional<string>;
  spenderName: Optional<string>;
  nonceText: Optional<string>;
  confirmedSwapValueText: Optional<string>;
  syncedHistoryVersionText: Optional<string>;
};

export type KoinlyTransaction = {
  receivedAmount: string;
  sentAmount: string;
  feeAmount: string;
  utcDate: string;
  receivedCurrency: string;
  sentCurrency: string;
  feeCurrency: string;
  description: string;
  label: string;
  hash: string;
  network: string;
};

export enum KoinlyTransactionLabel {
  RegularDepositWithdrawalTrade = "",
  Gift = "gift",
  Stake = "stake",
  Lost = "lost",
  Cost = "cost",
  MarginFee = "margin fee",
  Airdrop = "airdrop",
  Fork = "fork",
  Mining = "mining",
  Reward = "reward",
  OtherIncome = "income",
  LoanInterest = "loan interest",
  RealizedGain = "realized gain",
  Unstake = "unstake",
  Swap = "swap",
  LiquidityIn = "liquidity in",
  LiquidityOut = "liquidity out",
}
export type TransactionReceiptDetails = {
  timestamp: number;
  gasFeeString: string;
};

export type TransactionHistoryItemWithReceiptData = TransactionHistoryItem &
  TransactionReceiptDetails;

export type RailgunERC20AmountWithMemoText = RailgunERC20Amount & {
  memoText?: string;
};

export type TransactionSentReceivedSingleERC20 = {
  sent: RailgunERC20AmountWithMemoText[];
  received: RailgunERC20AmountWithMemoText[];
};

export type TransactionNFTAmountWithMemoText = NFTAmount & {
  memoText: Optional<string>;
};
