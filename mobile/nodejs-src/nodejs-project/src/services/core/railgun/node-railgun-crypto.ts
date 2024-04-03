import { bridgeRegisterCall } from '../../bridge/node-ipc-service';
import { pbkdf2 } from '@railgun-community/wallet';
import { Pbkdf2Response } from '@railgun-community/shared-models';
import { BridgeCallEvent, Pbkdf2Params } from '../../bridge/model';

bridgeRegisterCall<Pbkdf2Params, Pbkdf2Response>(
  BridgeCallEvent.Pbkdf2,
  async ({ secret, salt, iterations }): Promise<Pbkdf2Response> => {
    return pbkdf2(secret, salt, iterations);
  },
);
