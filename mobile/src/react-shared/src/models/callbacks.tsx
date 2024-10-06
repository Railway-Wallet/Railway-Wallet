import {
  Chain,
  FeeTokenDetails,
  NetworkName,
  NFTAmountRecipient,
  SelectedBroadcaster,
  TransactionGasDetails,
  TXIDVersion,
} from "@railgun-community/shared-models";
import {
  AdjustedERC20AmountRecipientGroup,
  ERC20Amount,
  ERC20AmountRecipient,
} from "./token";
import { AvailableWallet } from "./wallet";

export type PerformTransactionType = (
  finalAdjustedERC20AmountRecipientGroup: AdjustedERC20AmountRecipientGroup,
  nftAmountRecipients: NFTAmountRecipient[],
  selectedBroadcaster: Optional<SelectedBroadcaster>,
  broadcasterFeeERC20Amount: Optional<ERC20Amount>,
  transactionGasDetails: TransactionGasDetails,
  customNonce: Optional<number>,
  publicWalletOverride: Optional<AvailableWallet>,
  showSenderAddressToRecipient: boolean,
  memoText: Optional<string>,
  success: () => void,
  error: (err: Error, isBroadcasterError?: boolean) => void
) => Promise<Optional<string>>;

export type GetGasEstimateSelfSigned = (
  txidVersion: TXIDVersion,
  networkName: NetworkName,
  fromWalletAddress: string,
  erc20AmountRecipients: ERC20AmountRecipient[],
  nftAmountRecipients: NFTAmountRecipient[]
) => Promise<bigint>;

export type GetGasEstimateProofRequired = (
  txidVersion: TXIDVersion,
  networkName: NetworkName,
  railWalletID: string,
  memoText: Optional<string>,
  erc20AmountRecipients: ERC20AmountRecipient[],
  nftAmountRecipients: NFTAmountRecipient[],
  originalGasDetails: TransactionGasDetails,
  feeTokenDetails: Optional<FeeTokenDetails>,
  sendWithPublicWallet: boolean
) => Promise<bigint>;

export type FindBestBroadcaster = (
  chain: Chain,
  tokenAddress: string,
  useRelayAdapt: boolean
) => Promise<Optional<SelectedBroadcaster>>;

export type FindAllBroadcastersForToken = (
  chain: Chain,
  tokenAddress: string,
  useRelayAdapt: boolean
) => Promise<Optional<SelectedBroadcaster[]>>;

export type UpdateBroadcasterAddressFilters = (
  allowlist: Optional<string[]>,
  blocklist: Optional<string[]>
) => Promise<void>;
