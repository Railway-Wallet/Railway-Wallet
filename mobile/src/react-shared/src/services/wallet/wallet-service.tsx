import {
  isDefined,
  Network,
  NetworkName,
  RailgunWalletInfo,
} from "@railgun-community/shared-models";
import { Wallet } from "ethers";
import { mnemonicTo0xPKey } from "../../bridge/bridge-ethers";
import { SharedConstants } from "../../config/shared-constants";
import {
  AvailableWallet,
  FrontendWallet,
  FrontendWalletWithMnemonic,
  StoredWallet,
  ViewOnlyWallet,
  WalletAddSource,
} from "../../models/wallet";
import { WalletSecureService } from "../../models/wallet-secure-service";
import {
  clearAllWallets,
  removeWalletByID,
  setActiveWalletByID,
  setAvailableWallets,
  setViewOnlyWallets,
} from "../../redux-store/reducers/wallets-reducer";
import { AppDispatch, store } from "../../redux-store/store";
import { isBlockedAddress } from "../../utils";
import { getBlockNumbersForAllNetworks } from "../../utils/blocks";
import { logDev, logDevError } from "../../utils/logging";
import { getSupportedNetworks } from "../../utils/networks";
import { getDefaultAddedTokensForNetworks } from "../../utils/tokens";
import { generateKey } from "../../utils/util";
import { ProgressService } from "../progress/progress-service";
import { StorageService } from "../storage/storage-service";
import { refreshReceivedTransactionWatchers } from "../transactions/transfer-watcher-service";
import { WalletStorageService } from "./wallet-storage-service";

export class WalletService {
  private dispatch: AppDispatch;
  private walletSecureService: WalletSecureService;
  private walletStorageService: WalletStorageService;

  constructor(dispatch: AppDispatch, walletSecureService: WalletSecureService) {
    this.dispatch = dispatch;
    this.walletSecureService = walletSecureService;
    this.walletStorageService = new WalletStorageService(dispatch);
  }

  async assertNoDuplicateWallet(name: string): Promise<void> {
    const storedWallets = await this.walletStorageService.fetchStoredWallets();
    const duplicateWallet = storedWallets.find(
      (wallet) => wallet.name.toLowerCase() === name.toLowerCase()
    );
    if (duplicateWallet) {
      throw new Error(`A wallet with name '${name}' already exists.`);
    }
  }

  async addFullWallet(
    name: string,
    mnemonic: string,
    currentNetwork: Network,
    derivationIndex?: number,
    isNewWallet: boolean = false,
    originalCreationTimestamp?: number
  ): Promise<AvailableWallet> {
    await this.assertNoDuplicateWallet(name);
    let creationBlockNumbers: Optional<MapType<number>> = {};
    let originalCreationDate: Optional<number>;

    if (isNewWallet) {
      creationBlockNumbers = await getBlockNumbersForAllNetworks();
      originalCreationDate = new Date().getTime() / 1000;
    } else if (isDefined(originalCreationTimestamp)) {
      originalCreationDate = originalCreationTimestamp;
      creationBlockNumbers = await getBlockNumbersForAllNetworks(
        originalCreationTimestamp
      );
    }
    logDev("originalCreationDate:", originalCreationDate);
    logDev("creationBlockNumbers:", creationBlockNumbers);

    if (!isNewWallet && window.navigator.onLine) {
      const pKey = await mnemonicTo0xPKey(mnemonic, derivationIndex);
      const wallet = new Wallet(pKey);
      if (await isBlockedAddress(wallet.address)) {
        throw new Error("This wallet cannot be used with Railway Wallet.");
      }
    }

    const railWalletInfo = await this.createRailgunWallet(
      mnemonic,
      creationBlockNumbers
    );
    const isViewOnlyWallet = false;
    const wallet = await this.addWallet(
      name,
      railWalletInfo,
      isViewOnlyWallet,
      derivationIndex,
      creationBlockNumbers,
      isNewWallet ? WalletAddSource.CreateWallet : WalletAddSource.ImportWallet,
      originalCreationDate
    );
    await this.walletSecureService.storeWalletMnemonic(wallet, mnemonic);

    const storedWallets = await this.walletStorageService.fetchStoredWallets();

    const availableWallets = await this.getAvailableWallets(storedWallets);

    this.dispatch(setAvailableWallets(availableWallets));

    this.dispatch(setActiveWalletByID(wallet.id));

    const newAvailableWallet = availableWallets.find(
      (availableWallet) => wallet.id === availableWallet.id
    );

    if (!newAvailableWallet) {
      throw new Error(
        "Wallet created successfully, but could not be found in list."
      );
    }

    await this.loadRailgunWalletForFrontendWallet(newAvailableWallet);

    try {
      await refreshReceivedTransactionWatchers(
        newAvailableWallet,
        currentNetwork,
        this.dispatch
      );
    } catch (error) {
      logDevError(
        "Failed to set up transaction watchers for new wallet.",
        error
      );
    }

    return newAvailableWallet;
  }

  async addViewOnlyWallet(
    name: string,
    shareableViewingKey: string,
    creationBlockNumbers: Optional<MapType<number>>
  ): Promise<ViewOnlyWallet> {
    await this.assertNoDuplicateWallet(name);
    const railWalletInfo = await this.createViewOnlyRailgunWallet(
      shareableViewingKey,
      creationBlockNumbers
    );
    const isViewOnlyWallet = true;
    const wallet = await this.addWallet(
      name,
      railWalletInfo,
      isViewOnlyWallet,
      undefined,
      creationBlockNumbers,
      WalletAddSource.AddViewOnlyWallet
    );

    const storedWallets = await this.walletStorageService.fetchStoredWallets();

    const viewOnlyWallets = this.getViewOnlyWallets(storedWallets);

    this.dispatch(setViewOnlyWallets(viewOnlyWallets));

    this.dispatch(setActiveWalletByID(wallet.id));

    const newViewOnlyWallet = viewOnlyWallets.find(
      (viewOnlyWallet) => wallet.id === viewOnlyWallet.id
    );
    if (!newViewOnlyWallet) {
      throw new Error(
        "View-Only Wallet created successfully, but could not be found in list."
      );
    }

    return newViewOnlyWallet;
  }

  private async addWallet(
    name: string,
    railgunWalletInfo: RailgunWalletInfo,
    isViewOnlyWallet: Optional<boolean>,
    derivationIndex: Optional<number>,
    creationBlockNumbers: Optional<MapType<number>>,
    walletAddSource: WalletAddSource,
    originalCreationDate?: number
  ): Promise<StoredWallet> {
    const supportedNetworkNames: NetworkName[] = getSupportedNetworks().map(
      (n) => n.name
    );

    const id = generateKey();

    const newWallet: StoredWallet = {
      id,
      name,
      railAddress: railgunWalletInfo.railgunAddress,
      railWalletID: railgunWalletInfo.id,
      createdAt: Date.now() / 1000,
      updatedAt: Date.now() / 1000,
      addedTokens: getDefaultAddedTokensForNetworks(supportedNetworkNames),
      supportedNetworkNames: supportedNetworkNames,
      isActive: true,
      derivationIndex,
      isViewOnlyWallet,
      creationBlockNumbers,
      walletAddSource,
      originalCreationDate,
    };

    const storedWallets = await this.walletStorageService.fetchStoredWallets();

    for (const w of storedWallets) {
      w.isActive = false;
    }

    const newWalletsArray: StoredWallet[] = [...storedWallets, newWallet];

    await this.walletStorageService.storeWallets(newWalletsArray);

    return newWallet;
  }

  assertValidImportedWalletData(
    importedWalletData: FrontendWalletWithMnemonic
  ) {
    if (!isDefined(importedWalletData)) {
      throw new Error("No imported wallet data provided");
    }
    if (typeof importedWalletData.name !== "string") {
      throw new Error("name is not a string");
    }
    if (
      isDefined(importedWalletData.originalCreationDate) &&
      typeof importedWalletData.originalCreationDate !== "number"
    ) {
      throw new Error("originalCreationDate is not a number");
    }
    if (typeof importedWalletData.addedTokens !== "object") {
      throw new Error("addedTokens is not an object");
    }
    if (
      isDefined(importedWalletData.derivationIndex) &&
      typeof importedWalletData.derivationIndex !== "number"
    ) {
      throw new Error("derivationIndex is not a number");
    }
    if (
      importedWalletData.isViewOnlyWallet &&
      typeof importedWalletData.isViewOnlyWallet !== "boolean"
    ) {
      throw new Error("isViewOnlyWallet is not a boolean");
    }
  }

  async updateImportedWalletData(
    wallet: FrontendWallet,
    importedWalletData: FrontendWalletWithMnemonic
  ): Promise<void> {
    this.assertValidImportedWalletData(importedWalletData);

    const {
      name,
      originalCreationDate,
      addedTokens,
      derivationIndex,
      isViewOnlyWallet,
      creationBlockNumbers,
    } = importedWalletData;

    const newWallet = {
      ...wallet,
      name,
      originalCreationDate,
      addedTokens,
      derivationIndex,
      isViewOnlyWallet,
      creationBlockNumbers,
    };

    await this.walletStorageService.updateWallet(newWallet);
  }

  async createRailgunWallet(
    mnemonic: string,
    creationBlockNumbers: Optional<MapType<number>>
  ): Promise<RailgunWalletInfo> {
    return this.walletSecureService.createRailgunWallet(
      mnemonic,
      creationBlockNumbers
    );
  }

  async createViewOnlyRailgunWallet(
    shareableViewingKey: string,
    creationBlockNumbers: Optional<MapType<number>>
  ): Promise<RailgunWalletInfo> {
    return this.walletSecureService.createViewOnlyRailgunWallet(
      shareableViewingKey,
      creationBlockNumbers
    );
  }

  async removeWallet(id: string, skipUpdatingActiveWallet?: boolean) {
    const storedWallets = await this.walletStorageService.fetchStoredWallets();
    const storedWallet = storedWallets.find((w) => w.id === id);
    if (!storedWallet) {
      return;
    }

    this.dispatch(removeWalletByID(id));

    const newStoredWalletsArray = storedWallets.filter(
      (wallet) => wallet.id !== id
    );

    if (storedWallet.isActive && newStoredWalletsArray.length) {
      const firstWallet = newStoredWalletsArray[0];
      firstWallet.isActive = true;

      if (!(skipUpdatingActiveWallet ?? false)) {
        this.dispatch(setActiveWalletByID(firstWallet.id));
      }
    }

    if (newStoredWalletsArray.length) {
      await this.walletStorageService.storeWallets(newStoredWalletsArray);
    } else {
      await StorageService.removeItem(SharedConstants.AVAILABLE_WALLETS);
    }

    const hasAnotherWalletSameID = newStoredWalletsArray.some(
      (wallet) =>
        wallet.railWalletID === storedWallet.railWalletID &&
        wallet.id !== storedWallet.id
    );

    if (!hasAnotherWalletSameID) {
      await this.walletSecureService.deleteRailgunWalletByID(
        storedWallet.railWalletID
      );
    }
  }

  async clearAllWallets() {
    const storedWallets = await this.walletStorageService.fetchStoredWallets();

    await StorageService.removeItem(SharedConstants.AVAILABLE_WALLETS);

    this.dispatch(clearAllWallets());

    await Promise.all(
      storedWallets.map(async (wallet) => {
        await this.walletSecureService.deleteRailgunWalletByID(
          wallet.railWalletID
        );
      })
    );
  }

  async loadWalletsFromStorage(
    network: Network,
    progressCallback: (walletLoadProgress: number) => void
  ): Promise<boolean> {
    progressCallback(0);

    const storedWallets = await this.walletStorageService.fetchStoredWallets();
    progressCallback(10);

    if (storedWallets.length === 0) {
      progressCallback(100);
      const hasWallets = false;
      return hasWallets;
    }

    const progressServiceGetAvailableWallets = new ProgressService(
      10,
      65,
      4000,
      250
    );
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    progressServiceGetAvailableWallets.progressSteadily(progressCallback);
    const availableWallets = await this.getAvailableWallets(storedWallets);
    for (const w of availableWallets) {
      w.isRailgunWalletLoaded = false;
    }
    progressServiceGetAvailableWallets.stop();
    progressCallback(65);

    const viewOnlyWallets = this.getViewOnlyWallets(storedWallets);
    for (const w of viewOnlyWallets) {
      w.isRailgunWalletLoaded = false;
    }
    const allWallets = [...availableWallets, ...viewOnlyWallets];

    const progressServiceLoadRailgunWallets = new ProgressService(
      65,
      99,
      2000,
      250
    );
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    progressServiceLoadRailgunWallets.progressSteadily(progressCallback);

    let activeWallet: Optional<FrontendWallet> = allWallets.find(
      (w) => w.isActive
    );
    if (!activeWallet) {
      allWallets[0] = {
        ...allWallets[0],
        isActive: true,
      };
      activeWallet = allWallets[0];
      const storedWallet = storedWallets.find(
        (wallet) => wallet.id === activeWallet?.id
      );
      if (storedWallet) {
        storedWallet.isActive = true;
        await this.walletStorageService.updateWallet(storedWallet);
      }
    }

    this.dispatch(setAvailableWallets(availableWallets));
    this.dispatch(setViewOnlyWallets(viewOnlyWallets));
    this.dispatch(setActiveWalletByID(activeWallet.id));

    await this.loadRailgunWalletForFrontendWallet(activeWallet);

    progressServiceLoadRailgunWallets.stop();
    progressCallback(99);

    await refreshReceivedTransactionWatchers(
      activeWallet,
      network,
      this.dispatch
    );

    progressCallback(100);

    const hasWallets = true;
    return hasWallets;
  }

  async loadRailgunWalletForFrontendWallet(wallet: FrontendWallet) {
    if (!wallet.isActive) {
      throw new Error("Can only load active wallet into RAILGUN Engine.");
    }

    const railWalletInfo: RailgunWalletInfo =
      await this.walletSecureService.loadRailgunWalletByID(
        wallet.railWalletID,
        wallet.isViewOnlyWallet
      );

    const updatedWallet = { ...wallet, isRailgunWalletLoaded: true };

    if (this.railWalletInfoUpdated(wallet, railWalletInfo)) {
      await this.updateRailgunWalletInfoForWallet(
        updatedWallet,
        railWalletInfo.railgunAddress,
        railWalletInfo.id
      );
    } else if (!(wallet.isRailgunWalletLoaded ?? false)) {
      await this.walletStorageService.updateWallet(updatedWallet);
    }
  }

  private railWalletInfoUpdated(
    activeWallet: StoredWallet,
    railWalletInfo: RailgunWalletInfo
  ) {
    return (
      activeWallet.railAddress !== railWalletInfo.railgunAddress ||
      activeWallet.railWalletID !== railWalletInfo.id
    );
  }

  async updateRailgunWalletInfoForWallet(
    activeWallet: StoredWallet,
    railgunAddress: string,
    railWalletID: string
  ): Promise<StoredWallet> {
    const updatedWallet: StoredWallet = {
      ...activeWallet,
      railWalletID,
      railAddress: railgunAddress,
    };

    await this.walletStorageService.updateWallet(updatedWallet);
    return updatedWallet;
  }

  getFirstFrontendWallet(): Optional<FrontendWallet> {
    const wallets = store.getState().wallets;
    if (wallets.available.length > 0) {
      return wallets.available[0];
    } else if (wallets.viewOnly.length > 0) {
      return wallets.viewOnly[0];
    }

    return undefined;
  }

  private async getAvailableWalletWithEthAddress(
    storedWallet: StoredWallet
  ): Promise<AvailableWallet> {
    const pKey = await this.walletSecureService.getWallet0xPKey(storedWallet);
    const ethWallet = new Wallet(pKey);
    return {
      ...storedWallet,
      isViewOnlyWallet: false,
      ethAddress: ethWallet.address,
    };
  }

  private async getAvailableWallets(
    storedWallets: StoredWallet[]
  ): Promise<AvailableWallet[]> {
    const availableWallets: AvailableWallet[] = await Promise.all(
      storedWallets
        .filter((storedWallet) => !(storedWallet.isViewOnlyWallet ?? false))
        .map((storedWallet) =>
          this.getAvailableWalletWithEthAddress(storedWallet)
        )
    );
    return availableWallets;
  }

  private getViewOnlyWallets(storedWallets: StoredWallet[]): ViewOnlyWallet[] {
    const viewOnlyWallets: ViewOnlyWallet[] = storedWallets
      .filter((storedWallet) => storedWallet.isViewOnlyWallet)
      .map((storedWallet) => ({ ...storedWallet, isViewOnlyWallet: true }));
    return viewOnlyWallets;
  }
}
