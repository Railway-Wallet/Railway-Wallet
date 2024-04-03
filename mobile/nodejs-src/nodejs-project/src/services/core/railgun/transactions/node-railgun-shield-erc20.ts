import {
  populateShield,
  gasEstimateForShield,
  getShieldPrivateKeySignatureMessage,
} from '@railgun-community/wallet';
import {
  RailgunPopulateTransactionResponse,
  RailgunTransactionGasEstimateResponse,
} from '@railgun-community/shared-models';
import { bridgeRegisterCall } from '../../../bridge/node-ipc-service';
import {
  BridgeCallEvent,
  GasEstimateForShieldParams,
  PopulateShieldParams,
} from '../../../bridge/model';

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
