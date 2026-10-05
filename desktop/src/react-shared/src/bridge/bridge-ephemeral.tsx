import { Chain, NetworkName } from '@railgun-community/shared-models';
import {
  BridgeCallEvent,
  GetCurrentEphemeralAddressParams,
  GetEphemeralAddressesForRangeParams,
  GetEphemeralKeyIndexParams,
  GetEphemeralPrivateKeyParams,
  RatchetEphemeralAddressParams,
  SyncEphemeralIndexParams,
} from '../models/bridge';
import { bridgeCall } from './ipc';

export const getCurrentEphemeralAddress = (
  networkName: NetworkName,
  railWalletID: string,
  encryptionKey: string,
): Promise<string> => {
  return bridgeCall<GetCurrentEphemeralAddressParams, string>(
    BridgeCallEvent.GetCurrentEphemeralAddress,
    {
      networkName,
      railWalletID,
      encryptionKey,
    },
  );
};

export const ratchetEphemeralAddress = (
  networkName: NetworkName,
  railWalletID: string,
): Promise<void> => {
  return bridgeCall<RatchetEphemeralAddressParams, void>(
    BridgeCallEvent.RatchetEphemeralAddress,
    {
      networkName,
      railWalletID,
    },
  );
};

export const syncEphemeralIndex = (
  chain: Chain,
  railWalletID: string,
  encryptionKey: string,
): Promise<number> => {
  return bridgeCall<SyncEphemeralIndexParams, number>(
    BridgeCallEvent.SyncEphemeralIndex,
    {
      chain,
      railWalletID,
      encryptionKey,
    },
  );
};

export const getEphemeralKeyIndex = (
  railWalletID: string,
  chainId: number,
): Promise<number> => {
  return bridgeCall<GetEphemeralKeyIndexParams, number>(
    BridgeCallEvent.GetEphemeralKeyIndex,
    {
      railWalletID,
      chainId,
    },
  );
};

export const getEphemeralAddressesForRange = (
  railWalletID: string,
  encryptionKey: string,
  chainId: number,
  fromIndex: number,
  toIndex: number,
): Promise<string[]> => {
  return bridgeCall<GetEphemeralAddressesForRangeParams, string[]>(
    BridgeCallEvent.GetEphemeralAddressesForRange,
    {
      railWalletID,
      encryptionKey,
      chainId,
      fromIndex,
      toIndex,
    },
  );
};

export const getEphemeralPrivateKey = (
  railWalletID: string,
  encryptionKey: string,
  chainId: number,
  index: number,
): Promise<string> => {
  return bridgeCall<GetEphemeralPrivateKeyParams, string>(
    BridgeCallEvent.GetEphemeralPrivateKey,
    {
      railWalletID,
      encryptionKey,
      chainId,
      index,
    },
  );
};
