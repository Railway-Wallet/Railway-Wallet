import { BridgeCallEvent, MnemonicTo0xPKeyParams } from "../models/bridge";
import { bridgeCall } from "./ipc";

export const mnemonicTo0xPKey = async (
  mnemonic: string,
  derivationIndex?: number
): Promise<string> => {
  const skipBridgeLogs = true;
  const pKey = await bridgeCall<MnemonicTo0xPKeyParams, string>(
    BridgeCallEvent.MnemonicTo0xPKey,
    { mnemonic, derivationIndex },
    skipBridgeLogs
  );
  return pKey;
};
