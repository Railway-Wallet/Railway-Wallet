import {
  FeeTokenDetails,
  isDefined,
  NetworkName,
  NFTAmount,
  NFTAmountRecipient,
  RailgunERC20Recipient,
  RailgunPopulateTransactionResponse,
  RailgunTransactionGasEstimateResponse,
  TransactionGasDetails,
  TransactionReceiptLog,
  TXIDVersion,
} from "@railgun-community/shared-models";
import { ContractTransaction } from "ethers";
import {
  BridgeCallEvent,
  GasEstimateForUnprovenCrossContractCallsParams,
  GenerateCrossContractCallsProofParams,
  GetRelayAdaptTransactionErrorParams,
  PopulateCrossContractCallsParams,
} from "../models/bridge";
import { ERC20Amount, ERC20AmountRecipient } from "../models/token";
import {
  createRailgunERC20AmountRecipient,
  createRailgunERC20Amounts,
  createRailgunNFTAmountRecipients,
  createRailgunNFTAmounts,
} from "../utils/tokens";
import { bridgeCall } from "./ipc";

export const getRelayAdaptTransactionError = (
  txidVersion: TXIDVersion,
  receiptLogs: TransactionReceiptLog[]
): Promise<Optional<string>> => {
  return bridgeCall<GetRelayAdaptTransactionErrorParams, Optional<string>>(
    BridgeCallEvent.GetRelayAdaptTransactionError,
    {
      txidVersion,
      receiptLogs,
    }
  );
};

export const populateCrossContractCalls = (
  txidVersion: TXIDVersion,
  networkName: NetworkName,
  railWalletID: string,
  relayAdaptUnshieldERC20Amounts: ERC20Amount[],
  relayAdaptUnshieldNFTAmounts: NFTAmount[],
  relayAdaptShieldERC20Recipients: RailgunERC20Recipient[],
  relayAdaptShieldNFTRecipients: NFTAmountRecipient[],
  crossContractCalls: ContractTransaction[],
  broadcasterFeeERC20AmountRecipient: Optional<ERC20AmountRecipient>,
  sendWithPublicWallet: boolean,
  overallBatchMinGasPrice: Optional<bigint>,
  transactionGasDetails: TransactionGasDetails
): Promise<RailgunPopulateTransactionResponse> => {
  const relayAdaptUnshieldERC20AmountsRailgun = createRailgunERC20Amounts(
    relayAdaptUnshieldERC20Amounts
  );
  const broadcasterFeeERC20AmountRecipientRailgun =
    createRailgunERC20AmountRecipient(broadcasterFeeERC20AmountRecipient);
  const relayAdaptUnshieldNFTAmountsRailgun = createRailgunNFTAmounts(
    relayAdaptUnshieldNFTAmounts
  );
  const relayAdaptShieldNFTRecipientsRailgun = createRailgunNFTAmountRecipients(
    relayAdaptShieldNFTRecipients
  );

  return bridgeCall<
    PopulateCrossContractCallsParams,
    RailgunPopulateTransactionResponse
  >(BridgeCallEvent.PopulateCrossContractCalls, {
    txidVersion,
    networkName,
    railWalletID,
    relayAdaptUnshieldERC20Amounts: relayAdaptUnshieldERC20AmountsRailgun,
    relayAdaptUnshieldNFTAmounts: relayAdaptUnshieldNFTAmountsRailgun,
    relayAdaptShieldERC20Recipients,
    relayAdaptShieldNFTRecipients: relayAdaptShieldNFTRecipientsRailgun,
    crossContractCalls,
    broadcasterFeeERC20AmountRecipient:
      broadcasterFeeERC20AmountRecipientRailgun,
    sendWithPublicWallet,
    overallBatchMinGasPrice,
    transactionGasDetails,
  });
};

export const generateCrossContractCallsProof = (
  txidVersion: TXIDVersion,
  networkName: NetworkName,
  railWalletID: string,
  encryptionKey: string,
  relayAdaptUnshieldERC20Amounts: ERC20Amount[],
  relayAdaptUnshieldNFTAmounts: NFTAmount[],
  relayAdaptShieldERC20Recipients: RailgunERC20Recipient[],
  relayAdaptShieldNFTRecipients: NFTAmountRecipient[],
  crossContractCalls: ContractTransaction[],
  broadcasterFeeERC20AmountRecipient: Optional<ERC20AmountRecipient>,
  sendWithPublicWallet: boolean,
  overallBatchMinGasPrice: Optional<bigint>,
  minGasLimit: Optional<bigint>
): Promise<void> => {
  const relayAdaptUnshieldERC20AmountsRailgun = createRailgunERC20Amounts(
    relayAdaptUnshieldERC20Amounts
  );
  const broadcasterFeeERC20AmountRecipientRailgun =
    createRailgunERC20AmountRecipient(broadcasterFeeERC20AmountRecipient);
  const relayAdaptUnshieldNFTAmountsRailgun = createRailgunNFTAmounts(
    relayAdaptUnshieldNFTAmounts
  );
  const relayAdaptShieldNFTRecipientsRailgun = createRailgunNFTAmountRecipients(
    relayAdaptShieldNFTRecipients
  );

  if (!isDefined(minGasLimit)) {
    throw new Error("Cross contract call requires minGasLimit parameter.");
  }

  return bridgeCall<GenerateCrossContractCallsProofParams, void>(
    BridgeCallEvent.GenerateCrossContractCallsProof,
    {
      txidVersion,
      networkName,
      railWalletID,
      encryptionKey,
      relayAdaptUnshieldERC20Amounts: relayAdaptUnshieldERC20AmountsRailgun,
      relayAdaptUnshieldNFTAmounts: relayAdaptUnshieldNFTAmountsRailgun,
      relayAdaptShieldERC20Recipients,
      relayAdaptShieldNFTRecipients: relayAdaptShieldNFTRecipientsRailgun,
      crossContractCalls,
      broadcasterFeeERC20AmountRecipient:
        broadcasterFeeERC20AmountRecipientRailgun,
      sendWithPublicWallet,
      overallBatchMinGasPrice,
      minGasLimit,
    }
  );
};

export const gasEstimateForUnprovenCrossContractCalls = async (
  txidVersion: TXIDVersion,
  networkName: NetworkName,
  railWalletID: string,
  encryptionKey: string,
  relayAdaptUnshieldERC20Amounts: ERC20Amount[],
  relayAdaptUnshieldNFTAmounts: NFTAmount[],
  relayAdaptShieldERC20Recipients: RailgunERC20Recipient[],
  relayAdaptShieldNFTRecipients: NFTAmountRecipient[],
  crossContractCalls: ContractTransaction[],
  originalGasDetails: TransactionGasDetails,
  feeTokenDetails: Optional<FeeTokenDetails>,
  sendWithPublicWallet: boolean,
  minGasLimit: bigint
): Promise<bigint> => {
  const relayAdaptUnshieldERC20AmountsRailgun = createRailgunERC20Amounts(
    relayAdaptUnshieldERC20Amounts
  );
  const relayAdaptUnshieldNFTAmountsRailgun = createRailgunNFTAmounts(
    relayAdaptUnshieldNFTAmounts
  );
  const relayAdaptShieldNFTRecipientsRailgun = createRailgunNFTAmountRecipients(
    relayAdaptShieldNFTRecipients
  );

  const { gasEstimate } = await bridgeCall<
    GasEstimateForUnprovenCrossContractCallsParams,
    RailgunTransactionGasEstimateResponse
  >(BridgeCallEvent.GasEstimateForUnprovenCrossContractCalls, {
    txidVersion,
    networkName,
    railWalletID,
    encryptionKey,
    relayAdaptUnshieldERC20Amounts: relayAdaptUnshieldERC20AmountsRailgun,
    relayAdaptUnshieldNFTAmounts: relayAdaptUnshieldNFTAmountsRailgun,
    relayAdaptShieldERC20Recipients,
    relayAdaptShieldNFTRecipients: relayAdaptShieldNFTRecipientsRailgun,
    crossContractCalls,
    originalGasDetails,
    feeTokenDetails,
    sendWithPublicWallet,
    minGasLimit,
  });
  return gasEstimate;
};
