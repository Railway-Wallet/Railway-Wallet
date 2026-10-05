import {
  isDefined,
  NETWORK_CONFIG,
  NetworkName,
  RailgunTransactionGasEstimateResponse,
} from '@railgun-community/shared-models';
import {
  EphemeralAccount,
  EphemeralKeyManager,
  fullWalletForID,
  gasEstimateForShieldBaseToken,
  populateShieldBaseToken,
} from '@railgun-community/wallet';
import {
  BridgeCallEvent,
  GasEstimateForShieldBaseTokenParams,
  PopulateShieldBaseTokenParams,
  RelayAdapt7702PopulateResponse,
} from '@react-shared';
import { bridgeRegisterCall } from '../worker-ipc-service';
import { extractRelayAdapt7702Fields } from './relay-adapt-7702-fields';

const deriveEphemeralAccount = async (
  networkName: NetworkName,
  railWalletID: Optional<string>,
  encryptionKey: Optional<string>,
): Promise<Optional<EphemeralAccount>> => {
  const { chain, supports7702 } = NETWORK_CONFIG[networkName];
  if (!supports7702 || !isDefined(railWalletID) || !isDefined(encryptionKey)) {
    return undefined;
  }
  const ephemeralKeyManager = new EphemeralKeyManager(
    fullWalletForID(railWalletID),
    encryptionKey,
  );
  return ephemeralKeyManager.getCurrentAccount(BigInt(chain.id));
};

bridgeRegisterCall<
  PopulateShieldBaseTokenParams,
  RelayAdapt7702PopulateResponse
>(
  BridgeCallEvent.PopulateShieldBaseToken,
  async ({
    txidVersion,
    networkName,
    railgunAddress,
    shieldPrivateKey,
    wrappedTokenAmount,
    transactionGasDetails,
    railWalletID,
    encryptionKey,
  }) => {
    const ephemeralAccount = await deriveEphemeralAccount(
      networkName,
      railWalletID,
      encryptionKey,
    );
    const response = await populateShieldBaseToken(
      txidVersion,
      networkName,
      railgunAddress,
      shieldPrivateKey,
      wrappedTokenAmount,
      transactionGasDetails,
      ephemeralAccount,
    );
    return {
      ...response,
      ...extractRelayAdapt7702Fields(response.transaction),
    };
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
    railWalletID,
    encryptionKey,
  }) => {
    const ephemeralAccount = await deriveEphemeralAccount(
      networkName,
      railWalletID,
      encryptionKey,
    );
    return gasEstimateForShieldBaseToken(
      txidVersion,
      networkName,
      railgunAddress,
      shieldPrivateKey,
      wrappedTokenAmount,
      fromWalletAddress,
      ephemeralAccount,
    );
  },
);
