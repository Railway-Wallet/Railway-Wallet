import {
  RailgunPopulateTransactionResponse,
  RailgunTransactionGasEstimateResponse,
} from '@railgun-community/shared-models';
import {
  populateProvedUnshield,
  populateProvedUnshieldBaseToken,
  gasEstimateForUnprovenUnshield,
  gasEstimateForUnprovenUnshieldBaseToken,
} from '@railgun-community/wallet';
import { bridgeRegisterCall } from '../../../bridge/node-ipc-service';
import {
  BridgeCallEvent,
  GasEstimateForUnprovenUnshieldBaseTokenParams,
  GasEstimateForUnprovenUnshieldParams,
  PopulateProvedUnshieldBaseTokenParams,
  PopulateProvedUnshieldParams,
} from '../../../bridge/model';

bridgeRegisterCall<
  PopulateProvedUnshieldParams,
  RailgunPopulateTransactionResponse
>(
  BridgeCallEvent.PopulateProvedUnshield,
  async ({
    txidVersion,
    networkName,
    railWalletID,
    erc20AmountRecipients,
    nftAmountRecipients,
    relayerFeeERC20AmountRecipient,
    sendWithPublicWallet,
    overallBatchMinGasPrice,
    transactionGasDetails,
  }) => {
    return populateProvedUnshield(
      txidVersion,
      networkName,
      railWalletID,
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
  PopulateProvedUnshieldBaseTokenParams,
  RailgunPopulateTransactionResponse
>(
  BridgeCallEvent.PopulateProvedUnshieldBaseToken,
  async ({
    txidVersion,
    networkName,
    publicWalletAddress,
    railWalletID,
    wrappedTokenAmount,
    relayerFeeERC20AmountRecipient,
    sendWithPublicWallet,
    overallBatchMinGasPrice,
    transactionGasDetails,
  }) => {
    return populateProvedUnshieldBaseToken(
      txidVersion,
      networkName,
      publicWalletAddress,
      railWalletID,
      wrappedTokenAmount,
      relayerFeeERC20AmountRecipient,
      sendWithPublicWallet,
      overallBatchMinGasPrice,
      transactionGasDetails,
    );
  },
);

bridgeRegisterCall<
  GasEstimateForUnprovenUnshieldParams,
  RailgunTransactionGasEstimateResponse
>(
  BridgeCallEvent.GasEstimateForUnprovenUnshield,
  async ({
    txidVersion,
    networkName,
    railWalletID,
    encryptionKey,
    erc20AmountRecipients,
    nftAmountRecipients,
    originalGasDetails,
    feeTokenDetails,
    sendWithPublicWallet,
  }) => {
    return gasEstimateForUnprovenUnshield(
      txidVersion,
      networkName,
      railWalletID,
      encryptionKey,
      erc20AmountRecipients,
      nftAmountRecipients,
      originalGasDetails,
      feeTokenDetails,
      sendWithPublicWallet,
    );
  },
);

bridgeRegisterCall<
  GasEstimateForUnprovenUnshieldBaseTokenParams,
  RailgunTransactionGasEstimateResponse
>(
  BridgeCallEvent.GasEstimateForUnprovenUnshieldBaseToken,
  async ({
    txidVersion,
    networkName,
    publicWalletAddress,
    railWalletID,
    encryptionKey,
    wrappedTokenAmount,
    originalGasDetails,
    feeTokenDetails,
    sendWithPublicWallet,
  }) => {
    return gasEstimateForUnprovenUnshieldBaseToken(
      txidVersion,
      networkName,
      publicWalletAddress,
      railWalletID,
      encryptionKey,
      wrappedTokenAmount,
      originalGasDetails,
      feeTokenDetails,
      sendWithPublicWallet,
    );
  },
);
