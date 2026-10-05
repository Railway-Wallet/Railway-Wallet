import {
  NETWORK_CONFIG,
  RailgunTransactionGasEstimateResponse,
} from '@railgun-community/shared-models';
import {
  gasEstimateForUnprovenCrossContractCalls,
  gasEstimateForUnprovenCrossContractCalls7702,
  generateCrossContractCallsProof,
  generateCrossContractCallsProof7702,
  getRelayAdaptTransactionError,
  populateProvedCrossContractCalls,
} from '@railgun-community/wallet';
import {
  BridgeCallEvent,
  GasEstimateForUnprovenCrossContractCallsParams,
  GenerateCrossContractCallsProofParams,
  GetRelayAdaptTransactionErrorParams,
  PopulateCrossContractCallsParams,
  PopulateCrossContractCallsResponse,
} from '@react-shared';
import { withPinnedEphemeralAccount } from '../ephemeral';
import { bridgeRegisterCall } from '../worker-ipc-service';
import { proofProgressCallback } from './proofs';
import { extractRelayAdapt7702Fields } from './relay-adapt-7702-fields';

bridgeRegisterCall<GetRelayAdaptTransactionErrorParams, Optional<string>>(
  BridgeCallEvent.GetRelayAdaptTransactionError,
  async ({ txidVersion, receiptLogs }) => {
    return getRelayAdaptTransactionError(txidVersion, receiptLogs);
  },
);

bridgeRegisterCall<
  PopulateCrossContractCallsParams,
  PopulateCrossContractCallsResponse
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
    const response = await populateProvedCrossContractCalls(
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
    return {
      ...response,
      ...extractRelayAdapt7702Fields(response.transaction),
    };
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
    ephemeralIndex,
  }) => {
    const estimateFn = NETWORK_CONFIG[networkName].supports7702
      ? gasEstimateForUnprovenCrossContractCalls7702
      : gasEstimateForUnprovenCrossContractCalls;
    return withPinnedEphemeralAccount(
      railWalletID,
      encryptionKey,
      networkName,
      ephemeralIndex,
      () =>
        estimateFn(
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
        ),
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
    ephemeralIndex,
  }) => {
    if (NETWORK_CONFIG[networkName].supports7702) {
      await withPinnedEphemeralAccount(
        railWalletID,
        encryptionKey,
        networkName,
        ephemeralIndex,
        () =>
          generateCrossContractCallsProof7702(
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
          ),
      );
      return;
    }
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
