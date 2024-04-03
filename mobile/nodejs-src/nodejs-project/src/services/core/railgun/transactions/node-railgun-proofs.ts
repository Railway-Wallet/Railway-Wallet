import {
  generateTransferProof,
  generateUnshieldBaseTokenProof,
  generateUnshieldProof,
  validateCachedProvedTransaction,
} from '@railgun-community/wallet';
import {
  bridgeRegisterCall,
  triggerBridgeEvent,
} from '../../../bridge/node-ipc-service';
import {
  BridgeCallEvent,
  BridgeEvent,
  GenerateTransferProofParams,
  GenerateUnshieldBaseTokenProofParams,
  GenerateUnshieldProofParams,
  ValidateCachedProvedTransactionParams,
} from '../../../bridge/model';

export const proofProgressCallback = (progress: number, status: string) => {
  triggerBridgeEvent(BridgeEvent.OnProofProgress, { progress, status });
};

bridgeRegisterCall<GenerateTransferProofParams, void>(
  BridgeCallEvent.GenerateTransferProof,
  async ({
    txidVersion,
    networkName,
    railWalletID,
    encryptionKey,
    showSenderAddressToRecipient,
    memoText,
    erc20AmountRecipients,
    nftAmountRecipients,
    relayerFeeERC20AmountRecipient,
    sendWithPublicWallet,
    overallBatchMinGasPrice,
  }) => {
    return generateTransferProof(
      txidVersion,
      networkName,
      railWalletID,
      encryptionKey,
      showSenderAddressToRecipient,
      memoText,
      erc20AmountRecipients,
      nftAmountRecipients,
      relayerFeeERC20AmountRecipient,
      sendWithPublicWallet,
      overallBatchMinGasPrice,
      proofProgressCallback,
    );
  },
);

bridgeRegisterCall<GenerateUnshieldProofParams, void>(
  BridgeCallEvent.GenerateUnshieldProof,
  async ({
    txidVersion,
    networkName,
    railWalletID,
    encryptionKey,
    erc20AmountRecipients,
    nftAmountRecipients,
    relayerFeeERC20AmountRecipient,
    sendWithPublicWallet,
    overallBatchMinGasPrice,
  }) => {
    return generateUnshieldProof(
      txidVersion,
      networkName,
      railWalletID,
      encryptionKey,
      erc20AmountRecipients,
      nftAmountRecipients,
      relayerFeeERC20AmountRecipient,
      sendWithPublicWallet,
      overallBatchMinGasPrice,
      proofProgressCallback,
    );
  },
);

bridgeRegisterCall<GenerateUnshieldBaseTokenProofParams, void>(
  BridgeCallEvent.GenerateUnshieldBaseTokenProof,
  async ({
    txidVersion,
    networkName,
    publicWalletAddress,
    railWalletID,
    encryptionKey,
    wrappedTokenAmount,
    relayerFeeERC20AmountRecipient,
    sendWithPublicWallet,
    overallBatchMinGasPrice,
  }) => {
    return generateUnshieldBaseTokenProof(
      txidVersion,
      networkName,
      publicWalletAddress,
      railWalletID,
      encryptionKey,
      wrappedTokenAmount,
      relayerFeeERC20AmountRecipient,
      sendWithPublicWallet,
      overallBatchMinGasPrice,
      proofProgressCallback,
    );
  },
);

bridgeRegisterCall<ValidateCachedProvedTransactionParams, void>(
  BridgeCallEvent.ValidateCachedProvedTransaction,
  async ({
    txidVersion,
    networkName,
    proofType,
    railWalletID,
    showSenderAddressToRecipient,
    memoText,
    erc20AmountRecipients,
    nftAmountRecipients,
    relayAdaptUnshieldERC20Amounts,
    relayAdaptUnshieldNFTAmounts,
    relayAdaptShieldERC20Recipients,
    relayAdaptShieldNFTRecipients,
    crossContractCalls,
    relayerFeeERC20AmountRecipient,
    sendWithPublicWallet,
    overallBatchMinGasPrice,
  }) => {
    return validateCachedProvedTransaction(
      txidVersion,
      networkName,
      proofType,
      railWalletID,
      showSenderAddressToRecipient,
      memoText,
      erc20AmountRecipients,
      nftAmountRecipients,
      relayAdaptUnshieldERC20Amounts,
      relayAdaptUnshieldNFTAmounts,
      relayAdaptShieldERC20Recipients,
      relayAdaptShieldNFTRecipients,
      crossContractCalls,
      relayerFeeERC20AmountRecipient,
      sendWithPublicWallet,
      overallBatchMinGasPrice,
    );
  },
);
