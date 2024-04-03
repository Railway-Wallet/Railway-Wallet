import { Pbkdf2Response } from '@railgun-community/shared-models';
import { pbkdf2 } from '@railgun-community/wallet';
import { BridgeCallEvent, Pbkdf2Params } from '@react-shared';
import { bridgeRegisterCall } from './worker-ipc-service';

bridgeRegisterCall<Pbkdf2Params, Pbkdf2Response>(
  BridgeCallEvent.Pbkdf2,
  async ({ secret, salt, iterations }): Promise<Pbkdf2Response> => {
    return pbkdf2(secret, salt, iterations);
  },
);
