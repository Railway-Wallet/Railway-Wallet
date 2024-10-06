import {
  NetworkName,
  NFTAmountRecipient,
  ProofType,
  SelectedBroadcaster,
} from "@railgun-community/shared-models";
import { ERC20Amount, ERC20AmountRecipient } from "./token";
import { AvailableWallet } from "./wallet";

export type PerformGenerateProofType = (
  finalERC20AmountRecipients: ERC20AmountRecipient[],
  nftAmountRecipients: NFTAmountRecipient[],
  selectedBroadcaster: Optional<SelectedBroadcaster>,
  broadcasterFeeERC20Amount: Optional<ERC20Amount>,
  publicWalletOverride: Optional<AvailableWallet>,
  showSenderAddressToRecipient: boolean,
  memoText: Optional<string>,
  overallBatchMinGasPrice: Optional<bigint>,
  success: () => void,
  fail: (err: Error) => void
) => Promise<void>;

export type ValidateProvedTransactionType = (
  networkName: NetworkName,
  proofType: ProofType,
  railWalletID: string,
  showSenderAddressToRecipient: boolean,
  memoText: Optional<string>,
  finalERC20AmountRecipients: ERC20AmountRecipient[],
  nftAmountRecipients: NFTAmountRecipient[],
  broadcasterFeeERC20AmountRecipient: Optional<ERC20AmountRecipient>,
  sendWithPublicWallet: boolean,
  overallBatchMinGasPrice: Optional<bigint>
) => Promise<void>;
