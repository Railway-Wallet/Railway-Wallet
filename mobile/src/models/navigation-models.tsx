import {
  LiquidityV2Pool,
  RecipeOutput,
  SwapQuoteData,
  SwapRecipe,
} from "@railgun-community/cookbook";
import {
  Network,
  NFTAmountRecipient,
  RailgunWalletBalanceBucket,
  SelectedBroadcaster,
  TransactionGasDetails,
  TransactionGasDetailsType0,
  TransactionGasDetailsType1,
  TransactionGasDetailsType2,
  WalletCreationType,
} from "@railgun-community/shared-models";
import { LiquidityV2PoolSerialized } from "react-shared/src/models/liquidity-pool";
import { TransactionResponse } from "ethers";
import {
  CookbookFarmRecipeType,
  CookbookSwapRecipeType,
  CustomGasTransactionDetails,
  ERC20Amount,
  ERC20AmountRecipient,
  ERC20Token,
  FrontendLiquidityPair,
  FrontendWallet,
  NetworkFeeSelection,
  SavedTransaction,
  SearchableERC20,
  StoredWallet,
  TransactionType,
  Vault,
} from "@react-shared";

export type WalletsStackParamList = {
  Wallets: undefined;
  TokenInfo: {
    isRailgun: boolean;
    token: ERC20Token;
    balanceBucketFilter: RailgunWalletBalanceBucket[];
  };
};

type ApproveTokenConfirmData = {
  spender: string;
  spenderName: string;
  tokenAmount: ERC20Amount;
  infoCalloutText: string;
  transactionType: TransactionType;
  onSuccessCallback: () => void;
};

type ReceiveTokenData = {
  isRailgun: boolean;
  titleOverride?: string;
};

type RecoveryWalletsData = {
  resetRecoveryMode?: () => void;
};

export type RootStackParamList = {
  LockedScreen: {
    goBackOnDismiss: boolean;
    skipAuthOnMount: boolean;
    recoveryMode?: boolean;
  };
  LockedModal: {
    goBackOnDismiss: true;
    skipAuthOnMount: true;
  };
  WalletProviderLoading: undefined;
  Tabs: undefined;
  RecoveryWallets: RecoveryWalletsData;
  OnboardingScreen: undefined;
};

export type TokenStackParamList = {
  ReceiveToken: ReceiveTokenData;
  SendERC20s: {
    isRailgun: boolean;
    token?: ERC20Token;
  };
  SendERC20sConfirm: {
    isRailgun: boolean;
    erc20AmountRecipients: ERC20AmountRecipient[];
    nftAmountRecipients: NFTAmountRecipient[];
  };
  ShieldToken: {
    token?: ERC20Token;
  };
  ShieldERC20sConfirm: {
    erc20AmountRecipients: ERC20AmountRecipient[];
    nftAmountRecipients: NFTAmountRecipient[];
  };
  UnshieldERC20s: {
    token?: ERC20Token;
  };
  UnshieldERC20sConfirm: {
    erc20AmountRecipients: ERC20AmountRecipient[];
    nftAmountRecipients: NFTAmountRecipient[];
    isBaseTokenUnshield: boolean;
    balanceBucketFilter: RailgunWalletBalanceBucket[];
    unshieldToOriginShieldTxid: Optional<string>;
  };
  MintTokensConfirm: {
    tokenAmount: ERC20Amount;
  };
  CancelTransactionConfirm: {
    transaction: SavedTransaction;
    txResponse: TransactionResponse;
  };
  ApproveTokenConfirm: ApproveTokenConfirmData;
};

export type DAppsParams = {
  Swap: { navigationToken?: ERC20Token; isRailgun?: boolean };
  FarmScreen: {};
  LiquidityScreen: {};
};

export type DAppsStackParamList = DAppsParams & {
  DApps: undefined;

  SwapPublicConfirm: {
    sellERC20Amount: ERC20Amount;
    buyERC20: ERC20Token;
    originalSlippagePercentage: number;
    originalQuote: SwapQuoteData;
    returnBackFromCompletedOrder: () => void;
  };
  SwapPrivateConfirm: {
    swapRecipeType: CookbookSwapRecipeType;
    originalRecipe: SwapRecipe;
    originalRecipeOutput: RecipeOutput;
    sellERC20Amount: ERC20Amount;
    buyERC20: ERC20Token;
    originalQuote: SwapQuoteData;
    originalSlippagePercentage: number;
    returnBackFromCompletedOrder: () => void;
  };

  FarmVaultInitial: {
    currentToken: ERC20Token;
    cookbookFarmRecipeType: CookbookFarmRecipeType;
  };
  FarmVaultConfirm: {
    selectedTokenAmount: ERC20Amount;
    selectedVault: Vault;
    cookbookFarmRecipeType: CookbookFarmRecipeType;
  };

  AddLiquidityInitial: {
    pool: FrontendLiquidityPair;
    initialTokenAmount?: ERC20Amount;
  };
  AddLiquidityConfirm: {
    selectedPoolSerialized: LiquidityV2PoolSerialized;
    tokenAmountA: ERC20Amount;
    tokenAmountB: ERC20Amount;
  };
  RemoveLiquidityInitial: {
    tokenAddress: string;
    initialTokenAmount?: ERC20Amount;
  };
  RemoveLiquidityConfirm: {
    tokenAmount: ERC20Amount;
    liquidityPool: LiquidityV2Pool;
  };

  ApproveTokenConfirm: ApproveTokenConfirmData;
};

export type NFTsStackParamList = {
  NFTs: undefined;
};

export type ActivityStackParamList = {
  Activity: undefined;
};

type ShowSeedPhraseData = {
  wallet: StoredWallet;
};

type ShowViewingKeyData = {
  wallet: StoredWallet;
};

export type SettingsStackParamList = {
  Settings: undefined;
  SettingsWallets: undefined;
  SettingsNetworks: {
    resetRecoveryMode?: () => void;
  };
  SettingsDefaults: undefined;
  SettingsWalletInfo: {
    wallet: FrontendWallet;
  };
  SettingsNetworkInfo: {
    network: Network;
    newRpcUrl?: string;
  };
  CreateWallet: undefined;
  ImportWallet: undefined;
  AddViewOnlyWallet: undefined;
  NewWalletSuccess: {
    walletCreationType: WalletCreationType;
    hasMnemonic: boolean;
    railgunAddress: string;
    ethAddress: string;
  };
  ShowSeedPhrase: ShowSeedPhraseData;
  ShowViewingKey: ShowViewingKeyData;
  SettingsAddRPC: {
    network: Network;
  };
  SettingsBroadcasters: undefined;
  SettingsAddressBook: undefined;
  SettingsAddSavedAddress: undefined;
};

export type RecoveryStackParamList = {
  RecoveryWallets: RecoveryWalletsData;
  SeedPhrase: RecoverySeedPhraseStackParamList;
};

export type AddTokenStackParamList = {
  AddTokensScreen: {
    customToken: Optional<SearchableERC20>;
    initialTokenAddress: Optional<string>;
  };
  AddCustomTokenScreen:
    | undefined
    | {
        initialTokenAddress: Optional<string>;
      };
};

export type SelectNetworkFeeStackParamList = {
  SelectNetworkFeeModal: {
    onDismiss: (
      networkFeeSelection?: NetworkFeeSelection,
      customGasTransactionDetails?: CustomGasTransactionDetails
    ) => void;
    currentOption: NetworkFeeSelection;
    gasDetailsMap: Optional<Record<NetworkFeeSelection, TransactionGasDetails>>;
    defaultCustomGasTransactionDetails: CustomGasTransactionDetails;
    selectedBroadcaster: Optional<SelectedBroadcaster>;
    selectedFeeToken: ERC20Token;
    isBroadcasterTransaction: boolean;
  };
  CustomNetworkFeeTypes01Screen: {
    onDismiss: (customGasPrice?: bigint) => void;
    defaultGasDetails: TransactionGasDetailsType0 | TransactionGasDetailsType1;
  };
  CustomNetworkFeeType2Screen: {
    onDismiss: (
      customMaxFeePerGas?: bigint,
      customMaxPriorityFeePerGas?: bigint
    ) => void;
    defaultGasDetails: TransactionGasDetailsType2;
  };
};

export type NewWalletStackParamList = {
  Wallets: undefined;
  CreateWallet: undefined;
  ImportWallet: undefined;
  AddViewOnlyWallet: undefined;
  NewWalletSuccess: {
    walletCreationType: WalletCreationType;
    wallet: FrontendWallet;
  };
  SeedPhraseCallout: {
    wallet: FrontendWallet;
  };
  ViewingKeyCallout: {
    walletCreationType: WalletCreationType;
    wallet: FrontendWallet;
  };
  ShowSeedPhrase: {
    wallet: FrontendWallet;
  };
  ReceiveToken: ReceiveTokenData;
};

type RecoverySeedPhraseStackParamList = {
  screen: "ShowSeedPhrase" | "ShowViewingKey";
  params: ShowSeedPhraseData;
};
