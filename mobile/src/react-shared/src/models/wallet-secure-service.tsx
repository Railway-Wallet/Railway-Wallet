import { RailgunWalletInfo } from "@railgun-community/shared-models";
import { AvailableWallet, StoredWallet } from "./wallet";

export abstract class WalletSecureService {
  abstract createRailgunWallet(
    mnemonic: string,
    creationBlockNumbers: Optional<MapType<number>>
  ): Promise<RailgunWalletInfo>;

  abstract createViewOnlyRailgunWallet(
    shareableViewingKey: string,
    creationBlockNumbers: Optional<MapType<number>>
  ): Promise<RailgunWalletInfo>;

  abstract loadRailgunWalletByID(
    railWalletID: string,
    isViewOnlyWallet: boolean
  ): Promise<RailgunWalletInfo>;

  abstract unloadRailgunWalletByID(railWalletID: string): Promise<void>;

  abstract deleteRailgunWalletByID(railWalletID: string): Promise<void>;

  abstract storeWalletMnemonic(
    wallet: StoredWallet,
    mnemonic: string
  ): Promise<void>;

  abstract getWalletMnemonic(wallet: StoredWallet): Promise<string>;

  abstract getWallet0xPKey(
    wallet: StoredWallet | AvailableWallet
  ): Promise<string>;
}
