import { isDefined, Network } from "@railgun-community/shared-models";
import { SharedConstants } from "../../config/shared-constants";
import {
  AvailableWallet,
  FrontendWallet,
  StoredWallet,
  ViewOnlyWallet,
} from "../../models/wallet";
import {
  setActiveWalletByID,
  setAvailableWallets,
  setViewOnlyWallets,
} from "../../redux-store/reducers/wallets-reducer";
import { AppDispatch, store } from "../../redux-store/store";
import { logDevError } from "../../utils/logging";
import { StorageService } from "../storage/storage-service";
import { refreshReceivedTransactionWatchers } from "../transactions/transfer-watcher-service";

export class WalletStorageService {
  private dispatch: AppDispatch;

  constructor(dispatch: AppDispatch) {
    this.dispatch = dispatch;
  }

  async fetchStoredWallets(): Promise<StoredWallet[]> {
    try {
      const storedJsonValue = await StorageService.getItem(
        SharedConstants.AVAILABLE_WALLETS
      );
      if (isDefined(storedJsonValue)) {
        const wallets = JSON.parse(storedJsonValue) as StoredWallet[];
        return WalletStorageService.sortWallets(wallets);
      }

      return [];
    } catch (e) {
      const error = new Error("Error fetching wallets", { cause: e });
      logDevError(error);
      throw error;
    }
  }

  static sortWallets(wallets: StoredWallet[]): StoredWallet[] {
    return wallets.sort((a, b) => {
      if (!a.updatedAt && b.updatedAt) {
        return 1;
      }
      if (a.updatedAt && !b.updatedAt) {
        return -1;
      }
      if (!a.updatedAt && !b.updatedAt) {
        return a.createdAt > b.createdAt ? -1 : 0;
      }
      return a.updatedAt > b.updatedAt ? -1 : 0;
    });
  }

  async storeWallets(wallets: StoredWallet[]) {
    await StorageService.setItem(
      SharedConstants.AVAILABLE_WALLETS,
      JSON.stringify(wallets)
    );
  }

  async setActiveWallet(
    activeWallet: FrontendWallet,
    network: Network
  ): Promise<FrontendWallet> {
    activeWallet.isActive = true;

    const storedWallets = await this.fetchStoredWallets();
    for (const w of storedWallets) {
      w.isActive = w.id === activeWallet.id;
    }

    await this.storeWallets(storedWallets);

    await refreshReceivedTransactionWatchers(
      activeWallet,
      network,
      this.dispatch
    );

    this.dispatch(setActiveWalletByID(activeWallet.id));

    return activeWallet;
  }

  async updateWallet(wallet: StoredWallet) {
    const storedWallets = await this.fetchStoredWallets();
    const indexStored = storedWallets.findIndex((w) => w.id === wallet.id);
    const foundStored = indexStored !== -1;
    if (!foundStored) {
      throw new Error("Stored wallet not found.");
    }
    wallet.updatedAt = Date.now() / 1000;
    storedWallets[indexStored] = wallet;

    if (wallet.isViewOnlyWallet ?? false) {
      const viewOnlyWallets = store.getState().wallets.viewOnly;
      const found = viewOnlyWallets.find((w) => w.id === wallet.id);
      if (!found) {
        throw new Error("View only wallet not found.");
      }

      const updatedViewOnlyWallet: ViewOnlyWallet = {
        ...wallet,
        isViewOnlyWallet: true,
      };
      const filteredViewOnlyWallets = viewOnlyWallets.filter(
        (w) => w.id !== wallet.id
      );

      this.dispatch(
        setViewOnlyWallets([updatedViewOnlyWallet, ...filteredViewOnlyWallets])
      );
    } else {
      const availableWallets = store.getState().wallets.available;
      const found = availableWallets.find((w) => w.id === wallet.id);
      if (!found) {
        throw new Error("Available wallet not found.");
      }

      const updatedAvailableWallet: AvailableWallet = {
        ...wallet,
        ethAddress: found.ethAddress,
        isViewOnlyWallet: false,
      };
      const filteredAvailableWallets = availableWallets.filter(
        (w) => w.id !== wallet.id
      );

      this.dispatch(
        setAvailableWallets([
          updatedAvailableWallet,
          ...filteredAvailableWallets,
        ])
      );
    }

    if (wallet.isActive) {
      this.dispatch(setActiveWalletByID(wallet.id));
    }

    await this.storeWallets(storedWallets);
  }
}
