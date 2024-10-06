import {
  Chain,
  compareChains,
  isDefined,
  Network,
  NetworkName,
  NFTAmount,
  RailgunWalletBalanceBucket,
  removeUndefineds,
  TXIDVersion,
} from "@railgun-community/shared-models";
import { ReactConfig } from "../../config";
import { SharedConstants } from "../../config/shared-constants";
import { DEFAULT_WALLET_TOKENS_FOR_NETWORK } from "../../models/default-tokens";
import { NFTAmountAndMetadata } from "../../models/nft";
import {
  ERC20Balance,
  ERC20BalancesSerialized,
  ERC20Token,
  ERC20TokenBalance,
} from "../../models/token";
import {
  AvailableWallet,
  CachedERC20Balance,
  CachedNFTBalance,
  FrontendWallet,
  RailgunCachedERC20Balance,
  RailgunCachedNFTAmounts,
  RailgunERC20AmountMap,
  RailgunERC20BalanceMap,
  RailgunNFTAmountsMap,
  RailgunTXIDBalanceMap,
  RailgunTXIDVersionNFTAmountMap,
} from "../../models/wallet";
import {
  NetworkWalletBalances,
  NetworkWalletBalanceState,
  resetERC20BalancesNetwork,
  updateERC20BalancesNetwork,
} from "../../redux-store/reducers/erc20-balance-reducer-network";
import {
  RailgunWalletBalances,
  RailgunWalletBalanceState,
  resetERC20BalancesRailgun,
  updateERC20BalancesRailgun,
  UpdateRailgunTokenBalancesPayload,
} from "../../redux-store/reducers/erc20-balance-reducer-railgun";
import { TokenPrices } from "../../redux-store/reducers/network-price-reducer";
import {
  resetNFTBalancesNetwork,
  updateNFTBalancesNetwork,
  UpdateNFTBalancesPayload,
} from "../../redux-store/reducers/nft-balance-reducer-network";
import {
  resetNFTBalancesRailgun,
  updateNFTBalancesRailgun,
  UpdateRailgunNFTBalancesPayload,
} from "../../redux-store/reducers/nft-balance-reducer-railgun";
import { addNFTsMetadata } from "../../redux-store/reducers/nfts-metadata-reducer";
import { AppDispatch, store } from "../../redux-store/store";
import { logDevError } from "../../utils";
import {
  compareTokenAddress,
  isWrappedBaseTokenForNetwork,
  tokenAddressForBalances,
  tokenAddressForPrices,
  tokenFoundInList,
  zeroRailShieldedBalance,
} from "../../utils/tokens";
import { getDecimalBalanceCurrency } from "../../utils/util";
import { walletsForRailgunWalletID } from "../../utils/wallets";
import {
  getNFTsAndMetadata,
  pullOwnedNFTMetadata,
} from "../api/alchemy/alchemy-nft";
import { StorageService } from "../storage/storage-service";
import { getERC20Balance } from "../token/erc20";
import { OmittedPrivateTokensService } from "../token/omitted-private-tokens-service";

export type RailShieldedTokenBalance = {
  tokenAddress: string;
  balance: bigint;
};

const pullingBalancesForNetwork: MapType<boolean> = {};
const pullingNFTsForNetwork: MapType<boolean> = {};

const emptyTokensList: ERC20Token[] = [];

export const getERC20TokensForNetwork = (
  wallet: Optional<FrontendWallet>,
  networkName: NetworkName
): ERC20Token[] => {
  if (!wallet) {
    return DEFAULT_WALLET_TOKENS_FOR_NETWORK[networkName] ?? emptyTokensList;
  }

  const addedTokensForNetwork = wallet.addedTokens[networkName];
  if (!isDefined(addedTokensForNetwork) || addedTokensForNetwork.length < 1) {
    return emptyTokensList;
  }
  return addedTokensForNetwork;
};

const getUniqueTokensForWalletsAndNetwork = (
  wallets: FrontendWallet[],
  networkName: NetworkName
): ERC20Token[] => {
  const allTokens = wallets
    .map((w) => getERC20TokensForNetwork(w, networkName))
    .flat();
  const uniqueTokens: ERC20Token[] = [];
  const uniqueTokenAddresses: string[] = [];

  for (const token of allTokens) {
    if (token.isBaseToken ?? false) {
      uniqueTokens.push(token);
      continue;
    }
    if (!uniqueTokenAddresses.includes(token.address)) {
      uniqueTokens.push(token);
      uniqueTokenAddresses.push(token.address);
    }
  }
  return uniqueTokens;
};

export const getWrappedTokenForNetwork = (
  wallet: Optional<FrontendWallet>,
  network: Network
): Optional<ERC20Token> => {
  const tokens = getERC20TokensForNetwork(wallet, network.name);
  return tokens.find((token) => isWrappedBaseTokenForNetwork(token, network));
};

export const getBaseTokenForNetwork = (
  wallet: Optional<FrontendWallet>,
  network: Network
): Optional<ERC20Token> => {
  const tokens = getERC20TokensForNetwork(wallet, network.name);
  return tokens.find((token) => token.isBaseToken);
};

export const pullActiveWalletBalancesForNetwork = (
  dispatch: AppDispatch,
  network: Network
) => {
  const { wallets } = store.getState();
  return pullWalletBalancesNetwork(dispatch, wallets.active, network);
};

const pullERC20BalancesNetwork = async (
  dispatch: AppDispatch,
  wallet: AvailableWallet,
  network: Network
) => {
  const networkName = network.name;
  const walletTokens = getERC20TokensForNetwork(wallet, networkName);
  const promises: Promise<Optional<bigint>>[] = [];
  for (const token of walletTokens) {
    promises.push(getERC20Balance(dispatch, network, wallet.ethAddress, token));
  }

  const results: Optional<bigint>[] = await Promise.all(promises);

  const tokenBalances: Optional<ERC20Balance>[] = results.map(
    (balance: Optional<bigint>, index: number) => {
      if (!isDefined(balance)) {
        return undefined;
      }
      const token = walletTokens[index];
      return {
        isBaseToken: token.isBaseToken === true,
        tokenAddress: token.address,
        balanceString: balance.toString(),
      };
    }
  );
  const tokenBalancesRemoveNulls: ERC20Balance[] =
    removeUndefineds(tokenBalances);

  dispatch(
    updateERC20BalancesNetwork({
      networkName,
      walletID: wallet.id,
      updatedTokenBalances: tokenBalancesRemoveNulls,
    })
  );
};

export const pullNFTBalancesNetwork = async (
  dispatch: AppDispatch,
  wallet: AvailableWallet,
  network: Network
): Promise<void> => {
  if (!ReactConfig.ENABLE_NFTS) {
    return;
  }

  try {
    const nftAmountsAndMetadata = await pullOwnedNFTMetadata(
      network.name,
      wallet.ethAddress
    );
    if (!nftAmountsAndMetadata) {
      return;
    }

    dispatch(
      updateNFTBalancesNetwork({
        networkName: network.name,
        walletID: wallet.id,
        nftAmounts: nftAmountsAndMetadata.map(({ nftAmount }) => nftAmount),
      })
    );

    dispatch(addNFTsMetadata(nftAmountsAndMetadata));
  } catch (err) {
    logDevError(err);
  }
};

export const pullWalletBalancesNetwork = async (
  dispatch: AppDispatch,
  wallet: Optional<FrontendWallet>,
  network: Network
) => {
  if (!wallet) {
    return;
  }
  if (wallet.isViewOnlyWallet) {
    return;
  }
  const networkName = network.name;
  if (pullingBalancesForNetwork[networkName] === true) {
    return;
  }
  pullingBalancesForNetwork[networkName] = true;

  await pullERC20BalancesNetwork(dispatch, wallet, network);

  pullingBalancesForNetwork[networkName] = false;
};

export const pullWalletNFTsNetwork = async (
  dispatch: AppDispatch,
  wallet: Optional<FrontendWallet>,
  network: Network
) => {
  if (!wallet) {
    return;
  }
  if (wallet.isViewOnlyWallet) {
    return;
  }
  const networkName = network.name;
  if (pullingNFTsForNetwork[networkName] === true) {
    return;
  }
  pullingNFTsForNetwork[networkName] = true;

  await pullNFTBalancesNetwork(dispatch, wallet, network);

  pullingNFTsForNetwork[networkName] = false;
};

export const updateWalletBalancesRailgun = async (
  dispatch: AppDispatch,
  chain: Chain,
  railWalletID: string,
  erc20BalancesRailgunMap: RailgunERC20AmountMap,
  nftAmountsMap: RailgunNFTAmountsMap
) => {
  const { network, wallets } = store.getState();
  if (!compareChains(chain, network.current.chain)) {
    return;
  }

  const filteredWallets = walletsForRailgunWalletID(wallets, railWalletID);
  if (!filteredWallets.length) {
    return;
  }

  const networkName = network.current.name;
  const walletTokens = getUniqueTokensForWalletsAndNetwork(
    filteredWallets,
    networkName
  );

  const formattedBalanceMap: RailgunERC20BalanceMap = {};

  const txidVersions = Object.keys(erc20BalancesRailgunMap) as TXIDVersion[];
  for (const txidVersion of txidVersions) {
    const txidBalanceBucketBuckets = erc20BalancesRailgunMap[txidVersion];
    if (!txidBalanceBucketBuckets) continue;

    const balanceBuckets = Object.keys(
      txidBalanceBucketBuckets
    ) as RailgunWalletBalanceBucket[];
    for (const balanceBucket of balanceBuckets) {
      const erc20Amounts = txidBalanceBucketBuckets[balanceBucket];
      if (!isDefined(erc20Amounts)) continue;

      const erc20AmountsFiltered = erc20Amounts;
      const tokenBalances: ERC20Balance[] = walletTokens.map((token) => {
        if (token.isBaseToken ?? false) {
          return zeroRailShieldedBalance(token);
        }

        const erc20AmountsIndex = erc20AmountsFiltered.findIndex(
          (shieldedBalance) => {
            return compareTokenAddress(
              shieldedBalance.tokenAddress,
              token.address
            );
          }
        );

        if (erc20AmountsIndex >= 0) {
          const railShieldedBalance = {
            isBaseToken: false,
            tokenAddress: erc20AmountsFiltered[erc20AmountsIndex].tokenAddress,
            balanceString:
              erc20AmountsFiltered[erc20AmountsIndex].amount.toString(),
          };

          erc20AmountsFiltered.splice(erc20AmountsIndex, 1);

          return railShieldedBalance;
        }

        return zeroRailShieldedBalance(token);
      });
      if (
        balanceBucket === RailgunWalletBalanceBucket.Spendable &&
        erc20AmountsFiltered.length > 0
      ) {
        const omittedPrivateTokensService = new OmittedPrivateTokensService(
          dispatch
        );

        const omittedPrivateTokens =
          await omittedPrivateTokensService.getOmittedPrivateTokensFromRailgunERC20Amounts(
            erc20AmountsFiltered,
            wallets.available,
            network
          );

        await omittedPrivateTokensService.handleFoundOmittedPrivateTokens(
          omittedPrivateTokens
        );
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

  dispatch(
    updateERC20BalancesRailgun({
      networkName,
      walletID: railWalletID,
      newBalanceBucketMap: formattedBalanceMap,
    })
  );

  if (ReactConfig.ENABLE_NFTS) {
    dispatch(
      updateNFTBalancesRailgun({
        networkName,
        walletID: railWalletID,
        newTXIDBalanceBucketNFTAmountsMap: nftAmountsMap,
      })
    );

    const newNFTsAndMetadata = await getNewNFTsAndMetadataFromRailgunNFTs(
      networkName,
      nftAmountsMap
    );
    if (!newNFTsAndMetadata) {
      return;
    }

    dispatch(addNFTsMetadata(newNFTsAndMetadata));
  }
};

const getNewNFTsAndMetadataFromRailgunNFTs = async (
  networkName: NetworkName,
  nftAmountsMap: RailgunNFTAmountsMap
): Promise<Optional<NFTAmountAndMetadata[]>> => {
  let nftAmounts: NFTAmount[] = [];

  const txidVersions = Object.keys(nftAmountsMap) as TXIDVersion[];
  for (const txidVersion of txidVersions) {
    const txidBalanceBucketBuckets = nftAmountsMap[txidVersion];
    if (!txidBalanceBucketBuckets) continue;

    const balanceBuckets = Object.keys(
      txidBalanceBucketBuckets
    ) as RailgunWalletBalanceBucket[];
    for (const balanceBucket of balanceBuckets) {
      const addNFTAmounts = txidBalanceBucketBuckets[balanceBucket];
      if (!addNFTAmounts) continue;
      nftAmounts = [...nftAmounts, ...addNFTAmounts];
    }
  }

  const existingNFTMetadata = store.getState().nftsMetadata;

  const newNFTs = nftAmounts.filter((nftAmount) => {
    const existingMetadataForNFT =
      existingNFTMetadata.forNFT[nftAmount.nftAddress];
    return (
      !isDefined(existingMetadataForNFT) ||
      !isDefined(existingMetadataForNFT.forSubID[nftAmount.tokenSubID])
    );
  });

  if (!newNFTs.length) {
    return [];
  }

  const refreshCache = false;

  return getNFTsAndMetadata(networkName, newNFTs, refreshCache);
};

const refreshNFTsMetadata = async (
  dispatch: AppDispatch,
  networkName: NetworkName,
  nftAmounts: NFTAmount[]
): Promise<void> => {
  const refreshCache = true;
  const nftAmountsAndMetadata = await getNFTsAndMetadata(
    networkName,
    nftAmounts,
    refreshCache
  );
  if (!nftAmountsAndMetadata) {
    return;
  }

  dispatch(addNFTsMetadata(nftAmountsAndMetadata));
};

export const refreshNFTsMetadataAfterShieldUnshield = async (
  dispatch: AppDispatch,
  networkName: NetworkName,
  nftAmounts: NFTAmount[]
): Promise<void> => {
  if (!shouldRefreshNFTMetadataAfterShieldUnshield(networkName, nftAmounts)) {
    return;
  }
  await refreshNFTsMetadata(dispatch, networkName, nftAmounts);
};

const shouldRefreshNFTMetadataAfterShieldUnshield = (
  networkName: NetworkName,
  nftAmounts: NFTAmount[]
) => {
  if (
    networkName === NetworkName.Ethereum &&
    nftAmounts
      .map((nftAmount) => nftAmount.nftAddress.toLowerCase())
      .includes(SharedConstants.RAILGUN_CAT_COLLECTION_NFT_ADDRESS_LOWERCASE)
  ) {
    return true;
  }
  return false;
};

export const resetBalancesTestOnly = (dispatch: AppDispatch) => {
  dispatch(resetERC20BalancesRailgun());
  dispatch(resetERC20BalancesNetwork());
  dispatch(resetNFTBalancesRailgun());
  dispatch(resetNFTBalancesNetwork());
};

export const loadBalancesFromCache = async (dispatch: AppDispatch) => {
  const [
    erc20BalancesNetworkString,
    erc20BalancesRailgunString,
    nftBalancesNetworkString,
    nftBalancesRailgunString,
  ] = await Promise.all([
    StorageService.getItem(SharedConstants.CACHED_BALANCES),
    StorageService.getItem(SharedConstants.CACHED_BALANCES + "_RAILGUN"),
    StorageService.getItem(SharedConstants.CACHED_NFT_BALANCES),
    StorageService.getItem(SharedConstants.CACHED_NFT_BALANCES + "_RAILGUN"),
  ]);

  if (isDefined(erc20BalancesNetworkString)) {
    const erc20Balances = JSON.parse(
      erc20BalancesNetworkString
    ) as CachedERC20Balance;
    dispatch(updateERC20BalancesNetwork(erc20Balances));
  }

  if (isDefined(erc20BalancesRailgunString)) {
    const erc20Balances = JSON.parse(
      erc20BalancesRailgunString
    ) as RailgunCachedERC20Balance;

    const payload: UpdateRailgunTokenBalancesPayload = {
      networkName: erc20Balances.networkName,
      walletID: erc20Balances.walletID,
      newBalanceBucketMap: erc20Balances.updatedTokenBalancesMap,
    };

    dispatch(updateERC20BalancesRailgun(payload));
  }

  if (isDefined(nftBalancesNetworkString)) {
    const nftBalance = JSON.parse(nftBalancesNetworkString) as CachedNFTBalance;
    const nftBalancePayload =
      getNFTBalancesPayloadFromCachedBalance(nftBalance);
    dispatch(updateNFTBalancesNetwork(nftBalancePayload));
  }

  if (isDefined(nftBalancesRailgunString)) {
    const nftBalance = JSON.parse(
      nftBalancesRailgunString
    ) as RailgunCachedNFTAmounts;

    const payload: UpdateRailgunNFTBalancesPayload = {
      networkName: nftBalance.networkName,
      walletID: nftBalance.walletID,
      newTXIDBalanceBucketNFTAmountsMap: nftBalance.nftAmountsMap,
    };

    dispatch(updateNFTBalancesRailgun(payload));
  }
};

const getNFTBalancesPayloadFromCachedBalance = (
  cachedBalance: CachedNFTBalance
): UpdateNFTBalancesPayload => {
  return {
    networkName: cachedBalance.networkName,
    walletID: cachedBalance.walletID,
    nftAmounts: cachedBalance.nftAmounts,
  };
};

const getDecimalBalanceCurrencyFromMaps = (
  token: ERC20Token,
  tokenBalances: ERC20BalancesSerialized,
  tokenPrices: TokenPrices
): number => {
  if (!isDefined(tokenBalances) || !isDefined(tokenPrices)) {
    return 0;
  }
  const tokenAddressBalances = tokenAddressForBalances(
    token.address,
    token.isBaseToken
  );
  const tokenBalance = tokenBalances[tokenAddressBalances];

  const tokenAddressPrices = tokenAddressForPrices(token);
  const tokenPrice = tokenPrices[tokenAddressPrices];

  if (!isDefined(tokenBalance) || !isDefined(tokenPrice)) {
    return 0;
  }

  const balance = BigInt(tokenBalance);
  return getDecimalBalanceCurrency(balance, tokenPrice, token.decimals);
};

export const getTotalBalanceCurrency = (
  tokens: ERC20Token[],
  tokenBalances: ERC20BalancesSerialized,
  tokenPrices: TokenPrices
): number => {
  let totalBalance = 0;
  for (const token of tokens) {
    const totalDecimal = getDecimalBalanceCurrencyFromMaps(
      token,
      tokenBalances,
      tokenPrices
    );
    totalBalance += totalDecimal;
  }
  return totalBalance;
};

export const calculateTokenBalance = (
  wallet: Optional<FrontendWallet>,
  token: Optional<ERC20Token>,
  tokenBalancesSerialized: ERC20BalancesSerialized,
  isRailgun: boolean
): Optional<bigint> => {
  if (!wallet) {
    return 0n;
  }
  if (!token) {
    return undefined;
  }
  if (!isDefined(tokenBalancesSerialized)) {
    return undefined;
  }
  if (token.isBaseToken === true && isRailgun) {
    return 0n;
  }

  const tokenAddressBalances = tokenAddressForBalances(
    token.address,
    token.isBaseToken
  );
  const tokenBalanceSerialized = tokenBalancesSerialized[tokenAddressBalances];
  if (!isDefined(tokenBalanceSerialized)) {
    return undefined;
  }
  return BigInt(tokenBalanceSerialized);
};

export const createERC20TokenBalance = (
  wallet: Optional<FrontendWallet>,
  token: ERC20Token,
  tokenBalances: ERC20BalancesSerialized,
  tokenPrices: Optional<TokenPrices>,
  isRailgun: boolean
): ERC20TokenBalance => {
  const balance = calculateTokenBalance(
    wallet,
    token,
    tokenBalances,
    isRailgun
  );
  const balanceCurrency = calculateBalanceCurrency(token, balance, tokenPrices);
  const tokenAddressPrices = tokenAddressForPrices(token);
  const walletTokenBalance = {
    token,
    balance,
    balanceCurrency,
    priceCurrency: isDefined(tokenPrices)
      ? tokenPrices[tokenAddressPrices]
      : undefined,
  };
  return walletTokenBalance;
};

export const calculateBalanceCurrency = (
  token: ERC20Token,
  tokenBalance: Optional<bigint>,
  tokenPrices: Optional<TokenPrices>
): Optional<number> => {
  if (!isDefined(tokenBalance)) {
    return undefined;
  }
  if (!isDefined(tokenPrices)) {
    return undefined;
  }
  const tokenAddressPrices = tokenAddressForPrices(token);
  const tokenPrice = tokenPrices[tokenAddressPrices];
  if (!isDefined(tokenPrice)) {
    return undefined;
  }
  return getDecimalBalanceCurrency(tokenBalance, tokenPrice, token.decimals);
};

export const sortTokensByBalance = (
  walletTokenBalances: ERC20TokenBalance[]
): ERC20TokenBalance[] => {
  const sortedERC20TokenBalances = walletTokenBalances.sort((a, b) => {
    const aBalanceCurrency = a.balanceCurrency;
    const bBalanceCurrency = b.balanceCurrency;
    const aBalance = a.balance;
    const bBalance = b.balance;
    const aHasBalance = isDefined(a.balanceCurrency);
    const bHasBalance = isDefined(b.balanceCurrency);
    if (!aHasBalance && !bHasBalance) {
      return (aBalance ?? 0) > (bBalance ?? 0) ? -1 : 1;
    } else if (!aHasBalance) {
      return 1;
    } else if (!bHasBalance) {
      return -1;
    } else if (aHasBalance && bHasBalance) {
      if (aBalanceCurrency === bBalanceCurrency) {
        return (aBalance ?? 0) > (bBalance ?? 0) ? -1 : 1;
      }
      return (aBalanceCurrency ?? 0) > (bBalanceCurrency ?? 0) ? -1 : 1;
    }
    return 1;
  });

  return sortedERC20TokenBalances;
};

export const getTopTokenForWallet = (
  wallet: Optional<FrontendWallet>,
  networkName: NetworkName,
  networkWalletBalances: Optional<NetworkWalletBalances>,
  railgunWalletBalances: Optional<RailgunWalletBalances>,
  tokenPrices: Optional<TokenPrices>,
  skipTokens: ERC20Token[],
  isRailgun: boolean,
  txidVersion: TXIDVersion,
  balanceBucketFilter: RailgunWalletBalanceBucket[]
): Optional<ERC20Token> => {
  if (!wallet) {
    return;
  }

  const tokenBalances = tokenBalancesForWalletAndState(
    wallet,
    networkWalletBalances,
    railgunWalletBalances,
    isRailgun,
    txidVersion,
    balanceBucketFilter
  );
  const tokens = wallet.addedTokens[networkName] ?? [];
  const walletTokenBalances: ERC20TokenBalance[] = [];

  for (const token of tokens) {
    const foundToken = tokenFoundInList(token, skipTokens);
    if (foundToken) {
      continue;
    }
    if (isRailgun && (token.isBaseToken ?? false)) {
      continue;
    }
    walletTokenBalances.push(
      createERC20TokenBalance(
        wallet,
        token,
        tokenBalances,
        tokenPrices,
        isRailgun
      )
    );
  }

  const sortedERC20TokenBalances = sortTokensByBalance(walletTokenBalances);
  if (!sortedERC20TokenBalances.length) {
    return;
  }
  const tokenBalance = sortedERC20TokenBalances[0];
  return tokenBalance.token;
};

const hasBalances = (tokenBalances: ERC20BalancesSerialized) => {
  return Object.values(tokenBalances).some((balance) => {
    return isDefined(balance) && BigInt(balance) > 0;
  });
};

const hasBalancesNetwork = (
  networkWalletBalanceState: NetworkWalletBalanceState,
  networkName: NetworkName
) => {
  const networkWalletBalances =
    networkWalletBalanceState.forNetwork[networkName];

  if (
    !isDefined(networkWalletBalances) ||
    !isDefined(networkWalletBalances.forWallet)
  ) {
    return false;
  }

  let foundBalances = false;

  for (const tokenBalances of Object.values(networkWalletBalances.forWallet)) {
    if (!isDefined(tokenBalances)) {
      continue;
    }

    if (hasBalances(tokenBalances)) {
      foundBalances = true;
      break;
    }
  }

  return foundBalances;
};

const hasBalancesRailgun = (
  networkWalletBalanceState: RailgunWalletBalanceState,
  networkName: NetworkName,
  txidVersion: TXIDVersion,
  balanceBucketFilter: RailgunWalletBalanceBucket[]
) => {
  const networkWalletBalances =
    networkWalletBalanceState.forNetwork[networkName];

  if (
    !isDefined(networkWalletBalances) ||
    !isDefined(networkWalletBalances.forWallet)
  ) {
    return false;
  }

  let foundBalances = false;

  for (const tokenBalancesMap of Object.values(
    networkWalletBalances.forWallet
  )) {
    if (!isDefined(tokenBalancesMap)) {
      continue;
    }

    const tokenBalances = getRailgunBalancesFromTXIDBalanceMap(
      tokenBalancesMap,
      txidVersion,
      balanceBucketFilter
    );

    if (hasBalances(tokenBalances)) {
      foundBalances = true;
      break;
    }
  }

  return foundBalances;
};

const hasBalancesForNetwork = (networkName: NetworkName) => {
  const { erc20BalancesNetwork } = store.getState();
  return hasBalancesNetwork(erc20BalancesNetwork, networkName);
};

const hasBalancesForRailgun = (
  networkName: NetworkName,
  txidVersion: TXIDVersion,
  balanceBucketFilter: RailgunWalletBalanceBucket[]
) => {
  const { erc20BalancesRailgun } = store.getState();
  return hasBalancesRailgun(
    erc20BalancesRailgun,
    networkName,
    txidVersion,
    balanceBucketFilter
  );
};

export const hasBalancesForNetworkOrRailgun = (
  networkName: NetworkName,
  txidVersion: TXIDVersion,
  balanceBucketFilter: RailgunWalletBalanceBucket[]
): boolean => {
  return (
    hasBalancesForNetwork(networkName) ||
    hasBalancesForRailgun(networkName, txidVersion, balanceBucketFilter)
  );
};

export const tokenBalancesForWalletAndState = (
  wallet: Optional<FrontendWallet>,
  networkWalletBalances: Optional<NetworkWalletBalances>,
  railgunWalletBalances: Optional<RailgunWalletBalances>,
  isRailgun: boolean,
  txidVersion: TXIDVersion,
  balanceBucketFilter: RailgunWalletBalanceBucket[]
): ERC20BalancesSerialized => {
  if (isRailgun) {
    return tokenBalancesForWalletAndStateRailgun(
      wallet,
      railgunWalletBalances,
      txidVersion,
      balanceBucketFilter
    );
  } else {
    return tokenBalancesForWalletAndStateNetwork(wallet, networkWalletBalances);
  }
};

const tokenBalancesForWalletAndStateNetwork = (
  wallet: Optional<FrontendWallet>,
  networkWalletBalances: Optional<NetworkWalletBalances>
): ERC20BalancesSerialized => {
  let tokenBalances: Optional<ERC20BalancesSerialized>;
  if (isDefined(wallet)) {
    tokenBalances = networkWalletBalances?.forWallet?.[wallet.id];
  }
  return tokenBalances ?? {};
};

const tokenBalancesForWalletAndStateRailgun = (
  wallet: Optional<FrontendWallet>,
  railgunWalletBalances: Optional<RailgunWalletBalances>,
  txidVersion: TXIDVersion,
  balanceBucketFilter: RailgunWalletBalanceBucket[]
): ERC20BalancesSerialized => {
  let tokenBalances: Optional<ERC20BalancesSerialized>;
  if (isDefined(wallet)) {
    const tokenBalancesMap =
      railgunWalletBalances?.forWallet?.[wallet.railWalletID];

    if (isDefined(tokenBalancesMap)) {
      tokenBalances = getRailgunBalancesFromTXIDBalanceMap(
        tokenBalancesMap,
        txidVersion,
        balanceBucketFilter
      );
    }
  }
  return tokenBalances ?? {};
};

export const getRailgunBalancesFromTXIDBalanceMap = (
  balanceMap: RailgunTXIDBalanceMap,
  txidVersion: TXIDVersion,
  balanceBucketFilter: RailgunWalletBalanceBucket[]
): ERC20BalancesSerialized => {
  let tokenBalances: ERC20BalancesSerialized = {};

  const txidBalanceBucketBuckets = balanceMap[txidVersion];
  for (const balanceBucket of balanceBucketFilter) {
    const erc20Amounts = txidBalanceBucketBuckets[balanceBucket];

    const arrayOfTokenAddresses = Object.keys(tokenBalances);
    if (arrayOfTokenAddresses.length === 0) {
      tokenBalances = {
        ...erc20Amounts,
      };
    } else {
      arrayOfTokenAddresses.forEach((tokenAddress) => {
        const existingBalance = tokenBalances[tokenAddress];
        const newBalance = erc20Amounts?.[tokenAddress];

        if (!isDefined(newBalance)) {
          return;
        }

        if (!isDefined(existingBalance)) {
          tokenBalances[tokenAddress] = newBalance;
          return;
        }

        tokenBalances[tokenAddress] = (
          BigInt(existingBalance) + BigInt(newBalance)
        ).toString();
      });
    }
  }

  return tokenBalances;
};

export const getRailgunNFTAmountsFromTXIDBalanceMap = (
  nftAmountsMap: RailgunTXIDVersionNFTAmountMap,
  txidVersion: TXIDVersion,
  balanceBucketFilter: RailgunWalletBalanceBucket[]
): NFTAmount[] => {
  let nftAmounts: NFTAmount[] = [];

  const txidNFTAmountsStatusBuckets = nftAmountsMap[txidVersion];
  for (const balanceBucket of balanceBucketFilter) {
    const addNFTAmounts = txidNFTAmountsStatusBuckets[balanceBucket];
    if (!addNFTAmounts) continue;
    nftAmounts = [...nftAmounts, ...addNFTAmounts];
  }

  return nftAmounts;
};
