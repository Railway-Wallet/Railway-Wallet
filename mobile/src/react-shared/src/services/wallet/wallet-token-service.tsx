import {
  isDefined,
  Network,
  NetworkName,
} from "@railgun-community/shared-models";
import {
  ERC20Token,
  ERC20TokenFullInfo,
  SearchableERC20,
} from "../../models/token";
import { FrontendWallet, StoredWallet } from "../../models/wallet";
import { AppDispatch } from "../../redux-store/store";
import {
  compareTokens,
  createERC20TokenFromSearchableERC20,
  getDefaultAddedTokens,
} from "../../utils/tokens";
import { refreshReceivedTransactionWatchers } from "../transactions/transfer-watcher-service";
import { WalletStorageService } from "./wallet-storage-service";

export class WalletTokenService {
  private dispatch: AppDispatch;
  private walletStorageService: WalletStorageService;

  constructor(dispatch: AppDispatch) {
    this.dispatch = dispatch;
    this.walletStorageService = new WalletStorageService(dispatch);
  }

  async addERC20TokensToWallet(
    wallet: FrontendWallet,
    searchableERC20s: SearchableERC20[],
    network: Network
  ): Promise<void> {
    const networkName = network.name;

    const newERC20Tokens: ERC20TokenFullInfo[] = searchableERC20s.map(
      (searchableERC20) => {
        return createERC20TokenFromSearchableERC20(searchableERC20);
      }
    );
    const updatedWallet = { ...wallet };
    const prevTokens = wallet.addedTokens[networkName] ?? [];

    const filteredNewERC20Tokens: ERC20TokenFullInfo[] = [];
    for (const newToken of newERC20Tokens) {
      const foundTokenInPrevTokens =
        prevTokens.filter((prevToken) => compareTokens(prevToken, newToken))
          .length > 0;
      if (!foundTokenInPrevTokens) {
        filteredNewERC20Tokens.push(newToken);
      }
    }

    updatedWallet.addedTokens = {
      ...updatedWallet.addedTokens,
      [networkName]: [...prevTokens, ...filteredNewERC20Tokens],
    };

    if (updatedWallet.isActive) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      refreshReceivedTransactionWatchers(updatedWallet, network, this.dispatch);
    }

    await this.walletStorageService.updateWallet(updatedWallet);
  }

  async removeTokenFromWallet(
    wallet: FrontendWallet,
    removeToken: ERC20Token,
    network: Network
  ): Promise<void> {
    if (
      !(removeToken.isAddressOnly ?? false) &&
      (removeToken.disableWalletRemoval ?? false)
    ) {
      return;
    }

    const networkName = network.name;

    const addedTokensWithRemoved = wallet.addedTokens[networkName]?.filter(
      (addedToken) => !compareTokens(addedToken, removeToken)
    );
    const updatedWallet: FrontendWallet = {
      ...wallet,
    };
    updatedWallet.addedTokens = {
      ...wallet.addedTokens,
      [networkName]: addedTokensWithRemoved,
    };

    if (updatedWallet.isActive) {
      await refreshReceivedTransactionWatchers(
        updatedWallet,
        network,
        this.dispatch
      );
    }

    await this.walletStorageService.updateWallet(updatedWallet);
  }

  private async addDefaultNetworkTokensToWallet(
    wallet: StoredWallet,
    networkName: NetworkName
  ) {
    const supportedNetworkNames: NetworkName[] = [
      ...wallet.supportedNetworkNames,
      networkName,
    ];
    const addedTokens: MapType<ERC20TokenFullInfo[]> = {
      ...wallet.addedTokens,
      [networkName]: getDefaultAddedTokens(networkName),
    };
    const updatedWallet: StoredWallet = {
      ...wallet,
      supportedNetworkNames,
      addedTokens,
    };
    await this.walletStorageService.updateWallet(updatedWallet);
  }

  async addTokensForWalletsIfNeeded(networkName: NetworkName) {
    const storedWallets = await this.walletStorageService.fetchStoredWallets();

    for (const wallet of storedWallets) {
      if (
        !wallet.supportedNetworkNames.includes(networkName) ||
        !isDefined(wallet.addedTokens[networkName]) ||
        wallet.addedTokens[networkName]?.length === 0
      ) {
        await this.addDefaultNetworkTokensToWallet(wallet, networkName);
      }
    }
  }

  async resetTokensToDefaults(wallet: FrontendWallet) {
    const addedTokens: MapType<ERC20TokenFullInfo[]> = {};
    wallet.supportedNetworkNames.map((networkName) => {
      if (!Object.values(NetworkName).includes(networkName)) {
        return;
      }
      addedTokens[networkName] = getDefaultAddedTokens(networkName);
    });
    const updatedWallet: StoredWallet = {
      ...wallet,
      addedTokens,
    };
    await this.walletStorageService.updateWallet(updatedWallet);
  }
}
