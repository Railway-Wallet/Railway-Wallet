import {
  decryptAESGCM256,
  encryptAESGCM256,
  EncryptedData,
} from '@railgun-community/wallet';
import {
  BridgeCallEvent,
  DecryptAESGCM256Params,
  EncryptAESGCM256Params,
} from '@react-shared';
import { bridgeRegisterCall } from './worker-ipc-service';

bridgeRegisterCall<EncryptAESGCM256Params, EncryptedData>(
  BridgeCallEvent.EncryptAESGCM256,
  async ({ data, key }) => {
    return encryptAESGCM256(data, key as Uint8Array);
  },
);

bridgeRegisterCall<DecryptAESGCM256Params, object | null>(
  BridgeCallEvent.DecryptAESGCM256,
  async ({ encryptedData, key }) => {
    return decryptAESGCM256(encryptedData, key as Uint8Array);
  },
);
