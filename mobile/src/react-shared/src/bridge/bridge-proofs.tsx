import {
  NetworkName,
  NFTAmount,
  NFTAmountRecipient,
  ProofType,
  RailgunERC20Amount,
  RailgunERC20Recipient,
  TXIDVersion,
} from "@railgun-community/shared-models";
import { ContractTransaction } from "ethers";
import {
  BridgeCallEvent,
  GenerateTransferProofParams,
  GenerateUnshieldBaseTokenProofParams,
  GenerateUnshieldProofParams,
  GenerateUnshieldToOriginProofParams,
  ValidateCachedProvedTransactionParams,
} from "../models/bridge";
import { ERC20Amount, ERC20AmountRecipient } from "../models/token";
import {
  createRailgunERC20Amount,
  createRailgunERC20AmountRecipient,
  createRailgunERC20AmountRecipients,
  createRailgunERC20Amounts,
  createRailgunNFTAmountRecipients,
  createRailgunNFTAmounts,
} from "../utils/tokens";
import { bridgeCall } from "./ipc";

export const generateUnshieldProof = (
  txidVersion: TXIDVersion,
  networkName: NetworkName,
  railWalletID: string,
  encryptionKey: string,
  erc20AmountRecipients: ERC20AmountRecipient[],
  nftAmountRecipients: NFTAmountRecipient[],
  broadcasterFeeERC20AmountRecipient: Optional<ERC20AmountRecipient>,
  sendWithPublicWallet: boolean,
  overallBatchMinGasPrice: Optional<bigint>
): Promise<void> => {
  const erc20AmountsRecipientsRailgun = createRailgunERC20AmountRecipients(
    erc20AmountRecipients
  );
  const broadcasterFeeERC20AmountRecipientRailgun =
    createRailgunERC20AmountRecipient(broadcasterFeeERC20AmountRecipient);
  const nftAmountRecipientsRailgun =
    createRailgunNFTAmountRecipients(nftAmountRecipients);

  return bridgeCall<GenerateUnshieldProofParams, void>(
    BridgeCallEvent.GenerateUnshieldProof,
    {
      txidVersion,
      networkName,
      railWalletID,
      encryptionKey,
      erc20AmountRecipients: erc20AmountsRecipientsRailgun,
      nftAmountRecipients: nftAmountRecipientsRailgun,
      broadcasterFeeERC20AmountRecipient:
        broadcasterFeeERC20AmountRecipientRailgun,
      sendWithPublicWallet,
      overallBatchMinGasPrice,
    }
  );
};

export const generateUnshieldBaseTokenProof = (
  txidVersion: TXIDVersion,
  networkName: NetworkName,
  publicWalletAddress: string,
  railWalletID: string,
  encryptionKey: string,
  wrappedTokenAmount: ERC20Amount,
  _nftAmountRecipients: NFTAmountRecipient[],
  broadcasterFeeERC20AmountRecipient: Optional<ERC20AmountRecipient>,
  sendWithPublicWallet: boolean,
  overallBatchMinGasPrice: Optional<bigint>
): Promise<void> => {
  const wrappedTokenAmountRailgun = createRailgunERC20Amount(
    wrappedTokenAmount
  ) as RailgunERC20Amount;
  const broadcasterFeeERC20AmountRecipientRailgun =
    createRailgunERC20AmountRecipient(broadcasterFeeERC20AmountRecipient);

  return bridgeCall<GenerateUnshieldBaseTokenProofParams, void>(
    BridgeCallEvent.GenerateUnshieldBaseTokenProof,
    {
      txidVersion,
      networkName,
      publicWalletAddress,
      railWalletID,
      encryptionKey,
      wrappedTokenAmount: wrappedTokenAmountRailgun,
      broadcasterFeeERC20AmountRecipient:
        broadcasterFeeERC20AmountRecipientRailgun,
      sendWithPublicWallet,
      overallBatchMinGasPrice,
    }
  );
};

export const generateUnshieldToOriginProof = (
  originalShieldTxid: string,
  txidVersion: TXIDVersion,
  networkName: NetworkName,
  railWalletID: string,
  encryptionKey: string,
  erc20AmountRecipients: ERC20AmountRecipient[],
  nftAmountRecipients: NFTAmountRecipient[]
): Promise<void> => {
  const erc20AmountsRecipientsRailgun = createRailgunERC20AmountRecipients(
    erc20AmountRecipients
  );
  const nftAmountRecipientsRailgun =
    createRailgunNFTAmountRecipients(nftAmountRecipients);

  return bridgeCall<GenerateUnshieldToOriginProofParams, void>(
    BridgeCallEvent.GenerateUnshieldToOriginProof,
    {
      originalShieldTxid,
      txidVersion,
      networkName,
      railWalletID,
      encryptionKey,
      erc20AmountRecipients: erc20AmountsRecipientsRailgun,
      nftAmountRecipients: nftAmountRecipientsRailgun,
    }
  );
};

export const generateTransferProof = async (
  txidVersion: TXIDVersion,
  networkName: NetworkName,
  railWalletID: string,
  encryptionKey: string,
  showSenderAddressToRecipient: boolean,
  memoText: Optional<string>,
  erc20AmountRecipients: ERC20AmountRecipient[],
  nftAmountRecipients: NFTAmountRecipient[],
  broadcasterFeeERC20AmountRecipient: Optional<ERC20AmountRecipient>,
  sendWithPublicWallet: boolean,
  overallBatchMinGasPrice: Optional<bigint>
): Promise<void> => {
  const erc20AmountsRecipientsRailgun = createRailgunERC20AmountRecipients(
    erc20AmountRecipients
  );
  const broadcasterFeeERC20AmountRecipientRailgun =
    createRailgunERC20AmountRecipient(broadcasterFeeERC20AmountRecipient);
  const nftAmountRecipientsRailgun =
    createRailgunNFTAmountRecipients(nftAmountRecipients);

  return bridgeCall<GenerateTransferProofParams, void>(
    BridgeCallEvent.GenerateTransferProof,
    {
      txidVersion,
      networkName,
      railWalletID,
      showSenderAddressToRecipient,
      memoText,
      encryptionKey,
      erc20AmountRecipients: erc20AmountsRecipientsRailgun,
      nftAmountRecipients: nftAmountRecipientsRailgun,
      broadcasterFeeERC20AmountRecipient:
        broadcasterFeeERC20AmountRecipientRailgun,
      sendWithPublicWallet,
      overallBatchMinGasPrice,
    }
  );
};

export const validateCachedProvedTransaction = (
  txidVersion: TXIDVersion,
  networkName: NetworkName,
  proofType: ProofType,
  railWalletID: string,
  showSenderAddressToRecipient: boolean,
  memoText: Optional<string>,
  erc20AmountRecipients: ERC20AmountRecipient[],
  nftAmountRecipients: NFTAmountRecipient[],
  relayAdaptUnshieldERC20Amounts: Optional<ERC20Amount[]>,
  relayAdaptUnshieldNFTAmounts: Optional<NFTAmount[]>,
  relayAdaptShieldERC20Recipients: Optional<RailgunERC20Recipient[]>,
  relayAdaptShieldNFTRecipients: Optional<NFTAmountRecipient[]>,
  crossContractCalls: Optional<ContractTransaction[]>,
  broadcasterFeeERC20AmountRecipient: Optional<ERC20AmountRecipient>,
  sendWithPublicWallet: boolean,
  overallBatchMinGasPrice: Optional<bigint>
): Promise<void> => {
  const erc20AmountsRecipientsRailgun = createRailgunERC20AmountRecipients(
    erc20AmountRecipients
  );
  const relayAdaptUnshieldERC20AmountsRailgun = relayAdaptUnshieldERC20Amounts
    ? createRailgunERC20Amounts(relayAdaptUnshieldERC20Amounts)
    : undefined;
  const broadcasterFeeERC20AmountRecipientRailgun =
    createRailgunERC20AmountRecipient(broadcasterFeeERC20AmountRecipient);
  const nftAmountRecipientsRailgun =
    createRailgunNFTAmountRecipients(nftAmountRecipients);
  const relayAdaptUnshieldNFTAmountsRailgun = relayAdaptUnshieldNFTAmounts
    ? createRailgunNFTAmounts(relayAdaptUnshieldNFTAmounts)
    : undefined;
  const relayAdaptShieldNFTRecipientsRailgun = relayAdaptShieldNFTRecipients
    ? createRailgunNFTAmountRecipients(relayAdaptShieldNFTRecipients)
    : undefined;

  return bridgeCall<ValidateCachedProvedTransactionParams, void>(
    BridgeCallEvent.ValidateCachedProvedTransaction,
    {
      txidVersion,
      networkName,
      proofType,
      railWalletID,
      showSenderAddressToRecipient,
      memoText,
      erc20AmountRecipients: erc20AmountsRecipientsRailgun,
      nftAmountRecipients: nftAmountRecipientsRailgun,
      relayAdaptUnshieldERC20Amounts: relayAdaptUnshieldERC20AmountsRailgun,
      relayAdaptUnshieldNFTAmounts: relayAdaptUnshieldNFTAmountsRailgun,
      relayAdaptShieldERC20Recipients,
      relayAdaptShieldNFTRecipients: relayAdaptShieldNFTRecipientsRailgun,
      crossContractCalls,
      broadcasterFeeERC20AmountRecipient:
        broadcasterFeeERC20AmountRecipientRailgun,
      sendWithPublicWallet,
      overallBatchMinGasPrice,
    }
  );
};
