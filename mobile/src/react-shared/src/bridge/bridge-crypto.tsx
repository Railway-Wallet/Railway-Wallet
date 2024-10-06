import { Pbkdf2Response } from "@railgun-community/shared-models";
import { BridgeCallEvent, Pbkdf2Params } from "../models/bridge";
import { bridgeCall } from "./ipc";

export const pbkdf2 = (
  secret: string,
  salt: string,
  iterations: number
): Promise<Pbkdf2Response> => {
  return bridgeCall<Pbkdf2Params, Pbkdf2Response>(
    BridgeCallEvent.Pbkdf2,
    {
      secret,
      salt,
      iterations,
    },
    true
  );
};
