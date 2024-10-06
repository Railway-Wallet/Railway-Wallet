import {
  isDefined,
  Network,
  NetworkName,
} from "@railgun-community/shared-models";
import { AvailableWallet } from "../../models";
import {
  ERC20TokenAddressOnly,
  ERC20TokenFullInfo,
  SearchableERC20,
  TokenIconKey,
} from "../../models/token";
import { WalletsState } from "../../redux-store";
import { logDevError } from "../../utils/logging";
import { compareTokens, findMatchingAddedToken } from "../../utils/tokens";
import { getCoingeckoTokenDetails } from "../api/coingecko/coingecko-token";
import { getERC20Decimals } from "./erc20";
import ArbCoins from "./exports/arb_coins.json";
import ArbGoerliCoins from "./exports/arb_goerli_coins.json";
import BSCCoins from "./exports/bsc_coins.json";
import EthereumCoins from "./exports/ethereum_coins.json";
import GoerliCoins from "./exports/goerli_coins.json";
import PolygonCoins from "./exports/polygon_coins.json";
import rebaseTokenList from "./exports/rebase_token_address_list.json";
import RopstenCoins from "./exports/ropsten_coins.json";

export const loadSearchableERC20s = (
  networkName: NetworkName
): SearchableERC20[] => {
  let coinsArr: SearchableERC20[];

  switch (networkName) {
    case NetworkName.Ethereum:
      coinsArr = EthereumCoins;
      break;
    case NetworkName.EthereumRopsten_DEPRECATED:
      coinsArr = RopstenCoins;
      break;
    case NetworkName.EthereumGoerli_DEPRECATED:
      coinsArr = GoerliCoins;
      break;
    case NetworkName.EthereumSepolia:
      coinsArr = [];
      break;
    case NetworkName.BNBChain:
      coinsArr = BSCCoins;
      break;
    case NetworkName.PolygonAmoy:
    case NetworkName.Polygon:
      coinsArr = PolygonCoins;
      break;
    case NetworkName.Arbitrum:
      coinsArr = ArbCoins;
      break;
    case NetworkName.PolygonMumbai_DEPRECATED:
      coinsArr = [];
      break;
    case NetworkName.ArbitrumGoerli_DEPRECATED:
      coinsArr = ArbGoerliCoins;
      break;
    case NetworkName.Hardhat:
      coinsArr = [];
      break;
  }

  return coinsArr;
};

export const searchableERC20s = (
  query: string,
  networkName: NetworkName
): SearchableERC20[] => {
  const coinsArray = loadSearchableERC20s(networkName);
  const queryFormatted = query.toLowerCase();

  const matchedCoins = [];
  for (const coin of coinsArray) {
    if (coin.searchStr.includes(queryFormatted)) {
      const isExactSymbolMatch = coin.symbol.toLowerCase() === queryFormatted;
      isExactSymbolMatch ? matchedCoins.unshift(coin) : matchedCoins.push(coin);
      if (matchedCoins.length === 20) {
        break;
      }
    }
  }
  return matchedCoins;
};

export const isRebaseToken = (address: string) => {
  return rebaseTokenList.includes(address);
};

export const getERC20TokenDetails = async (
  contractAddress: string,
  network: Network
): Promise<SearchableERC20> => {
  const address = contractAddress.toLocaleLowerCase();
  const decimals = Number(await getERC20Decimals(network.name, address));

  let name = "";
  let symbol = "";
  let logoURI;

  try {
    const tokenData = await getCoingeckoTokenDetails(network, address);
    name = tokenData.name;
    symbol = tokenData.symbol.toUpperCase();
    logoURI = tokenData.image.small;
  } catch (error) {
    logDevError(error);
  }

  const searchableERC20: SearchableERC20 = {
    searchStr: "",
    address,
    name,
    symbol,
    logoURI,
    decimals,
  };
  return searchableERC20;
};

export const validateCustomTokenFields = (
  contractAddress: string,
  foundToken: Optional<SearchableERC20>,
  hasValidTokenContract: boolean,
  name: string,
  symbol: string,
  decimals: string,
  icon: Optional<TokenIconKey>,
  logoURI: Optional<string>
): Optional<SearchableERC20> => {
  const address = contractAddress.toLowerCase();
  if (isRebaseToken(address)) {
    throw new Error("You may not shield rebase tokens into RAILGUN.");
  }

  if (isDefined(foundToken)) {
    return foundToken;
  }

  if (!hasValidTokenContract) {
    throw new Error("Token contract is invalid.");
  }
  if (name === "" || symbol === "") {
    throw new Error("Please complete all fields.");
  }
  if (decimals === "" || isNaN(Number(decimals))) {
    throw new Error("Token contract is invalid for this network.");
  }

  const searchableERC20: SearchableERC20 = {
    address,
    name,
    symbol,
    decimals: Number(decimals),
    searchStr: `${name.toLowerCase()}|${symbol.toLocaleLowerCase()}`,
    icon,
    logoURI,
  };
  return searchableERC20;
};

export const getFullERC20TokenInfo = async (
  token: ERC20TokenAddressOnly,
  availableWallets: Optional<AvailableWallet[]>,
  network: Network
) => {
  const walletMatch = findMatchingAddedToken(
    token,
    availableWallets,
    network.name
  );
  if (walletMatch) {
    const searchableERC20: SearchableERC20 = {
      ...walletMatch,
      searchStr: `${walletMatch.name.toLowerCase()}|${walletMatch.symbol.toLocaleLowerCase()}`,
    };
    return searchableERC20;
  }

  const localListMatches = searchableERC20s(token.address, network.name);
  if (localListMatches.length > 0) {
    return localListMatches[0];
  }

  const apiTokenInfo = await getERC20TokenDetails(token.address, network);
  return apiTokenInfo;
};

export const getAddedTokensFromAllWallets = (
  availableWallets: AvailableWallet[],
  networkName: NetworkName
) => {
  const addedTokensFromAllWallets = [];

  for (const wallet of availableWallets) {
    const addedTokens: ERC20TokenFullInfo[] =
      wallet.addedTokens[networkName] ?? [];

    for (const token of addedTokens) {
      const alreadyAddedToken = addedTokensFromAllWallets.find(
        (t) => t.address === token.address
      );
      if (!isDefined(alreadyAddedToken)) {
        addedTokensFromAllWallets.push(token);
      }
    }
  }

  return addedTokensFromAllWallets;
};

export const getAddedTokensFromNotActiveWallets = (
  wallets: WalletsState,
  networkName: NetworkName
): SearchableERC20[] => {
  const alreadyAddedTokens = getAddedTokensFromAllWallets(
    wallets.available,
    networkName
  );

  const tokensNotAddedInActiveWallet = alreadyAddedTokens.filter(
    (token) =>
      !isDefined(
        wallets.active?.addedTokens[networkName]?.find((t) =>
          compareTokens(t, token)
        )
      )
  );

  const searchableTokens = tokensNotAddedInActiveWallet.map((token) => {
    const searchableERC20: SearchableERC20 = {
      ...token,
      searchStr: `${token.name.toLowerCase()}|${token.symbol.toLocaleLowerCase()}`,
    };

    return searchableERC20;
  });

  return searchableTokens;
};
