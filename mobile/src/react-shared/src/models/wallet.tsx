import {
  NetworkName,
  NFTAmount,
  NFTTokenType,
  RailgunERC20Amount,
  RailgunWalletBalanceBucket,
  TXIDVersion,
} from "@railgun-community/shared-models";
import {
  ERC20Balance,
  ERC20BalancesSerialized,
  ERC20TokenFullInfo,
} from "./token";

export type StoredWallet = {
  id: string;
  name: string;
  railAddress: string;
  railWalletID: string;
  createdAt: number;
  updatedAt: number;
  originalCreationDate?: number;
  addedTokens: MapType<ERC20TokenFullInfo[]>;
  supportedNetworkNames: NetworkName[];
  isActive: boolean;
  derivationIndex?: number;
  isViewOnlyWallet?: boolean;
  creationBlockNumbers?: MapType<number>;
  walletAddSource?: WalletAddSource;
};

export enum WalletAddSource {
  CreateWallet = "CreateWallet",
  ImportWallet = "ImportWallet",
  AddViewOnlyWallet = "AddViewOnlyWallet",
}

export type AvailableWallet = StoredWallet & {
  isViewOnlyWallet: false;
  ethAddress: string;
  isRailgunWalletLoaded?: boolean;
};

export type ViewOnlyWallet = StoredWallet & {
  isViewOnlyWallet: true;
  isRailgunWalletLoaded?: boolean;
};

export type FrontendWallet = AvailableWallet | ViewOnlyWallet;

export type FrontendWalletWithMnemonic = FrontendWallet & {
  mnemonic: string;
};

export type SavedAddress = {
  name: string;
  ethAddress?: string;
  railAddress?: string;
  externalResolvedAddress?: string;
};

export type CachedERC20Balance = {
  networkName: NetworkName;
  walletID: string;
  updatedTokenBalances: ERC20Balance[];
};

export type RailgunERC20AmountMapSerialized = Record<
  TXIDVersion,
  Partial<Record<RailgunWalletBalanceBucket, RailgunERC20Amount[]>>
>;

export type RailgunERC20AmountMap = Partial<RailgunERC20AmountMapSerialized>;

export type RailgunERC20BalanceMapSerialized = Record<
  TXIDVersion,
  Partial<Record<RailgunWalletBalanceBucket, ERC20Balance[]>>
>;

export type RailgunERC20BalanceMap = Partial<RailgunERC20BalanceMapSerialized>;

export type RailgunCachedERC20Balance = {
  networkName: NetworkName;
  walletID: string;
  updatedTokenBalancesMap: RailgunERC20BalanceMap;
};

export type CachedNFTBalance = {
  networkName: NetworkName;
  walletID: string;

  nftAmounts: {
    nftAddress: string;
    nftTokenType: NFTTokenType;
    tokenSubID: string;
    amountString: string;
  }[];
};

export type RailgunNFTAmountsMapSerialized = Record<
  TXIDVersion,
  Partial<
    Record<
      RailgunWalletBalanceBucket,
      {
        nftAddress: string;
        nftTokenType: NFTTokenType;
        tokenSubID: string;
        amountString: string;
      }[]
    >
  >
>;

export type RailgunNFTAmountsMap = Partial<RailgunNFTAmountsMapSerialized>;

export type RailgunCachedNFTAmounts = {
  networkName: NetworkName;
  walletID: string;
  nftAmountsMap: RailgunNFTAmountsMap;
};

export type RailgunBalanceBuckets = Partial<
  Record<RailgunWalletBalanceBucket, ERC20BalancesSerialized>
>;

export type RailgunTXIDBalanceMap = Record<TXIDVersion, RailgunBalanceBuckets>;

export type RailgunNFTStatusBuckets = Partial<
  Record<RailgunWalletBalanceBucket, NFTAmount[]>
>;

export type RailgunTXIDVersionNFTAmountMap = Record<
  TXIDVersion,
  RailgunNFTStatusBuckets
>;
