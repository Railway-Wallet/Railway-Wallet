import {
  RailgunPopulateTransactionResponse,
  RailgunTransactionGasEstimateResponse,
} from '@railgun-community/shared-models';
import {
  gasEstimateForUnprovenTransfer,
  populateProvedTransfer,
} from '@railgun-community/wallet';
import {
  BridgeCallEvent,
  GasEstimateForUnprovenTransferParams,
  PopulateProvedTransferParams,
} from '@react-shared';
import { bridgeRegisterCall } from '../worker-ipc-service';

bridgeRegisterCall<
  PopulateProvedTransferParams,
  RailgunPopulateTransactionResponse
>(
  BridgeCallEvent.PopulateProvedTransfer,
  async ({
    txidVersion,
    networkName,
    railWalletID,
    erc20AmountRecipients,
    nftAmountRecipients,
    showSenderAddressToRecipient,
    memoText,
    relayerFeeERC20AmountRecipient,
    sendWithPublicWallet,
    overallBatchMinGasPrice,
    transactionGasDetails,
  }) => {
    return populateProvedTransfer(
      txidVersion,
      networkName,
      railWalletID,
      showSenderAddressToRecipient,
      memoText,
      erc20AmountRecipients,
      nftAmountRecipients,
      relayerFeeERC20AmountRecipient,
      sendWithPublicWallet,
      overallBatchMinGasPrice,
      transactionGasDetails,
    );
  },
);

bridgeRegisterCall<
  GasEstimateForUnprovenTransferParams,
  RailgunTransactionGasEstimateResponse
>(
  BridgeCallEvent.GasEstimateForUnprovenTransfer,
  async ({
    txidVersion,
    networkName,
    railWalletID,
    encryptionKey,
    memoText,
    erc20AmountRecipients,
    nftAmountRecipients,
    originalGasDetails,
    feeTokenDetails,
    sendWithPublicWallet,
  }) => {
    return gasEstimateForUnprovenTransfer(
      txidVersion,
      networkName,
      railWalletID,
      encryptionKey,
      memoText,
      erc20AmountRecipients,
      nftAmountRecipients,
      originalGasDetails,
      feeTokenDetails,
      sendWithPublicWallet,
    );
  },
);
