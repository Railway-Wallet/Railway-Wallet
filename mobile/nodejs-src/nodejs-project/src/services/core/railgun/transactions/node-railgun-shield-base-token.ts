import {
  populateShieldBaseToken,
  gasEstimateForShieldBaseToken,
} from '@railgun-community/wallet';
import {
  RailgunPopulateTransactionResponse,
  RailgunTransactionGasEstimateResponse,
} from '@railgun-community/shared-models';
import { bridgeRegisterCall } from '../../../bridge/node-ipc-service';
import {
  BridgeCallEvent,
  GasEstimateForShieldBaseTokenParams,
  PopulateShieldBaseTokenParams,
} from '../../../bridge/model';

bridgeRegisterCall<
  PopulateShieldBaseTokenParams,
  RailgunPopulateTransactionResponse
>(
  BridgeCallEvent.PopulateShieldBaseToken,
  async ({
    txidVersion,
    networkName,
    railgunAddress,
    shieldPrivateKey,
    wrappedTokenAmount,
    transactionGasDetails,
  }) => {
    return populateShieldBaseToken(
      txidVersion,
      networkName,
      railgunAddress,
      shieldPrivateKey,
      wrappedTokenAmount,
      transactionGasDetails,
    );
  },
);

bridgeRegisterCall<
  GasEstimateForShieldBaseTokenParams,
  RailgunTransactionGasEstimateResponse
>(
  BridgeCallEvent.GasEstimateForShieldBaseToken,
  async ({
    txidVersion,
    networkName,
    railgunAddress,
    shieldPrivateKey,
    fromWalletAddress,
    wrappedTokenAmount,
  }) => {
    return gasEstimateForShieldBaseToken(
      txidVersion,
      networkName,
      railgunAddress,
      shieldPrivateKey,
      wrappedTokenAmount,
      fromWalletAddress,
    );
  },
);
