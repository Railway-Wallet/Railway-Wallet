import { EncryptDataWithSharedKeySerialized } from "@railgun-community/shared-models";
import {
  BridgeCallEvent,
  DecryptAESGCM256Params,
  EncryptAESGCM256Params,
  EncryptDataWithSharedKeyParams,
  GetRandomBytesParams,
  VerifyBroadcasterSignatureParams,
} from "../models/bridge";
import { bridgeCall } from "./ipc";

export const getRandomBytes = (length: number = 32): Promise<string> => {
  return bridgeCall<GetRandomBytesParams, string>(
    BridgeCallEvent.GetRandomBytes,
    { length }
  );
};

export const verifyBroadcasterSignature = (
  signature: string,
  data: string,
  signingKey: string
): Promise<boolean> => {
  const skipBridgeLogs = true;
  return bridgeCall<VerifyBroadcasterSignatureParams, boolean>(
    BridgeCallEvent.VerifyBroadcasterSignature,
    { signature, data, signingKey },
    skipBridgeLogs
  );
};

export const encryptDataWithSharedKey = (
  data: object,
  externalPubKey: string
): Promise<EncryptDataWithSharedKeySerialized> => {
  return bridgeCall<
    EncryptDataWithSharedKeyParams,
    EncryptDataWithSharedKeySerialized
  >(BridgeCallEvent.EncryptDataWithSharedKey, { data, externalPubKey });
};

export const encryptAESGCM256 = (
  data: object,
  key: Uint8Array
): Promise<[string, string]> => {
  return bridgeCall<EncryptAESGCM256Params, [string, string]>(
    BridgeCallEvent.EncryptAESGCM256,
    { data, key }
  );
};

export const decryptAESGCM256 = (
  encryptedData: [string, string],
  key: Uint8Array | string
): Promise<object | null> => {
  return bridgeCall<DecryptAESGCM256Params, object | null>(
    BridgeCallEvent.DecryptAESGCM256,
    { encryptedData, key }
  );
};
