import {
  gasEstimateForUnprovenCrossContractCalls,
  generateCrossContractCallsProof,
  populateProvedCrossContractCalls,
  getRelayAdaptTransactionError,
} from '@railgun-community/wallet';
import {
  RailgunPopulateTransactionResponse,
  RailgunTransactionGasEstimateResponse,
} from '@railgun-community/shared-models';
import { bridgeRegisterCall } from '../../../bridge/node-ipc-service';
import { proofProgressCallback } from './node-railgun-proofs';
import {
  BridgeCallEvent,
  GasEstimateForUnprovenCrossContractCallsParams,
  GenerateCrossContractCallsProofParams,
  GetRelayAdaptTransactionErrorParams,
  PopulateCrossContractCallsParams,
} from '../../../bridge/model';

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
    relayerFeeERC20AmountRecipient,
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
      relayerFeeERC20AmountRecipient,
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
    relayerFeeERC20AmountRecipient,
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
      relayerFeeERC20AmountRecipient,
      sendWithPublicWallet,
      overallBatchMinGasPrice,
      minGasLimit,
      proofProgressCallback,
    );
  },
);

bridgeRegisterCall<GetRelayAdaptTransactionErrorParams, Optional<string>>(
  BridgeCallEvent.GetRelayAdaptTransactionError,
  async ({ txidVersion, receiptLogs }) => {
    return getRelayAdaptTransactionError(txidVersion, receiptLogs);
  },
);
