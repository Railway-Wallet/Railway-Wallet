import {
  RailgunPopulateTransactionResponse,
  RailgunTransactionGasEstimateResponse,
} from '@railgun-community/shared-models';
import {
  gasEstimateForShield,
  getShieldPrivateKeySignatureMessage,
  populateShield,
} from '@railgun-community/wallet';
import {
  BridgeCallEvent,
  GasEstimateForShieldParams,
  PopulateShieldParams,
} from '@react-shared';
import { bridgeRegisterCall } from '../worker-ipc-service';

bridgeRegisterCall<void, string>(
  BridgeCallEvent.GetShieldPrivateKeySignatureMessage,
  async () => {
    return getShieldPrivateKeySignatureMessage();
  },
);

bridgeRegisterCall<PopulateShieldParams, RailgunPopulateTransactionResponse>(
  BridgeCallEvent.PopulateShield,
  async ({
    txidVersion,
    networkName,
    shieldPrivateKey,
    erc20AmountRecipients,
    nftAmountRecipients,
    transactionGasDetails,
  }) => {
    return populateShield(
      txidVersion,
      networkName,
      shieldPrivateKey,
      erc20AmountRecipients,
      nftAmountRecipients,
      transactionGasDetails,
    );
  },
);

bridgeRegisterCall<
  GasEstimateForShieldParams,
  RailgunTransactionGasEstimateResponse
>(
  BridgeCallEvent.GasEstimateForShield,
  async ({
    txidVersion,
    networkName,
    shieldPrivateKey,
    erc20AmountRecipients,
    nftAmountRecipients,
    fromWalletAddress,
  }) => {
    return gasEstimateForShield(
      txidVersion,
      networkName,
      shieldPrivateKey,
      erc20AmountRecipients,
      nftAmountRecipients,
      fromWalletAddress,
    );
  },
);
