import {
  RailgunPopulateTransactionResponse,
  RailgunTransactionGasEstimateResponse,
  type RailgunERC20AmountRecipient,
  type RailgunNFTAmountRecipient,
} from '@railgun-community/shared-models';
import {
  populateProvedUnshield,
  populateProvedUnshieldBaseToken,
  gasEstimateForUnprovenUnshield,
  gasEstimateForUnprovenUnshieldBaseToken,
  populateProvedUnshieldToOrigin,
  gasEstimateForUnprovenUnshieldToOrigin,
  getERC20AndNFTAmountRecipientsForUnshieldToOrigin,
} from '@railgun-community/wallet';
import { bridgeRegisterCall } from '../../../bridge/node-ipc-service';
import {
  BridgeCallEvent,
  GasEstimateForUnprovenUnshieldBaseTokenParams,
  GasEstimateForUnprovenUnshieldParams,
  PopulateProvedUnshieldBaseTokenParams,
  PopulateProvedUnshieldParams,
  type GasEstimateForUnprovenUnshieldToOriginParams,
  type GetERC20AndNFTAmountRecipientsForUnshieldToOriginParams,
  type PopulateProvedUnshieldToOriginParams,
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
    broadcasterFeeERC20AmountRecipient,
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
      broadcasterFeeERC20AmountRecipient,
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
    broadcasterFeeERC20AmountRecipient,
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
      broadcasterFeeERC20AmountRecipient,
      sendWithPublicWallet,
      overallBatchMinGasPrice,
      transactionGasDetails,
    );
  },
);

bridgeRegisterCall<
  PopulateProvedUnshieldToOriginParams,
  RailgunPopulateTransactionResponse
>(
  BridgeCallEvent.PopulateProvedUnshieldToOrigin,
  async ({
    txidVersion,
    networkName,
    railWalletID,
    erc20AmountRecipients,
    nftAmountRecipients,
    transactionGasDetails,
  }) => {
    return populateProvedUnshieldToOrigin(
      txidVersion,
      networkName,
      railWalletID,
      erc20AmountRecipients,
      nftAmountRecipients,
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


bridgeRegisterCall<
  GasEstimateForUnprovenUnshieldToOriginParams,
  RailgunTransactionGasEstimateResponse
>(
  BridgeCallEvent.GasEstimateForUnprovenUnshieldToOrigin,
  async ({
    originalShieldTxid,
    txidVersion,
    networkName,
    railWalletID,
    encryptionKey,
    erc20AmountRecipients,
    nftAmountRecipients,
  }) => {
    return gasEstimateForUnprovenUnshieldToOrigin(
      originalShieldTxid,
      txidVersion,
      networkName,
      railWalletID,
      encryptionKey,
      erc20AmountRecipients,
      nftAmountRecipients,
    );
  },
);


bridgeRegisterCall<
  GetERC20AndNFTAmountRecipientsForUnshieldToOriginParams,
  {
    erc20AmountRecipients: RailgunERC20AmountRecipient[];
    nftAmountRecipients: RailgunNFTAmountRecipient[];
  }
>(
  BridgeCallEvent.GetERC20AndNFTAmountRecipientsForUnshieldToOrigin,
  async ({ txidVersion, networkName, railgunWalletID, originalShieldTxid }) => {
    return getERC20AndNFTAmountRecipientsForUnshieldToOrigin(
      txidVersion,
      networkName,
      railgunWalletID,
      originalShieldTxid,
    );
  },
);
