import { mnemonicTo0xPKey } from '@railgun-community/wallet';
import { bridgeRegisterCall } from '../bridge/node-ipc-service';
import { BridgeCallEvent, MnemonicTo0xPKeyParams } from '../bridge/model';

bridgeRegisterCall<MnemonicTo0xPKeyParams, string>(
  BridgeCallEvent.MnemonicTo0xPKey,
  async ({ mnemonic, derivationIndex }) => {
    return mnemonicTo0xPKey(mnemonic, derivationIndex);
  },
);
