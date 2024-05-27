import {
  RailgunPopulateTransactionResponse,
  RailgunTransactionGasEstimateResponse,
} from '@railgun-community/shared-models';
import {
  gasEstimateForUnprovenCrossContractCalls,
  generateCrossContractCallsProof,
  getRelayAdaptTransactionError,
  populateProvedCrossContractCalls,
} from '@railgun-community/wallet';
import {
  BridgeCallEvent,
  GasEstimateForUnprovenCrossContractCallsParams,
  GenerateCrossContractCallsProofParams,
  GetRelayAdaptTransactionErrorParams,
  PopulateCrossContractCallsParams,
} from '@react-shared';
import { bridgeRegisterCall } from '../worker-ipc-service';
import { proofProgressCallback } from './proofs';

bridgeRegisterCall<GetRelayAdaptTransactionErrorParams, Optional<string>>(
  BridgeCallEvent.GetRelayAdaptTransactionError,
  async ({ txidVersion, receiptLogs }) => {
    return getRelayAdaptTransactionError(txidVersion, receiptLogs);
  },
);

bridgeRegisterCall<
  PopulateCrossContractCallsParams,
  RailgunPopulateTransactionResponse
>(
  BridgeCallEvent.PopulateCrossContractCalls,
  async ({
    txidVersion,
    networkName,
    railWalletID,
    relayAdaptUnshieldERC20Amounts,
    relayAdaptUnshieldNFTAmounts,
    relayAdaptShieldERC20Recipients,
    relayAdaptShieldNFTRecipients,
    crossContractCalls,
    broadcasterFeeERC20AmountRecipient,
    sendWithPublicWallet,
    overallBatchMinGasPrice,
    transactionGasDetails,
  }) => {
    return populateProvedCrossContractCalls(
      txidVersion,
      networkName,
      railWalletID,
      relayAdaptUnshieldERC20Amounts,
      relayAdaptUnshieldNFTAmounts,
      relayAdaptShieldERC20Recipients,
      relayAdaptShieldNFTRecipients,
      crossContractCalls,
      broadcasterFeeERC20AmountRecipient,
      sendWithPublicWallet,
      overallBatchMinGasPrice,
      transactionGasDetails,
    );
  },
);

bridgeRegisterCall<
  GasEstimateForUnprovenCrossContractCallsParams,
  RailgunTransactionGasEstimateResponse
>(
  BridgeCallEvent.GasEstimateForUnprovenCrossContractCalls,
  async ({
    txidVersion,
    networkName,
    railWalletID,
    encryptionKey,
    relayAdaptUnshieldERC20Amounts,
    relayAdaptUnshieldNFTAmounts,
    relayAdaptShieldERC20Recipients,
    relayAdaptShieldNFTRecipients,
    crossContractCalls,
    originalGasDetails,
    feeTokenDetails,
    sendWithPublicWallet,
    minGasLimit,
  }) => {
    return gasEstimateForUnprovenCrossContractCalls(
      txidVersion,
      networkName,
      railWalletID,
      encryptionKey,
      relayAdaptUnshieldERC20Amounts,
      relayAdaptUnshieldNFTAmounts,
      relayAdaptShieldERC20Recipients,
      relayAdaptShieldNFTRecipients,
      crossContractCalls,
      originalGasDetails,
      feeTokenDetails,
      sendWithPublicWallet,
      minGasLimit,
    );
  },
);

bridgeRegisterCall<GenerateCrossContractCallsProofParams, void>(
  BridgeCallEvent.GenerateCrossContractCallsProof,
  async ({
    txidVersion,
    networkName,
    railWalletID,
    encryptionKey,
    relayAdaptUnshieldERC20Amounts,
    relayAdaptUnshieldNFTAmounts,
    relayAdaptShieldERC20Recipients,
    relayAdaptShieldNFTRecipients,
    crossContractCalls,
    broadcasterFeeERC20AmountRecipient,
    sendWithPublicWallet,
    overallBatchMinGasPrice,
    minGasLimit,
  }) => {
    return generateCrossContractCallsProof(
      txidVersion,
      networkName,
      railWalletID,
      encryptionKey,
      relayAdaptUnshieldERC20Amounts,
      relayAdaptUnshieldNFTAmounts,
      relayAdaptShieldERC20Recipients,
      relayAdaptShieldNFTRecipients,
      crossContractCalls,
      broadcasterFeeERC20AmountRecipient,
      sendWithPublicWallet,
      overallBatchMinGasPrice,
      minGasLimit,
      proofProgressCallback,
    );
  },
);
