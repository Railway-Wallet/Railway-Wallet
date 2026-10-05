import {
  FxMintPoolName,
  RecipeOutput,
  SwapQuoteData,
  SwapRecipe,
} from '@railgun-community/cookbook';
import {
  NFTAmount,
  NFTAmountRecipient,
  RailgunWalletBalanceBucket,
} from '@railgun-community/shared-models';
import { TransactionResponse } from 'ethers';
import {
  CookbookFarmRecipeType,
  CookbookLiquidityRecipeType,
  CookbookSwapRecipeType,
  ERC20Amount,
  ERC20AmountRecipient,
  ERC20Token,
  FrontendLiquidityPair,
  MorphoVaultVersion,
  SavedTransaction,
  Vault,
} from '@react-shared';

export const EVENT_OPEN_DRAWER_WITH_DATA = 'EVENT_OPEN_DRAWER_WITH_DATA';
export const EVENT_CLOSE_DRAWER = 'EVENT_CLOSE_DRAWER';

export type DrawerExtraData =
  | ERC20InfoData
  | TransferERC20Data
  | TransferNFTData
  | ReceiveTokensData
  | MintERC20sData
  | UnshieldToOriginData
  | CancelTransactionData
  | ApproveSpenderData
  | AddTokensData
  | SwapPrivateData
  | SwapPublicData
  | FarmVaultData
  | LiquidityData
  | EphemeralReclaimData
  | FxMintOpenData
  | FxMintTopupData
  | FxMintCloseData
  | MorphoVaultDepositData
  | MorphoVaultRedeemData;

export type DrawerEventData = {
  drawerName: DrawerName;
  extraData?: DrawerExtraData;
};

export enum DrawerName {
  AddTokens = 'AddTokens',
  SendERC20s = 'SendERC20s',
  ReceiveTokens = 'ReceiveTokens',
  ERC20Info = 'ERC20Info',
  ShieldERC20s = 'ShieldERC20s',
  SendNFTs = 'SendNFTs',
  ShieldNFTs = 'ShieldNFTs',
  UnshieldNFTs = 'UnshieldNFTs',
  UnshieldERC20s = 'UnshieldERC20s',
  UnshieldToOrigin = 'UnshieldToOrigin',
  ApproveSpender = 'ApproveSpender',
  MintERC20s = 'MintERC20s',
  CancelTransaction = 'CancelTransaction',
  SwapPublic = 'SwapPublic',
  SwapPrivate = 'SwapPrivate',
  ExportTransactions = 'ExportTransactions',
  FarmVault = 'FarmVault',
  Liquidity = 'Liquidity',
  EphemeralReclaim = 'EphemeralReclaim',
  FxMintOpen = 'FxMintOpen',
  FxMintTopup = 'FxMintTopup',
  FxMintClose = 'FxMintClose',
  MorphoVaultDeposit = 'MorphoVaultDeposit',
  MorphoVaultRedeem = 'MorphoVaultRedeem',
}

export type EphemeralReclaimData = {
  ephemeralAddress: string;
  erc20Tokens: {
    address: string;
    symbol: string;
    decimals: number;
    amountString: string;
  }[];
  nativeWeiString?: string;
  ephemeralIndex?: number;
};

export type FxMintOpenData = {
  pool: FxMintPoolName;
  sellERC20Amount: ERC20Amount;
  targetDebtString: string
  slippagePercentage: number;
};

export type FxMintTopupData = {
  pool: FxMintPoolName;
  positionId: string
  positionNFT: NFTAmount
  sellERC20Amount: ERC20Amount;
  additionalDebtString: string
  slippagePercentage: number;
};

export type FxMintCloseData = {
  pool: FxMintPoolName;
  positionId: string
  positionNFT: NFTAmount
  buyERC20: ERC20Token
  slippagePercentage: number;
};

export type MorphoVaultDepositData = {
  vaultAddress: string;
  vaultVersion: MorphoVaultVersion;
  assetAddress: string;
  assetDecimals: number;
  shareDecimals: number;
  sellERC20Amount: ERC20Amount;
  slippagePercentage: number;
};

export type MorphoVaultRedeemData = {
  vaultAddress: string;
  vaultVersion: MorphoVaultVersion;
  assetAddress: string;
  assetDecimals: number;
  shareDecimals: number;
  sharesAmountString: string
  buyERC20: ERC20Token
  slippagePercentage: number;
};

export type ERC20InfoData = {
  erc20: ERC20Token;
  balanceBucketFilter: RailgunWalletBalanceBucket[];
};

export type TransferNFTData = {
  nftAmount?: NFTAmount;
};

export type TransferERC20Data = {
  erc20?: ERC20Token;
};

export type FarmVaultData = {
  currentToken: ERC20Token;
  cookbookFarmRecipeType: CookbookFarmRecipeType;
  vault?: Vault;
};

export type LiquidityData = {
  pool?: FrontendLiquidityPair;
  tokenAddress?: string;
  tokenName?: string;
  cookbookLiquidityRecipeType: CookbookLiquidityRecipeType;
};

export type ReceiveTokensData = {
  isRailgun?: boolean;
  titleOverride?: string;
};

export type MintERC20sData = {
  erc20Amount: ERC20Amount;
};

export type UnshieldToOriginData = {
  originalShieldTxid: string;
  erc20AmountRecipients: ERC20AmountRecipient[];
  nftAmountRecipients: NFTAmountRecipient[];
};

export type CancelTransactionData = {
  transaction: SavedTransaction;
  txResponse: TransactionResponse;
};

export type ApproveSpenderData = {
  erc20Amount: ERC20Amount;
  spender: string;
  spenderName: string;
  infoCalloutText: string;
};

export type SwapPrivateData = {
  swapRecipeType: CookbookSwapRecipeType;
  originalRecipe: SwapRecipe;
  originalRecipeOutput: RecipeOutput;
  sellERC20Amount: ERC20Amount;
  buyERC20: ERC20Token;
  originalQuote: SwapQuoteData;
  originalSlippagePercentage: number;
};

export type SwapPublicData = {
  sellERC20Amount: ERC20Amount;
  buyERC20: ERC20Token;
  originalQuote: SwapQuoteData;
  originalSlippagePercentage: number;
};

export type AddTokensData = {
  customTokenAddress?: string;
};
