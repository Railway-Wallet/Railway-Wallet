import {
  isDefined,
  NetworkName,
  NFTAmount,
  RailgunWalletBalanceBucket,
  TXIDVersion,
} from "@railgun-community/shared-models";
import { SharedConstants } from "../../config/shared-constants";
import {
  BASE_TOKEN_ADDRESS,
  ERC20Balance,
  ERC20BalancesSerialized,
} from "../../models/token";
import {
  CachedERC20Balance,
  CachedNFTBalance,
  RailgunCachedERC20Balance,
  RailgunCachedNFTAmounts,
  RailgunERC20BalanceMap,
  RailgunNFTAmountsMap,
  RailgunTXIDBalanceMap,
  RailgunTXIDVersionNFTAmountMap,
} from "../../models/wallet";
import { StorageService } from "../storage/storage-service";

export const cacheERC20Balances = async (
  networkName: NetworkName,
  walletID: string,
  erc20Balances: ERC20BalancesSerialized
): Promise<void> => {
  const tokenAddresses = Object.keys(erc20Balances);
  const formattedTokenBalances: ERC20Balance[] = [];
  for (const tokenAddress of tokenAddresses) {
    const isBaseToken = tokenAddress === BASE_TOKEN_ADDRESS;
    formattedTokenBalances.push({
      tokenAddress,
      balanceString: erc20Balances[tokenAddress] ?? "0",
      isBaseToken,
    });
  }

  const storageKey = SharedConstants.CACHED_BALANCES;

  const cachedBalance: CachedERC20Balance = {
    networkName,
    walletID,
    updatedTokenBalances: formattedTokenBalances,
  };

  await StorageService.setItem(storageKey, JSON.stringify(cachedBalance));
};

export const cacheERC20BalancesRailgun = async (
  networkName: NetworkName,
  walletID: string,
  erc20BalancesMap: RailgunTXIDBalanceMap
): Promise<void> => {
  const formattedBalanceMap: RailgunERC20BalanceMap = {};

  const txidVersions = Object.keys(erc20BalancesMap) as TXIDVersion[];
  for (const txidVersion of txidVersions) {
    const txidBalanceBucketBuckets = erc20BalancesMap[txidVersion];
    const balanceBuckets = Object.keys(
      txidBalanceBucketBuckets
    ) as RailgunWalletBalanceBucket[];

    for (const balanceBucket of balanceBuckets) {
      const erc20Balances = txidBalanceBucketBuckets[balanceBucket];
      if (!erc20Balances) continue;

      const tokenAddresses = Object.keys(erc20Balances);

      const tokenBalances: ERC20Balance[] = [];

      for (const tokenAddress of tokenAddresses) {
        const isBaseToken = tokenAddress === BASE_TOKEN_ADDRESS;

        tokenBalances.push({
          tokenAddress,
          balanceString: erc20Balances[tokenAddress] ?? "0",
          isBaseToken,
        });
      }

      const txidVersionMap = formattedBalanceMap[txidVersion];
      if (!isDefined(txidVersionMap)) {
        formattedBalanceMap[txidVersion] = {
          [balanceBucket]: tokenBalances,
        };
      } else {
        txidVersionMap[balanceBucket] = tokenBalances;
      }
    }
  }

  const storageKey = SharedConstants.CACHED_BALANCES + "_RAILGUN_V2";

  const cachedBalance: RailgunCachedERC20Balance = {
    networkName,
    walletID,
    updatedTokenBalancesMap: formattedBalanceMap,
  };

  await StorageService.setItem(storageKey, JSON.stringify(cachedBalance));
};

export const cacheNFTBalances = async (
  networkName: NetworkName,
  walletID: string,
  nftAmounts: NFTAmount[]
): Promise<void> => {
  const storageKey = SharedConstants.CACHED_NFT_BALANCES;

  const cachedBalance: CachedNFTBalance = {
    networkName,
    walletID,
    nftAmounts,
  };
  await StorageService.setItem(storageKey, JSON.stringify(cachedBalance));
};

export const cacheNFTBalancesRailgun = async (
  networkName: NetworkName,
  walletID: string,
  nftAmountsTXIDVersionMap: RailgunTXIDVersionNFTAmountMap
): Promise<void> => {
  const formattedNFTAmountsMap: RailgunNFTAmountsMap = {};

  const txidVersions = Object.keys(nftAmountsTXIDVersionMap) as TXIDVersion[];
  for (const txidVersion of txidVersions) {
    if (!isDefined(formattedNFTAmountsMap[txidVersion])) {
      formattedNFTAmountsMap[txidVersion] = {
        [RailgunWalletBalanceBucket.Spendable]: [],
        [RailgunWalletBalanceBucket.ShieldPending]: [],
        [RailgunWalletBalanceBucket.MissingInternalPOI]: [],
        [RailgunWalletBalanceBucket.MissingExternalPOI]: [],
        [RailgunWalletBalanceBucket.ShieldBlocked]: [],
        [RailgunWalletBalanceBucket.ProofSubmitted]: [],
      };
    }

    const txidBalanceBucketBuckets = nftAmountsTXIDVersionMap[txidVersion];
    const balanceBuckets = Object.keys(
      txidBalanceBucketBuckets
    ) as RailgunWalletBalanceBucket[];

    for (const balanceBucket of balanceBuckets) {
      const nftAmounts = txidBalanceBucketBuckets[balanceBucket];
      if (nftAmounts) {
        for (const nftAmount of nftAmounts) {
          formattedNFTAmountsMap[txidVersion]?.[balanceBucket]?.push(nftAmount);
        }
      }
    }
  }

  const storageKey = SharedConstants.CACHED_NFT_BALANCES + "_RAILGUN_V2";

  const cachedBalance: RailgunCachedNFTAmounts = {
    networkName,
    walletID,
    nftAmountsMap: formattedNFTAmountsMap,
  };
  await StorageService.setItem(storageKey, JSON.stringify(cachedBalance));
};
