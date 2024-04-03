import {
  RailgunPopulateTransactionResponse,
  RailgunTransactionGasEstimateResponse,
} from '@railgun-community/shared-models';
import {
  gasEstimateForShieldBaseToken,
  populateShieldBaseToken,
} from '@railgun-community/wallet';
import {
  BridgeCallEvent,
  GasEstimateForShieldBaseTokenParams,
  PopulateShieldBaseTokenParams,
} from '@react-shared';
import { bridgeRegisterCall } from '../worker-ipc-service';

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
