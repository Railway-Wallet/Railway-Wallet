import {
  RecipeERC20Amount,
  RecipeERC20Info,
  RecipeOutput,
} from "@railgun-community/cookbook";
import {
  isDefined,
  Network,
  NetworkName,
  NFTAmount,
  NFTAmountRecipient,
  RailgunERC20Amount,
  RailgunERC20AmountRecipient,
  RailgunNFTAmount,
  RailgunNFTAmountRecipient,
  RailgunWalletBalanceBucket,
  removeUndefineds,
  SelectedBroadcaster,
} from "@railgun-community/shared-models";
import { parseUnits } from "ethers";
import {
  ImageRecipeTokenBeefy,
  ImageRecipeTokenPancakeSwap,
  ImageRecipeTokenQuickswap,
  ImageRecipeTokenSushiswap,
  ImageRecipeTokenUniswap,
  ImageTokenBnb,
  ImageTokenBusd,
  ImageTokenDai,
  ImageTokenEth,
  ImageTokenMatic,
  ImageTokenPlaceholder,
  ImageTokenRail,
  ImageTokenUsdc,
  ImageTokenUSDCe,
  ImageTokenUsdt,
  ImageTokenWbnb,
  ImageTokenWbtc,
  ImageTokenWeth,
  ImageTokenWmatic,
} from "../images/images";
import { DEFAULT_WALLET_TOKENS_FOR_NETWORK } from "../models/default-tokens";
import {
  ToastAction,
  ToastActionData,
  ToastActionScreen,
  ToastActionStack,
} from "../models/toast";
import {
  BASE_TOKEN_ADDRESS,
  ERC20Amount,
  ERC20AmountRecipient,
  ERC20AmountRecipientGroup,
  ERC20Balance,
  ERC20BalancesSerialized,
  ERC20Token,
  ERC20TokenAddressOnly,
  ERC20TokenFullInfo,
  RecipeFinalERC20Amounts,
  SearchableERC20,
  TokenIconKey,
} from "../models/token";
import { AvailableWallet, FrontendWallet } from "../models/wallet";
import { shortenWalletAddress } from "./util";

export const getDistinctERC20Tokens = (tokens: ERC20Token[]): ERC20Token[] =>
  tokens.filter(
    (token, index, self) =>
      self.findIndex((t) => compareTokens(t, token)) === index
  );

export const tokenFoundInList = (
  token: ERC20Token,
  list: ERC20Token[]
): boolean => {
  const foundToken = list.find((t) => compareTokens(t, token));
  return isDefined(foundToken);
};

export const compareTokens = (
  tokenA: ERC20Token | SearchableERC20,
  tokenB?: ERC20Token | SearchableERC20
) => {
  return (
    (tokenA.isBaseToken ?? false) === (tokenB?.isBaseToken ?? false) &&
    compareTokenAddress(tokenA.address, tokenB?.address)
  );
};

export const compareNFTs = (nftA: NFTAmount, nftB: Optional<NFTAmount>) => {
  return (
    nftA.nftAddress.toLowerCase() === nftB?.nftAddress.toLowerCase() &&
    nftA.nftTokenType === nftB?.nftTokenType &&
    nftA.tokenSubID === nftB?.tokenSubID
  );
};

export const compareNFTAmounts = (
  nftAmountA: NFTAmount,
  nftAmountB: Optional<NFTAmount>
) => {
  return (
    nftAmountB &&
    compareNFTs(nftAmountA, nftAmountB) &&
    BigInt(nftAmountA.amountString) === BigInt(nftAmountB.amountString)
  );
};

export const compareNFTAmountArrays = (
  a: Optional<NFTAmount[]>,
  b: Optional<NFTAmount[]>
) => {
  if (!a && !b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (const aNftAmount of a) {
    const found = b.find((bNftAmount) => compareNFTs(bNftAmount, aNftAmount));
    if (!found) {
      return false;
    }
    if (BigInt(found.amountString) !== BigInt(aNftAmount.amountString)) {
      return false;
    }
  }
  return true;
};

export const compareERC20Amounts = (
  a: Optional<ERC20Amount>,
  b: Optional<ERC20Amount>
) => {
  if (!a && !b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return compareTokens(a.token, b.token) && a.amountString === b.amountString;
};

export const compareERC20AmountArrays = (
  a: Optional<ERC20Amount[]>,
  b: Optional<ERC20Amount[]>
) => {
  if (!a && !b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (const erc20Amount of a) {
    const found = b.find((ta) => compareTokens(ta.token, erc20Amount.token));
    if (!found) {
      return false;
    }
    if (found.amountString !== erc20Amount.amountString) {
      return false;
    }
  }
  return true;
};

export const compareERC20AmountRecipientArrays = (
  a: Optional<ERC20AmountRecipient[]>,
  b: Optional<ERC20AmountRecipient[]>
) => {
  if (!a && !b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (const erc20Amount of a) {
    const found = b.find((ta) => compareTokens(ta.token, erc20Amount.token));
    if (!found) {
      return false;
    }
    if (BigInt(found.amountString) !== BigInt(erc20Amount.amountString)) {
      return false;
    }
    if (found.recipientAddress !== erc20Amount.recipientAddress) {
      return false;
    }
  }
  return true;
};

export const findMatchingAddedToken = (
  tokenAddressOnly: ERC20TokenAddressOnly,
  availableWallets: Optional<AvailableWallet[]>,
  networkName: NetworkName
): Optional<ERC20TokenFullInfo> => {
  if (!isDefined(availableWallets)) {
    return undefined;
  }

  const addedTokensFromAllWallets: {
    [tokenAddress: string]: ERC20TokenFullInfo;
  } = {};

  for (const wallet of availableWallets) {
    const addedTokens: ERC20TokenFullInfo[] =
      wallet.addedTokens[networkName] ?? [];

    for (const token of addedTokens) {
      if (!isDefined(addedTokensFromAllWallets[token.address])) {
        addedTokensFromAllWallets[token.address] = token;
      }
    }
  }

  return addedTokensFromAllWallets[tokenAddressOnly.address];
};

export const findMatchingAddedTokenForWallet = (
  tokenAddressOnly: ERC20TokenAddressOnly,
  wallet: Optional<FrontendWallet>,
  networkName: NetworkName
): Optional<ERC20TokenFullInfo> => {
  return wallet?.addedTokens[networkName]?.find((t) =>
    compareTokens(t, tokenAddressOnly)
  );
};

export const compareTokenAddress = (addressA: string, addressB?: string) => {
  return addressA.toUpperCase() === addressB?.toUpperCase();
};

export const tokenAddressForBalances = (
  tokenAddress: string,
  isBaseToken: Optional<boolean>
) => {
  return isBaseToken ?? false ? BASE_TOKEN_ADDRESS : tokenAddress.toLowerCase();
};

export const getTokenBalanceSerialized = (
  token: ERC20Token,
  balances: ERC20BalancesSerialized
): string => {
  const tokenAddressBalances = tokenAddressForBalances(
    token.address,
    token.isBaseToken
  );
  return balances[tokenAddressBalances] ?? "0";
};

export const tokenAddressForPrices = (token: ERC20Token) => {
  return token.address.toLowerCase();
};

export const getRecipeERC20Info = (token: ERC20Token): RecipeERC20Info => {
  return {
    tokenAddress: token.address,
    decimals: BigInt(token.decimals),
    isBaseToken: token.isBaseToken,
  };
};

export const getRecipeERC20Amount = (
  erc20Amount: ERC20Amount
): RecipeERC20Amount => {
  return {
    ...getRecipeERC20Info(erc20Amount.token),
    amount: BigInt(erc20Amount.amountString),
  };
};

export const createERC20AmountFromRecipeERC20Amount = (
  wallet: Optional<FrontendWallet>,
  networkName: NetworkName,
  recipeERC20Amount: RecipeERC20Amount
): ERC20Amount => {
  return {
    token: createERC20TokenFromRecipeERC20Info(
      wallet,
      networkName,
      recipeERC20Amount
    ),
    amountString: recipeERC20Amount.amount.toString(),
  };
};

export const compareRecipeERC20Info = (
  a: Optional<RecipeERC20Info>,
  b: Optional<RecipeERC20Info>
) => {
  if (!a && !b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return (
    a.tokenAddress.toLowerCase() === b.tokenAddress.toLowerCase() &&
    (a.isBaseToken ?? false) === (b.isBaseToken ?? false)
  );
};

export const createERC20TokenFromRecipeERC20Info = (
  wallet: Optional<FrontendWallet>,
  networkName: NetworkName,
  erc20Info: RecipeERC20Info
): ERC20Token => {
  const foundToken = wallet?.addedTokens[networkName]?.find(
    (token) =>
      compareTokenAddress(token.address, erc20Info.tokenAddress) &&
      (token.isBaseToken ?? false) === (erc20Info.isBaseToken ?? false)
  );
  if (isDefined(foundToken)) {
    return foundToken;
  }
  const token: ERC20TokenAddressOnly = {
    isAddressOnly: true,
    isBaseToken: erc20Info.isBaseToken,
    decimals: Number(erc20Info.decimals),
    address: erc20Info.tokenAddress,
  };
  return token;
};

export const compareRecipeERC20Amount = (
  a: RecipeERC20Amount,
  b: RecipeERC20Amount
) => {
  return compareRecipeERC20Info(a, b) && a.amount === b.amount;
};

export const filterTokensBySearchField = (
  tokens: ERC20Token[],
  search: Optional<string>
) => {
  return tokens.filter((token) => {
    return (
      !isDefined(search) ||
      token.address.toLowerCase().includes(search) ||
      (!(token.isAddressOnly ?? false) &&
        token.name.toLowerCase().includes(search)) ||
      (!(token.isAddressOnly ?? false) &&
        token.symbol.toLowerCase().includes(search))
    );
  });
};

export const tokenMatchesSearchField = (
  token: ERC20Token,
  search: Optional<string>
) => {
  return filterTokensBySearchField([token], search).length > 0;
};

export const getTokenDisplayName = (
  token: ERC20Token,
  availableWallets: Optional<AvailableWallet[]>,
  networkName: NetworkName
) => {
  if (token.isAddressOnly !== true) {
    return token.symbol;
  }
  const addedToken = findMatchingAddedToken(
    token,
    availableWallets,
    networkName
  );
  if (addedToken) {
    return addedToken.symbol;
  }
  return token.address;
};

export const getTokenDisplayNameShort = (
  token: ERC20Token,
  availableWallets: Optional<AvailableWallet[]>,
  networkName: NetworkName
) => {
  if (token.isAddressOnly !== true) {
    return token.symbol;
  }
  const addedToken = findMatchingAddedToken(
    token,
    availableWallets,
    networkName
  );
  if (addedToken) {
    return addedToken.symbol;
  }
  return shortenWalletAddress(token.address);
};

export const getTokenDisplayHeader = (
  token: ERC20Token,
  availableWallets: Optional<AvailableWallet[]>,
  networkName: NetworkName
) => {
  if (token.isAddressOnly !== true) {
    return token.name;
  }
  const addedToken = findMatchingAddedToken(
    token,
    availableWallets,
    networkName
  );
  if (addedToken) {
    return addedToken.name;
  }
  return "Unknown token";
};

export const hasOnlyBaseToken = (
  tokenAmounts: (ERC20Amount | ERC20Amount)[]
): boolean => {
  return (
    tokenAmounts.length === 1 && tokenAmounts[0].token.isBaseToken === true
  );
};

export const hasOnlyWrappedBaseToken = (
  tokenAmounts: (ERC20Amount | ERC20Amount)[],
  network: Network
): boolean => {
  return (
    tokenAmounts.length === 1 &&
    isWrappedBaseTokenForNetwork(tokenAmounts[0].token, network)
  );
};

export const isWrappedBaseTokenForNetwork = (
  token: ERC20Token,
  network: Network
) => {
  return (
    token.address === network.baseToken.wrappedAddress &&
    !(token.isBaseToken ?? false)
  );
};

export const hasBaseToken = (tokenAmounts: ERC20Amount[]): boolean => {
  return tokenAmounts.filter((ta) => ta.token.isBaseToken).length > 0;
};

export const hasWrappedBaseToken = (
  tokenAmounts: ERC20Amount[],
  network: Network
): boolean => {
  return (
    tokenAmounts.filter((ta) => isWrappedBaseTokenForNetwork(ta.token, network))
      .length > 0
  );
};

export const baseTokenForWallet = (
  networkName: NetworkName,
  wallet?: FrontendWallet
): Optional<ERC20Token> => {
  if (!wallet) {
    return;
  }
  const addedTokens = wallet.addedTokens[networkName];
  return addedTokens?.find((t) => t.isBaseToken);
};

export const zeroRailShieldedBalance = (token: ERC20Token): ERC20Balance => {
  return {
    isBaseToken: token.isBaseToken === true,
    tokenAddress: token.address,
    balanceString: "0",
  };
};

export const isValidTokenEntry = (
  numEntryString: string,
  token?: ERC20Token
) => {
  if (!token) {
    return false;
  }
  try {
    parseUnits(numEntryString, token.decimals);
    return true;
  } catch (err) {
    return false;
  }
};

export const validERC20Amount = (
  numEntryString: string,
  token?: ERC20Token
): Optional<ERC20Amount> => {
  if (!token) {
    return undefined;
  }
  try {
    const amount = parseUnits(numEntryString, token.decimals);
    return {
      token,
      amountString: amount.toString(),
    };
  } catch (err) {
    return undefined;
  }
};

export const createRailgunERC20Amount = (
  erc20Amount: Optional<ERC20Amount>
): Optional<RailgunERC20Amount> => {
  if (!erc20Amount) {
    return undefined;
  }
  return {
    tokenAddress: erc20Amount.token.address,
    amount: BigInt(erc20Amount.amountString),
  };
};

export const createRailgunERC20AmountRecipients = (
  erc20AmountRecipients: ERC20AmountRecipient[]
): RailgunERC20AmountRecipient[] => {
  return removeUndefineds(
    erc20AmountRecipients.map(createRailgunERC20AmountRecipient)
  );
};

export const createRailgunERC20AmountRecipient = (
  erc20AmountRecipient: Optional<ERC20AmountRecipient>
): Optional<RailgunERC20AmountRecipient> => {
  if (!erc20AmountRecipient) {
    return undefined;
  }
  return {
    tokenAddress: erc20AmountRecipient.token.address,
    amount: BigInt(erc20AmountRecipient.amountString),
    recipientAddress: erc20AmountRecipient.recipientAddress,
  };
};

export const createBroadcasterFeeERC20AmountRecipient = (
  selectedBroadcaster: Optional<SelectedBroadcaster>,
  broadcasterFeeERC20Amount: Optional<ERC20Amount>
): Optional<ERC20AmountRecipient> => {
  return selectedBroadcaster && broadcasterFeeERC20Amount
    ? {
        token: broadcasterFeeERC20Amount.token,
        amountString: broadcasterFeeERC20Amount.amountString,
        recipientAddress: selectedBroadcaster.railgunAddress,
        externalUnresolvedToWalletAddress: undefined,
      }
    : undefined;
};

export const createERC20TokenFromRailgunERC20Amount = (
  wallet: Optional<FrontendWallet>,
  networkName: NetworkName,
  erc20Amount: RailgunERC20Amount
): ERC20Token => {
  const foundToken = wallet?.addedTokens[networkName]?.find(
    (token) =>
      compareTokenAddress(token.address, erc20Amount.tokenAddress) &&
      (token.isBaseToken ?? false) === false
  );
  if (isDefined(foundToken)) {
    return foundToken;
  }
  throw new Error("Token not found in wallet balances - add to wallet first");
};

export const createSerializedERC20AmountRecipient = (
  wallet: Optional<FrontendWallet>,
  networkName: NetworkName,
  railgunERC20AmountRecipient: RailgunERC20AmountRecipient
): ERC20AmountRecipient => {
  return {
    token: createERC20TokenFromRailgunERC20Amount(
      wallet,
      networkName,
      railgunERC20AmountRecipient
    ),
    amountString: railgunERC20AmountRecipient.amount.toString(),
    recipientAddress: railgunERC20AmountRecipient.recipientAddress,
    externalUnresolvedToWalletAddress: undefined,
  };
};

export const createSerializedERC20AmountRecipients = (
  wallet: Optional<FrontendWallet>,
  networkName: NetworkName,
  railgunERC20AmountRecipients: RailgunERC20AmountRecipient[]
): ERC20AmountRecipient[] => {
  return railgunERC20AmountRecipients.map((erc20Amount) =>
    createSerializedERC20AmountRecipient(wallet, networkName, erc20Amount)
  );
};

export const createSerializedNFTAmount = (
  railgunNFTAmount: RailgunNFTAmount
): NFTAmount => {
  return {
    nftAddress: railgunNFTAmount.nftAddress,
    nftTokenType: railgunNFTAmount.nftTokenType,
    tokenSubID: railgunNFTAmount.tokenSubID,
    amountString: railgunNFTAmount.amount.toString(),
  };
};

export const createSerializedNFTAmounts = (
  railgunNFTAmounts: RailgunNFTAmount[]
): NFTAmount[] => {
  return railgunNFTAmounts.map(createSerializedNFTAmount);
};

export const createSerializedNFTAmountRecipient = (
  railgunNFTAmountRecipient: RailgunNFTAmountRecipient
): NFTAmountRecipient => {
  return {
    nftAddress: railgunNFTAmountRecipient.nftAddress,
    nftTokenType: railgunNFTAmountRecipient.nftTokenType,
    tokenSubID: railgunNFTAmountRecipient.tokenSubID,
    amountString: railgunNFTAmountRecipient.amount.toString(),
    recipientAddress: railgunNFTAmountRecipient.recipientAddress,
  };
};

export const createSerializedNFTAmountRecipients = (
  railgunNFTAmountRecipients: RailgunNFTAmountRecipient[]
): NFTAmountRecipient[] => {
  return railgunNFTAmountRecipients.map(createSerializedNFTAmountRecipient);
};

export const createRailgunNFTAmount = (
  nftAmount: Optional<NFTAmount>
): Optional<RailgunNFTAmount> => {
  if (!nftAmount) {
    return undefined;
  }
  return {
    nftAddress: nftAmount.nftAddress,
    nftTokenType: nftAmount.nftTokenType,
    tokenSubID: nftAmount.tokenSubID,
    amount: BigInt(nftAmount.amountString),
  };
};

export const createRailgunNFTAmounts = (nftAmounts: NFTAmount[]) => {
  return removeUndefineds(nftAmounts.map(createRailgunNFTAmount));
};

export const createRailgunNFTAmountRecipient = (
  nftAmountRecipient: Optional<NFTAmountRecipient>
): Optional<RailgunNFTAmountRecipient> => {
  if (!nftAmountRecipient) {
    return undefined;
  }
  const nftAmount = createRailgunNFTAmount(
    nftAmountRecipient
  ) as RailgunNFTAmount;
  return {
    ...nftAmount,
    recipientAddress: nftAmountRecipient.recipientAddress,
  };
};

export const createRailgunNFTAmountRecipients = (
  nftAmountRecipients: NFTAmountRecipient[]
): RailgunNFTAmountRecipient[] => {
  return removeUndefineds(
    nftAmountRecipients.map(createRailgunNFTAmountRecipient)
  );
};

export const createRailgunERC20Amounts = (
  tokenAmounts: ERC20Amount[]
): RailgunERC20Amount[] => {
  return removeUndefineds(tokenAmounts.map(createRailgunERC20Amount));
};

export const createERC20AmountRecipientGroups = (
  erc20AmountRecipients: ERC20AmountRecipient[]
): ERC20AmountRecipientGroup[] => {
  const recipientAddresses: string[] = erc20AmountRecipients.map(
    (tar) => tar.recipientAddress
  );
  const distinctRecipientAddresses: string[] = [];
  recipientAddresses.forEach((recipientAddress) => {
    if (!distinctRecipientAddresses.includes(recipientAddress)) {
      distinctRecipientAddresses.push(recipientAddress);
    }
  });

  const recipientGroups: ERC20AmountRecipientGroup[] =
    distinctRecipientAddresses.map((recipientAddress) => ({
      recipientAddress,
      tokenAmounts: erc20AmountRecipients.filter(
        (tar) => tar.recipientAddress === recipientAddress
      ),
      externalUnresolvedToWalletAddress: erc20AmountRecipients.length
        ? erc20AmountRecipients[0].externalUnresolvedToWalletAddress
        : undefined,
    }));

  return recipientGroups;
};

export const imageForToken = (token: ERC20Token): any => {
  if (token.isAddressOnly !== true) {
    if (token.icon) {
      return tokenIconForKey(token.icon);
    }
    if (isDefined(token.iconURL)) {
      return { uri: token.iconURL };
    }
  }
  return ImageTokenPlaceholder();
};

export const tokenIconForKey = (key: TokenIconKey): any => {
  switch (key) {
    case TokenIconKey.ImageTokenEthKey:
      return ImageTokenEth();
    case TokenIconKey.ImageTokenUsdcKey:
      return ImageTokenUsdc();
    case TokenIconKey.ImageTokenUSDCeKey:
      return ImageTokenUSDCe();
    case TokenIconKey.ImageTokenRailKey:
      return ImageTokenRail();
    case TokenIconKey.ImageTokenBnbKey:
      return ImageTokenBnb();
    case TokenIconKey.ImageTokenMaticKey:
      return ImageTokenMatic();
    case TokenIconKey.ImageTokenWethKey:
      return ImageTokenWeth();
    case TokenIconKey.ImageTokenWbnbKey:
      return ImageTokenWbnb();
    case TokenIconKey.ImageTokenWmaticKey:
      return ImageTokenWmatic();
    case TokenIconKey.ImageTokenWbtcKey:
      return ImageTokenWbtc();
    case TokenIconKey.ImageTokenDaiKey:
      return ImageTokenDai();
    case TokenIconKey.ImageTokenBusdKey:
      return ImageTokenBusd();
    case TokenIconKey.ImageTokenUsdtKey:
      return ImageTokenUsdt();
    case TokenIconKey.ImageRecipeTokenSushiswapKey:
      return ImageRecipeTokenSushiswap();
    case TokenIconKey.ImageRecipeTokenUniswapKey:
      return ImageRecipeTokenUniswap();
    case TokenIconKey.ImageRecipeTokenQuickswapKey:
      return ImageRecipeTokenQuickswap();
    case TokenIconKey.ImageRecipeTokenPancakeSwapKey:
      return ImageRecipeTokenPancakeSwap();

    case TokenIconKey.ImageRecipeTokenBeefyKey:
      return ImageRecipeTokenBeefy();
  }
};

export const createERC20TokenFromSearchableERC20 = (
  searchableERC20: SearchableERC20
): ERC20TokenFullInfo => {
  return {
    isAddressOnly: false,
    address: searchableERC20.address.toLowerCase(),
    name: searchableERC20.name,
    symbol: searchableERC20.symbol,
    decimals: searchableERC20.decimals,
    icon: searchableERC20.icon,
    iconURL: searchableERC20.logoURI,
    dateAdded: Date.now() / 1000,
    isBaseToken: searchableERC20.isBaseToken,
  };
};

export const createNavigateToTokenInfoActionData = (
  networkName: NetworkName,
  token: ERC20Token,
  isRailgun: boolean,
  balanceBucketFilter: RailgunWalletBalanceBucket[]
): ToastActionData => {
  return {
    toastAction: ToastAction.Navigate,
    navigationDataUNSAFE: {
      stack: ToastActionStack.Wallets,
      screen: ToastActionScreen.TokenInfo,
      params: {
        networkName,
        token,
        isRailgun,
        balanceBucketFilter,
      },
    },
  };
};

export const getDefaultAddedTokensForNetworks = (
  networkNames: NetworkName[]
) => {
  const addedTokens: MapType<ERC20TokenFullInfo[]> = {};
  for (const networkName of networkNames) {
    addedTokens[networkName] = getDefaultAddedTokens(networkName);
  }
  return addedTokens;
};

export const getDefaultAddedTokens = (
  networkName: NetworkName
): ERC20TokenFullInfo[] => {
  const defaultTokens = DEFAULT_WALLET_TOKENS_FOR_NETWORK[networkName];
  if (!isDefined(defaultTokens)) {
    throw new Error("No default tokens for this network");
  }
  return defaultTokens.map((token) => {
    return {
      ...token,
      dateAdded: Date.now() / 1000,
    };
  });
};

export const createRecipeFinalERC20Amounts = (
  wallet: Optional<FrontendWallet>,
  networkName: NetworkName,
  relayAdaptUnshieldERC20AmountRecipients?: ERC20AmountRecipient[],
  recipeOutput?: RecipeOutput
): Optional<RecipeFinalERC20Amounts> => {
  if (
    !isDefined(wallet) ||
    !isDefined(recipeOutput) ||
    !isDefined(relayAdaptUnshieldERC20AmountRecipients)
  ) {
    return undefined;
  }

  const inputERC20AmountRecipients = relayAdaptUnshieldERC20AmountRecipients;

  const outputERC20AmountRecipients: ERC20AmountRecipient[] =
    recipeOutput.erc20AmountRecipients
      .filter((erc20AmountRecipient) => erc20AmountRecipient.amount > 0n)
      .map((erc20AmountRecipient) => {
        const { amount, recipient } = erc20AmountRecipient;
        const token = createERC20TokenFromRecipeERC20Info(
          wallet,
          networkName,
          erc20AmountRecipient
        );
        return {
          amountString: amount.toString(),
          token,
          recipientAddress: recipient,
          externalUnresolvedToWalletAddress: "",
        };
      });

  const feeERC20AmountRecipients: ERC20AmountRecipient[] =
    recipeOutput.feeERC20AmountRecipients
      .filter((erc20Amount) => erc20Amount.amount > 0n)
      .map((erc20Amount) => {
        const { amount, recipient } = erc20Amount;
        const token = createERC20TokenFromRecipeERC20Info(
          wallet,
          networkName,
          erc20Amount
        );
        return {
          amountString: amount.toString(),
          token,
          recipientAddress: recipient,
          externalUnresolvedToWalletAddress: "",
        };
      });

  return {
    inputERC20AmountRecipients,
    outputERC20AmountRecipients,
    feeERC20AmountRecipients,
  };
};
