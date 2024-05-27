import { EncryptDataWithSharedKeySerialized } from '@railgun-community/shared-models';
import {
  getRandomBytes,
  verifyBroadcasterSignature,
  encryptDataWithSharedKey,
  decryptAESGCM256,
  sendMessage,
} from '@railgun-community/wallet';
import { sendError } from '../../bridge/loggers';
import { bridgeRegisterCall } from '../../bridge/node-ipc-service';
import {
  BridgeCallEvent,
  DecryptAESGCM256Params,
  EncryptDataWithSharedKeyParams,
  GetRandomBytesParams,
  VerifyBroadcasterSignatureParams,
} from '../../bridge/model';

const hexStringToUint8Array = (str: string): Uint8Array => {
  return new Uint8Array(Buffer.from(str, 'hex'));
};

const uint8ArrayToHexString = (array: Uint8Array): string => {
  return Buffer.from(array).toString('hex');
};

bridgeRegisterCall<GetRandomBytesParams, string>(
  BridgeCallEvent.GetRandomBytes,
  async ({ length }) => {
    return getRandomBytes(length);
  },
);

bridgeRegisterCall<VerifyBroadcasterSignatureParams, boolean>(
  BridgeCallEvent.VerifyBroadcasterSignature,
  async ({ signature, data, signingKey }) => {
    try {
      const signatureUint8Array = hexStringToUint8Array(signature);
      const dataUint8Array = hexStringToUint8Array(data);
      const signingKeyUint8Array = hexStringToUint8Array(signingKey);
      return verifyBroadcasterSignature(
        signatureUint8Array,
        dataUint8Array,
        signingKeyUint8Array,
      );
    } catch (err) {
      sendMessage('Error in VerifyBroadcasterSignature:');
      sendError(err);
      throw err;
    }
  },
);

bridgeRegisterCall<
  EncryptDataWithSharedKeyParams,
  EncryptDataWithSharedKeySerialized
>(
  BridgeCallEvent.EncryptDataWithSharedKey,
  async ({ data, externalPubKey }) => {
    try {
      const externalPubKeyUint8Array = hexStringToUint8Array(externalPubKey);
      const encryptedDataWithSharedKey = await encryptDataWithSharedKey(
        data,
        externalPubKeyUint8Array,
      );
      const sharedKeySerialized = uint8ArrayToHexString(
        encryptedDataWithSharedKey.sharedKey,
      );
      return {
        ...encryptedDataWithSharedKey,
        sharedKey: sharedKeySerialized,
      };
    } catch (err) {
      sendMessage('Error in EncryptDataWithSharedKey:');
      sendError(err);
      throw err;
    }
  },
);

bridgeRegisterCall<DecryptAESGCM256Params, object | null>(
  BridgeCallEvent.DecryptAESGCM256,
  async ({ encryptedData, key }) => {
    try {
      const keyUint8Array = hexStringToUint8Array(key as string);
      return decryptAESGCM256(encryptedData, keyUint8Array);
    } catch (err) {
      sendMessage('Error in DecryptAESGCM256:');
      sendError(err);
      throw err;
    }
  },
);
