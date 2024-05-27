import {
  RailgunPopulateTransactionResponse,
  RailgunTransactionGasEstimateResponse,
} from '@railgun-community/shared-models';
import {
  populateProvedTransfer,
  gasEstimateForUnprovenTransfer,
} from '@railgun-community/wallet';
import { bridgeRegisterCall } from '../../../bridge/node-ipc-service';
import {
  BridgeCallEvent,
  GasEstimateForUnprovenTransferParams,
  PopulateProvedTransferParams,
} from '../../../bridge/model';

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
    broadcasterFeeERC20AmountRecipient,
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
      broadcasterFeeERC20AmountRecipient,
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
