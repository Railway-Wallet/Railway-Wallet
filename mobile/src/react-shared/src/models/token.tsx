export const BASE_TOKEN_ADDRESS = "0x00";

export type ERC20Balance = {
  isBaseToken: boolean;
  tokenAddress: string;
  balanceString: string;
};

export enum SelectTokenPurpose {
  Transfer = "Transfer",
  BroadcasterFee = "BroadcasterFee",
}

export type ERC20Token = ERC20TokenFullInfo | ERC20TokenAddressOnly;

export type ERC20TokenFullInfo = {
  isAddressOnly?: false;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  icon?: TokenIconKey;
  iconURL?: string;
  dateAdded?: number;
  isBaseToken?: boolean;
  disableWalletRemoval?: boolean;
};

export type ERC20TokenAddressOnly = {
  isAddressOnly: true;
  address: string;
  isBaseToken?: boolean;
  decimals: number;
};

export type ERC20TokenBalance = {
  token: ERC20Token;
  balance: Optional<bigint>;
  balanceCurrency: Optional<number>;
  priceCurrency: Optional<number>;
};

export type ERC20Amount = {
  token: ERC20Token;
  amountString: string;
};

export type ERC20AmountRecipient = ERC20Amount & {
  recipientAddress: string;
  externalUnresolvedToWalletAddress: Optional<string>;
};

export type ERC20AmountRecipientGroup = {
  recipientAddress: string;
  externalUnresolvedToWalletAddress: Optional<string>;
  tokenAmounts: ERC20Amount[];
};

export type AdjustedERC20AmountRecipients = {
  input: ERC20AmountRecipient;
  output: ERC20AmountRecipient;
  fee: ERC20Amount;
  isMax: boolean;
};

export type AdjustedERC20AmountRecipientGroup = {
  inputs: ERC20AmountRecipient[];
  outputs: ERC20AmountRecipient[];
  fees: ERC20Amount[];
};

export type RecipeFinalERC20Amounts = {
  inputERC20AmountRecipients: ERC20AmountRecipient[];
  outputERC20AmountRecipients: ERC20AmountRecipient[];
  feeERC20AmountRecipients: ERC20AmountRecipient[];
};

export type SearchableERC20 = {
  searchStr: string;
  address: string;
  name: string;
  symbol: string;
  icon?: TokenIconKey;
  logoURI?: string;
  decimals: number;
  isBaseToken?: boolean;
};

export type ERC20BalancesSerialized = MapType<string>;

export enum TokenIconKey {
  ImageTokenEthKey = "ImageTokenEthKey",
  ImageTokenUsdcKey = "ImageTokenUsdcKey",
  ImageTokenUSDCeKey = "ImageTokenUSDCeKey",
  ImageTokenRailKey = "ImageTokenRailKey",
  ImageTokenBnbKey = "ImageTokenBnbKey",
  ImageTokenMaticKey = "ImageTokenMaticKey",
  ImageTokenWethKey = "ImageTokenWethKey",
  ImageTokenWbnbKey = "ImageTokenWbnbKey",
  ImageTokenWmaticKey = "ImageTokenWmaticKey",
  ImageTokenWbtcKey = "ImageTokenWbtcKey",
  ImageTokenDaiKey = "ImageTokenDaiKey",
  ImageTokenBusdKey = "ImageTokenBusdKey",
  ImageTokenUsdtKey = "ImageTokenUsdtKey",

  ImageRecipeTokenBeefyKey = "ImageRecipeTokenBeefyKey",
  ImageRecipeTokenUniswapKey = "ImageRecipeTokenUniswapKey",
  ImageRecipeTokenSushiswapKey = "ImageRecipeTokenSushiswapKey",
  ImageRecipeTokenQuickswapKey = "ImageRecipeTokenQuickswapKey",
  ImageRecipeTokenPancakeSwapKey = "ImageRecipeTokenPancakeSwapKey",
}

export const MINTABLE_TEST_TOKEN_ROPSTEN: ERC20TokenFullInfo = {
  name: "Test ERC20 Token",
  symbol: "TESTERC20",
  address: "0xAa753fb4e77ea8Adb16200865839ffB1d86BAE5E",
  decimals: 18,
};

export type CoingeckoTokenDetails = {
  name: string;
  symbol: string;
  image: { thumbnail: string; small: string; large: string };
};
