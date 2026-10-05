import {
  isDefined,
  NETWORK_CONFIG,
  NetworkName,
} from '@railgun-community/shared-models';
import {
  EphemeralKeyManager,
  fullWalletForID,
  getCurrentEphemeralAddress,
  ratchetEphemeralAddress,
} from '@railgun-community/wallet';
import {
  BridgeCallEvent,
  GetCurrentEphemeralAddressParams,
  GetEphemeralAddressesForRangeParams,
  GetEphemeralKeyIndexParams,
  GetEphemeralPrivateKeyParams,
  RatchetEphemeralAddressParams,
  SyncEphemeralIndexParams,
} from '@react-shared';
import { bridgeRegisterCall } from './worker-ipc-service';

export const withPinnedEphemeralAccount = async <T,>(
  railWalletID: string,
  encryptionKey: string,
  networkName: NetworkName,
  ephemeralIndex: Optional<number>,
  operation: () => Promise<T>,
): Promise<T> => {
  if (!isDefined(ephemeralIndex)) {
    return operation();
  }
  const railgunWallet = fullWalletForID(railWalletID);
  const previousOverride = railgunWallet.ephemeralWalletOverride;
  railgunWallet.ephemeralWalletOverride =
    await railgunWallet.getEphemeralWallet(
      encryptionKey,
      BigInt(NETWORK_CONFIG[networkName].chain.id),
      ephemeralIndex,
    );
  try {
    return await operation();
  } finally {
    railgunWallet.ephemeralWalletOverride = previousOverride;
  }
};

bridgeRegisterCall<GetCurrentEphemeralAddressParams, string>(
  BridgeCallEvent.GetCurrentEphemeralAddress,
  async ({ networkName, railWalletID, encryptionKey }) => {
    return getCurrentEphemeralAddress(railWalletID, encryptionKey, networkName);
  },
);

bridgeRegisterCall<RatchetEphemeralAddressParams, void>(
  BridgeCallEvent.RatchetEphemeralAddress,
  async ({ networkName, railWalletID }) => {
    return ratchetEphemeralAddress(railWalletID, networkName);
  },
);

bridgeRegisterCall<SyncEphemeralIndexParams, number>(
  BridgeCallEvent.SyncEphemeralIndex,
  async ({ chain, railWalletID, encryptionKey }) => {
    const railgunWallet = fullWalletForID(railWalletID);
    const ephemeralKeyManager = new EphemeralKeyManager(
      railgunWallet,
      encryptionKey,
    );
    return ephemeralKeyManager.scanHistoryForEphemeralIndex(chain);
  },
);

bridgeRegisterCall<GetEphemeralKeyIndexParams, number>(
  BridgeCallEvent.GetEphemeralKeyIndex,
  async ({ railWalletID, chainId }) => {
    return fullWalletForID(railWalletID).getEphemeralKeyIndex(BigInt(chainId));
  },
);

bridgeRegisterCall<GetEphemeralAddressesForRangeParams, string[]>(
  BridgeCallEvent.GetEphemeralAddressesForRange,
  async ({ railWalletID, encryptionKey, chainId, fromIndex, toIndex }) => {
    const ephemeralKeyManager = new EphemeralKeyManager(
      fullWalletForID(railWalletID),
      encryptionKey,
    );
    const addresses: string[] = [];
    for (let index = fromIndex; index <= toIndex; index += 1) {
      const account = await ephemeralKeyManager.getAccount(
        BigInt(chainId),
        index,
      );
      addresses.push(account.address);
    }
    return addresses;
  },
);

bridgeRegisterCall<GetEphemeralPrivateKeyParams, string>(
  BridgeCallEvent.GetEphemeralPrivateKey,
  async ({ railWalletID, encryptionKey, chainId, index }) => {
    const ephemeralKeyManager = new EphemeralKeyManager(
      fullWalletForID(railWalletID),
      encryptionKey,
    );
    const account = await ephemeralKeyManager.getAccount(
      BigInt(chainId),
      index,
    );

    return account.signer.privateKey;
  },
);
