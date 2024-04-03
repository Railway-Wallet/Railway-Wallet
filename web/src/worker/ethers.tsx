import { mnemonicTo0xPKey } from '@railgun-community/wallet';
import { BridgeCallEvent, MnemonicTo0xPKeyParams } from '@react-shared';
import { bridgeRegisterCall } from './worker-ipc-service';

bridgeRegisterCall<MnemonicTo0xPKeyParams, string>(
  BridgeCallEvent.MnemonicTo0xPKey,
  async ({ mnemonic, derivationIndex }) => {
    return mnemonicTo0xPKey(mnemonic, derivationIndex);
  },
);
