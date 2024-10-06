import { isDefined, RailgunWalletInfo } from "@railgun-community/shared-models";
import EncryptedStorage from "react-native-encrypted-storage";
import {
  AvailableWallet,
  createRailgunWallet,
  createViewOnlyRailgunWallet,
  deleteRailgunWalletByID,
  loadRailgunWalletByID,
  mnemonicTo0xPKey,
  StoredWallet,
  unloadRailgunWalletByID,
  WalletSecureService,
} from "@react-shared";
import { getOrCreateDbEncryptionKey } from "@services/core/db";
import { Constants } from "@utils/constants";

export class WalletSecureServiceReactNative extends WalletSecureService {
  async createRailgunWallet(
    mnemonic: string,
    creationBlockNumbers: Optional<MapType<number>>
  ): Promise<RailgunWalletInfo> {
    return createRailgunWallet(
      await getOrCreateDbEncryptionKey(),
      mnemonic,
      creationBlockNumbers
    );
  }

  async createViewOnlyRailgunWallet(
    shareableViewingKey: string,
    creationBlockNumbers: Optional<MapType<number>>
  ): Promise<RailgunWalletInfo> {
    return createViewOnlyRailgunWallet(
      await getOrCreateDbEncryptionKey(),
      shareableViewingKey,
      creationBlockNumbers
    );
  }

  async loadRailgunWalletByID(
    railWalletID: string,
    isViewOnlyWallet: boolean
  ): Promise<RailgunWalletInfo> {
    return loadRailgunWalletByID(
      await getOrCreateDbEncryptionKey(),
      railWalletID,
      isViewOnlyWallet
    );
  }

  unloadRailgunWalletByID(railWalletID: string): Promise<void> {
    return unloadRailgunWalletByID(railWalletID);
  }

  deleteRailgunWalletByID(railWalletID: string): Promise<void> {
    return deleteRailgunWalletByID(railWalletID);
  }

  private getWalletMnemonicKey = (walletID: string) => {
    return Constants.WALLET_MNEMONIC_KEY + "|" + walletID;
  };

  storeWalletMnemonic = async (wallet: StoredWallet, mnemonic: string) => {
    await EncryptedStorage.setItem(
      this.getWalletMnemonicKey(wallet.id),
      mnemonic
    );
  };

  getWalletMnemonic = async (wallet: StoredWallet) => {
    const mnemonic = await EncryptedStorage.getItem(
      this.getWalletMnemonicKey(wallet.id)
    );
    if (!isDefined(mnemonic)) {
      throw new Error(
        "Could not find encrypted mnemonics for your wallets. Please re-install your app."
      );
    }
    return mnemonic;
  };

  getWallet0xPKey = async (wallet: StoredWallet | AvailableWallet) => {
    const mnemonic = await this.getWalletMnemonic(wallet);
    const { derivationIndex } = wallet;
    return mnemonicTo0xPKey(mnemonic, derivationIndex);
  };
}
