import { RailgunWalletInfo } from '@railgun-community/shared-models';
import {
  AvailableWallet,
  createRailgunWallet,
  createViewOnlyRailgunWallet,
  deleteRailgunWalletByID,
  getWalletMnemonic,
  loadRailgunWalletByID,
  mnemonicTo0xPKey,
  StoredWallet,
  unloadRailgunWalletByID,
  WalletSecureService,
} from '@react-shared';

export class WalletSecureStorageWeb extends WalletSecureService {
  private dbEncryptionKey: string;

  constructor(dbEncryptionKey: string) {
    super();
    this.dbEncryptionKey = dbEncryptionKey;
  }

  createRailgunWallet(
    mnemonic: string,
    creationBlockNumbers: Optional<MapType<number>>,
  ): Promise<RailgunWalletInfo> {
    return createRailgunWallet(
      this.dbEncryptionKey,
      mnemonic,
      creationBlockNumbers,
    );
  }

  createViewOnlyRailgunWallet(
    shareableViewingKey: string,
    creationBlockNumbers: Optional<MapType<number>>,
  ): Promise<RailgunWalletInfo> {
    return createViewOnlyRailgunWallet(
      this.dbEncryptionKey,
      shareableViewingKey,
      creationBlockNumbers,
    );
  }

  loadRailgunWalletByID(
    railWalletID: string,
    isViewOnlyWallet: boolean,
  ): Promise<RailgunWalletInfo> {
    return loadRailgunWalletByID(
      this.dbEncryptionKey,
      railWalletID,
      isViewOnlyWallet,
    );
  }

  async unloadRailgunWalletByID(railWalletID: string): Promise<void> {
    return unloadRailgunWalletByID(railWalletID);
  }

  async deleteRailgunWalletByID(railWalletID: string): Promise<void> {
    return deleteRailgunWalletByID(railWalletID);
  }

  // eslint-disable-next-line require-await
  storeWalletMnemonic = async (_wallet: StoredWallet, _mnemonic: string) => {
    return;
  };

  getWalletMnemonic = async (wallet: StoredWallet) => {
    const mnemonic = await getWalletMnemonic(
      this.dbEncryptionKey,
      wallet.railWalletID,
    );
    if (!mnemonic) {
      throw new Error(
        'Could not find encrypted data for your wallet. Please clear your browser storage to reset the Railway web app.',
      );
    }
    return mnemonic;
  };

  getWallet0xPKey = async (wallet: StoredWallet | AvailableWallet) => {
    const mnemonic = await this.getWalletMnemonic(wallet);
    const derivationIndex = wallet.derivationIndex;
    return mnemonicTo0xPKey(mnemonic, derivationIndex);
  };
}
