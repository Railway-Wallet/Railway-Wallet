import {
  Chain,
  FallbackProviderJsonConfig,
  FeeTokenDetails,
  NetworkName,
  PreTransactionPOIsPerTxidLeafPerList,
  ProofType,
  RailgunERC20Amount,
  RailgunERC20AmountRecipient,
  RailgunERC20Recipient,
  RailgunNFTAmount,
  RailgunNFTAmountRecipient,
  RelayerConnectionStatus,
  TransactionGasDetails,
  TransactionReceiptLog,
  TXIDVersion,
} from '@railgun-community/shared-models';
import { ContractTransaction } from 'ethers';

export enum BridgeEvent {
  Message = 'message',
  Error = 'error',
  UncaughtException = 'uncaughtException',

  OnBalancesUpdate = 'onBalancesUpdate',
  OnUTXOMerkletreeScanUpdate = 'onUTXOMerkletreeScanCallback',
  OnTXIDMerkletreeScanUpdate = 'onTXIDMerkletreeScanCallback',
  OnProofProgress = 'onProofProgress',
  OnPOIProofProgress = 'OnPOIProofProgress',
  OnArtifactsProgress = 'onArtifactsProgress',

  WakuMessage = 'wakuMessage',
  WakuError = 'wakuError',
  OnRelayerStatusCallback = 'OnRelayerStatusCallback',
}

export enum BridgeCallEvent {
  MnemonicTo0xPKey = 'mnemonicTo0xPKeyEthers',
  CreateRailgunWallet = 'createRailgunWallet',
  CreateViewOnlyRailgunWallet = 'CreateViewOnlyRailgunWallet',
  LoadRailgunWalletByID = 'loadRailgunWalletByID',
  UnloadRailgunWalletByID = 'unloadRailgunWalletByID',
  DeleteRailgunWalletByID = 'deleteRailgunWalletByID',
  StartRailgunEngine = 'startRailgunEngine',
  LoadProvider = 'loadProvider',
  UnloadProvider = 'unloadProvider',
  DownloadInitialArtifacts = 'DownloadInitialArtifacts',
  GetRailgunAddress = 'getRailgunAddress',
  GetWalletShareableViewingKey = 'GetWalletShareableViewingKey',
  RefreshRailgunBalances = 'refreshRailgunBalances',
  GenerateTransferProof = 'generateTransferProof',
  GenerateUnshieldProof = 'generateUnshieldProof',
  GenerateUnshieldBaseTokenProof = 'generateUnshieldBaseTokenProof',
  GetERC20AndNFTAmountRecipientsForUnshieldToOrigin = 'GetERC20AndNFTAmountRecipientsForUnshieldToOrigin',
  GenerateUnshieldToOriginProof = 'generateUnshieldToOriginProof',
  ValidateCachedProvedTransaction = 'ValidateCachedProvedTransaction',
  PopulateShield = 'populateShield',
  PopulateProvedTransfer = 'populateProvedTransfer',
  PopulateProvedUnshield = 'populateProvedUnshield',
  PopulateShieldBaseToken = 'populateShieldBaseToken',
  PopulateProvedUnshieldBaseToken = 'populateProvedUnshieldBaseToken',
  PopulateProvedUnshieldToOrigin = 'populateProvedUnshieldToOrigin',
  GasEstimateForShield = 'gasEstimateForShield',
  GasEstimateForShieldBaseToken = 'gasEstimateForShieldBaseToken',
  GasEstimateForUnprovenTransfer = 'gasEstimateForUnprovenTransfer',
  GasEstimateForUnprovenUnshield = 'gasEstimateForUnprovenUnshield',
  GasEstimateForUnprovenUnshieldBaseToken = 'gasEstimateForUnprovenUnshieldBaseToken',
  GasEstimateForUnprovenUnshieldToOrigin = 'gasEstimateForUnprovenUnshieldToOrigin',
  GetRandomBytes = 'getRandomBytes',
  GetShieldPrivateKeySignatureMessage = 'GetShieldPrivateKeySignatureMessage',
  ValidateRailgunAddress = 'validateRailgunAddress',
  ValidateEthAddress = 'validateEthAddress',
  VerifyRelayerSignature = 'verifyRelayerSignature',
  EncryptDataWithSharedKey = 'encryptDataWithSharedKey',
  EncryptAESGCM256 = 'encryptAESGCM256',
  DecryptAESGCM256 = 'decryptAESGCM256',
  GetRailgunWalletAddressData = 'GetRailgunWalletAddressData',
  GetWalletMnemonic = 'GetWalletMnemonic',
  RescanFullUTXOMerkletreesAndWallets = 'RescanFullUTXOMerkletreesAndWallets',
  ResetFullTXIDMerkletreesV2 = 'ResetFullTXIDMerkletreesV2',
  GetWalletTransactionHistory = 'GetWalletTransactionHistory',
  Pbkdf2 = 'Pbkdf2',
  PopulateCrossContractCalls = 'PopulateCrossContractCalls',
  GasEstimateForUnprovenCrossContractCalls = 'GasEstimateForUnprovenCrossContractCalls',
  GenerateCrossContractCallsProof = 'GenerateCrossContractCallsProof',
  GetRelayAdaptTransactionError = 'GetRelayAdaptTransactionError',
  RelayerStart = 'Relayer.Start',
  RelayerTryReconnect = 'Relayer.TryReconnect',
  RelayerSetAddressFilters = 'Relayer.SetAddressFilters',
  RelayerSetChain = 'Relayer.SetChain',
  RelayerFindBestRelayer = 'Relayer.FindBestRelayer',
  RelayerFindRandomRelayerForToken = 'Relayer.FindRandomRelayerForToken',
  RelayerFindAllRelayersForToken = 'Relayer.FindAllRelayersForToken',
  RelayerFindAllRelayersForChain = 'Relayer.FindAllRelayersForChain',
  RelayerGetMeshPeerCount = 'Relayer.GetMeshPeerCount',
  RelayerGetPubSubPeerCount = 'Relayer.GetPubSubPeerCount',
  RelayerGetLightPushPeerCount = 'Relayer.GetLightPushPeerCount',
  RelayerGetFilterPeerCount = 'Relayer.GetFilterPeerCount',
  RelayerRelayTransaction = 'Relayer.RelayTransaction',
  RelayerSupportsERC20Token = 'Relayer.SupportsERC20Token',
  PauseAllPollingProviders = 'PauseAllPollingProviders',
  ResumeIsolatedPollingProviderForNetwork = 'ResumeIsolatedPollingProviderForNetwork',
  GetTXOsReceivedPOIStatusInfoForWallet = 'GetTXOsReceivedPOIStatusInfoForWallet',
  GetTXOsSpentPOIStatusInfoForWallet = 'GetTXOsSpentPOIStatusInfoForWallet',
  GetSpendableReceivedChainTxids = 'GetSpendableReceivedChainTxids',
  GetChainTxidsStillPendingSpentPOIs = 'GetChainTxidsStillPendingSpentPOIs',
  GetPOIRequiredForNetwork = 'GetPOIRequiredForNetwork',
  GeneratePOIsForWalletAndRailgunTxid = 'GeneratePOIsForWalletAndRailgunTxid',
  GeneratePOIsForWallet = 'GeneratePOIsForWallet',
  RefreshReceivePOIsForWallet = 'RefreshReceivePOIsForWallet',
  RefreshSpentPOIsForWallet = 'RefreshSpentPOIsForWallet',
  SyncRailgunTransactionsV2 = 'SyncRailgunTransactionsV2',
}

export type StartRailgunEngineParams = {
  dbPath: string;
  devMode: boolean;
  walletSource: string;
  documentsDir: string;
  poiNodeURLs: Optional<string[]>;
};

export type ResumeIsolatedPollingProviderForNetworkParams = {
  networkName: NetworkName;
};

export type RefreshRailgunBalancesParams = {
  chain: Chain;
  railgunWalletIdFilter: Optional<string[]>;
};

export type SyncRailgunTransactionsV2Params = {
  networkName: NetworkName;
};

export type MnemonicTo0xPKeyParams = {
  mnemonic: string;
  derivationIndex?: number;
};

export type CreateRailgunWalletParams = {
  encryptionKey: string;
  mnemonic: string;
  creationBlockNumbers: Optional<MapType<number>>;
};

export type GetWalletMnemonicParams = {
  encryptionKey: string;
  railWalletID: string;
};

export type CreateViewOnlyRailgunWalletParams = {
  encryptionKey: string;
  shareableViewingKey: string;
  creationBlockNumbers: Optional<MapType<number>>;
};

export type DownloadInitialArtifactsParams = {
  preloadArtifactVariantStrings: string[];
  documentsDir: string;
};

export type GetWalletTransactionHistoryParams = {
  chain: Chain;
  railWalletID: string;
  startingBlock: Optional<number>;
};

export type RescanBalancesAllWalletsParams = {
  txidVersion: TXIDVersion;
  chain: Chain;
};

export type GetRailgunAddressParams = {
  railWalletID: string;
};

export type UnloadRailgunWalletByIDParams = {
  railWalletID: string;
};

export type DeleteRailgunWalletByIDParams = {
  railWalletID: string;
};

export type GetRandomBytesParams = {
  length: number;
};

export type Pbkdf2Params = {
  secret: string;
  salt: string;
  iterations: number;
};

export type RescanFullUTXOMerkletreesAndWalletsParams = {
  chain: Chain;
  railgunWalletIdFilter: Optional<string[]>;
};

export type ResetTXIDMerkletreesV2Params = {
  chain: Chain;
};

export type GetWalletShareableViewingKeyParams = {
  railWalletID: string;
};

export type EncryptDataWithSharedKeyParams = {
  data: object;
  externalPubKey: string;
};

export type DecryptAESGCM256Params = {
  encryptedData: [string, string];
  key: Uint8Array | string;
};

export type EncryptAESGCM256Params = {
  data: object;
  key: Uint8Array | string;
};

export type ValidateRailgunAddressParams = {
  address: string;
};

export type ValidateEthAddressParams = {
  address: string;
};

export type PopulateShieldParams = {
  txidVersion: TXIDVersion;
  networkName: NetworkName;
  shieldPrivateKey: string;
  erc20AmountRecipients: RailgunERC20AmountRecipient[];
  nftAmountRecipients: RailgunNFTAmountRecipient[];
  transactionGasDetails: TransactionGasDetails;
};

export type PopulateProvedTransferParams = {
  txidVersion: TXIDVersion;
  networkName: NetworkName;
  railWalletID: string;
  showSenderAddressToRecipient: boolean;
  memoText: Optional<string>;
  erc20AmountRecipients: RailgunERC20AmountRecipient[];
  nftAmountRecipients: RailgunNFTAmountRecipient[];
  relayerFeeERC20AmountRecipient?: RailgunERC20AmountRecipient;
  sendWithPublicWallet: boolean;
  overallBatchMinGasPrice: Optional<bigint>;
  transactionGasDetails: TransactionGasDetails;
};

export type PopulateProvedUnshieldParams = {
  txidVersion: TXIDVersion;
  networkName: NetworkName;
  railWalletID: string;
  erc20AmountRecipients: RailgunERC20AmountRecipient[];
  nftAmountRecipients: RailgunNFTAmountRecipient[];
  relayerFeeERC20AmountRecipient?: RailgunERC20AmountRecipient;
  transactionGasDetails: TransactionGasDetails;
  overallBatchMinGasPrice: Optional<bigint>;
  sendWithPublicWallet: boolean;
};

export type PopulateProvedUnshieldBaseTokenParams = {
  txidVersion: TXIDVersion;
  networkName: NetworkName;
  publicWalletAddress: string;
  railWalletID: string;
  wrappedTokenAmount: RailgunERC20Amount;
  relayerFeeERC20AmountRecipient?: RailgunERC20AmountRecipient;
  transactionGasDetails: TransactionGasDetails;
  overallBatchMinGasPrice: Optional<bigint>;
  sendWithPublicWallet: boolean;
};

export type PopulateProvedUnshieldToOriginParams = {
  txidVersion: TXIDVersion;
  networkName: NetworkName;
  railWalletID: string;
  erc20AmountRecipients: RailgunERC20AmountRecipient[];
  nftAmountRecipients: RailgunNFTAmountRecipient[];
  transactionGasDetails: TransactionGasDetails;
};

export type PopulateShieldBaseTokenParams = {
  txidVersion: TXIDVersion;
  networkName: NetworkName;
  railgunAddress: string;
  shieldPrivateKey: string;
  wrappedTokenAmount: RailgunERC20Amount;
  transactionGasDetails: TransactionGasDetails;
};

export type GasEstimateForShieldParams = {
  txidVersion: TXIDVersion;
  networkName: NetworkName;
  shieldPrivateKey: string;
  fromWalletAddress: string;
  erc20AmountRecipients: RailgunERC20AmountRecipient[];
  nftAmountRecipients: RailgunNFTAmountRecipient[];
};

export type GasEstimateForShieldBaseTokenParams = {
  txidVersion: TXIDVersion;
  networkName: NetworkName;
  railgunAddress: string;
  shieldPrivateKey: string;
  fromWalletAddress: string;
  wrappedTokenAmount: RailgunERC20Amount;
};

export type GenerateTransferProofParams = {
  txidVersion: TXIDVersion;
  networkName: NetworkName;
  railWalletID: string;
  showSenderAddressToRecipient: boolean;
  memoText: Optional<string>;
  encryptionKey: string;
  erc20AmountRecipients: RailgunERC20AmountRecipient[];
  nftAmountRecipients: RailgunNFTAmountRecipient[];
  relayerFeeERC20AmountRecipient?: RailgunERC20AmountRecipient;
  sendWithPublicWallet: boolean;
  overallBatchMinGasPrice: Optional<bigint>;
};

export type GenerateUnshieldProofParams = {
  txidVersion: TXIDVersion;
  networkName: NetworkName;
  railWalletID: string;
  encryptionKey: string;
  erc20AmountRecipients: RailgunERC20AmountRecipient[];
  nftAmountRecipients: RailgunNFTAmountRecipient[];
  relayerFeeERC20AmountRecipient?: RailgunERC20AmountRecipient;
  sendWithPublicWallet: boolean;
  overallBatchMinGasPrice: Optional<bigint>;
};

export type GenerateUnshieldBaseTokenProofParams = {
  txidVersion: TXIDVersion;
  networkName: NetworkName;
  publicWalletAddress: string;
  railWalletID: string;
  encryptionKey: string;
  wrappedTokenAmount: RailgunERC20Amount;
  relayerFeeERC20AmountRecipient?: RailgunERC20AmountRecipient;
  sendWithPublicWallet: boolean;
  overallBatchMinGasPrice: Optional<bigint>;
};

export type GenerateUnshieldToOriginProofParams = {
  originalShieldTxid: string;
  txidVersion: TXIDVersion;
  networkName: NetworkName;
  railWalletID: string;
  encryptionKey: string;
  erc20AmountRecipients: RailgunERC20AmountRecipient[];
  nftAmountRecipients: RailgunNFTAmountRecipient[];
};

export type ValidateCachedProvedTransactionParams = {
  txidVersion: TXIDVersion;
  networkName: NetworkName;
  proofType: ProofType;
  railWalletID: string;
  showSenderAddressToRecipient: boolean;
  memoText: Optional<string>;
  erc20AmountRecipients: RailgunERC20AmountRecipient[];
  nftAmountRecipients: RailgunNFTAmountRecipient[];
  relayAdaptUnshieldERC20Amounts: Optional<RailgunERC20Amount[]>;
  relayAdaptUnshieldNFTAmounts: Optional<RailgunNFTAmount[]>;
  relayAdaptShieldERC20Recipients: Optional<RailgunERC20Recipient[]>;
  relayAdaptShieldNFTRecipients: Optional<RailgunNFTAmount[]>;
  crossContractCalls: Optional<ContractTransaction[]>;
  relayerFeeERC20AmountRecipient?: RailgunERC20AmountRecipient;
  sendWithPublicWallet: boolean;
  overallBatchMinGasPrice: Optional<bigint>;
};

export type GasEstimateForUnprovenTransferParams = {
  txidVersion: TXIDVersion;
  networkName: NetworkName;
  railWalletID: string;
  memoText: Optional<string>;
  encryptionKey: string;
  erc20AmountRecipients: RailgunERC20AmountRecipient[];
  nftAmountRecipients: RailgunNFTAmountRecipient[];
  originalGasDetails: TransactionGasDetails;
  feeTokenDetails: Optional<FeeTokenDetails>;
  sendWithPublicWallet: boolean;
};

export type GasEstimateForUnprovenUnshieldParams = {
  txidVersion: TXIDVersion;
  networkName: NetworkName;
  railWalletID: string;
  encryptionKey: string;
  erc20AmountRecipients: RailgunERC20AmountRecipient[];
  nftAmountRecipients: RailgunNFTAmountRecipient[];
  originalGasDetails: TransactionGasDetails;
  feeTokenDetails: Optional<FeeTokenDetails>;
  sendWithPublicWallet: boolean;
};

export type GasEstimateForUnprovenUnshieldBaseTokenParams = {
  txidVersion: TXIDVersion;
  networkName: NetworkName;
  publicWalletAddress: string;
  railWalletID: string;
  encryptionKey: string;
  wrappedTokenAmount: RailgunERC20Amount;
  originalGasDetails: TransactionGasDetails;
  feeTokenDetails: Optional<FeeTokenDetails>;
  sendWithPublicWallet: boolean;
};

export type GasEstimateForUnprovenUnshieldToOriginParams = {
  originalShieldTxid: string;
  txidVersion: TXIDVersion;
  networkName: NetworkName;
  railWalletID: string;
  encryptionKey: string;
  erc20AmountRecipients: RailgunERC20AmountRecipient[];
  nftAmountRecipients: RailgunNFTAmountRecipient[];
};

export type GetERC20AndNFTAmountRecipientsForUnshieldToOriginParams = {
  txidVersion: TXIDVersion;
  networkName: NetworkName;
  railgunWalletID: string;
  originalShieldTxid: string;
};

export type GasEstimateForUnprovenCrossContractCallsParams = {
  txidVersion: TXIDVersion;
  networkName: NetworkName;
  railWalletID: string;
  encryptionKey: string;
  relayAdaptUnshieldERC20Amounts: RailgunERC20Amount[];
  relayAdaptUnshieldNFTAmounts: RailgunNFTAmount[];
  relayAdaptShieldERC20Recipients: RailgunERC20Recipient[];
  relayAdaptShieldNFTRecipients: RailgunNFTAmountRecipient[];
  crossContractCalls: ContractTransaction[];
  originalGasDetails: TransactionGasDetails;
  feeTokenDetails: Optional<FeeTokenDetails>;
  sendWithPublicWallet: boolean;
  minGasLimit: bigint;
};

export type PopulateCrossContractCallsParams = {
  txidVersion: TXIDVersion;
  networkName: NetworkName;
  railWalletID: string;
  relayAdaptUnshieldERC20Amounts: RailgunERC20Amount[];
  relayAdaptUnshieldNFTAmounts: RailgunNFTAmount[];
  relayAdaptShieldERC20Recipients: RailgunERC20Recipient[];
  relayAdaptShieldNFTRecipients: RailgunNFTAmountRecipient[];
  crossContractCalls: ContractTransaction[];
  relayerFeeERC20AmountRecipient?: RailgunERC20AmountRecipient;
  sendWithPublicWallet: boolean;
  overallBatchMinGasPrice: Optional<bigint>;
  transactionGasDetails: TransactionGasDetails;
};

export type GenerateCrossContractCallsProofParams = {
  txidVersion: TXIDVersion;
  networkName: NetworkName;
  railWalletID: string;
  encryptionKey: string;
  relayAdaptUnshieldERC20Amounts: RailgunERC20Amount[];
  relayAdaptUnshieldNFTAmounts: RailgunNFTAmount[];
  relayAdaptShieldERC20Recipients: RailgunERC20Recipient[];
  relayAdaptShieldNFTRecipients: RailgunNFTAmountRecipient[];
  crossContractCalls: ContractTransaction[];
  relayerFeeERC20AmountRecipient?: RailgunERC20AmountRecipient;
  sendWithPublicWallet: boolean;
  overallBatchMinGasPrice: Optional<bigint>;
  minGasLimit: bigint;
};

export type GetRelayAdaptTransactionErrorParams = {
  txidVersion: TXIDVersion;
  receiptLogs: TransactionReceiptLog[];
};

export type LoadRailgunWalletByIDParams = {
  encryptionKey: string;
  railWalletID: string;
  isViewOnlyWallet: boolean;
};

export type GetRailgunWalletAddressDataParams = {
  railgunAddress: string;
};

export type LoadProviderParams = {
  providerConfig: FallbackProviderJsonConfig;
  networkName: NetworkName;
  pollingInterval: number;
};

export type UnloadProviderParams = {
  networkName: NetworkName;
};

export type RelayerStatusCallbackData = {
  chain: Chain;
  status: RelayerConnectionStatus;
};

export type VerifyRelayerSignatureParams = {
  signature: string;
  data: string;
  signingKey: string;
};

export type RelayerActionData = {
  error?: string;
};

export type RelayerSendActionData = {
  txHash?: string;
  error?: Error;
};

export type RelayerStartParams = {
  chain: Chain;
  pubSubTopic: string;
  additionalDirectPeers: Optional<string[]>;
  peerDiscoveryTimeout: Optional<number>;
  poiActiveListKeys: string[];
};

export type RelayerSetAddressFiltersParams = {
  allowlist: Optional<string[]>;
  blocklist: Optional<string[]>;
};

export type RelayerSetChainParams = {
  chain: Chain;
};

export type RelayerFindBestRelayerParams = {
  chain: Chain;
  tokenAddress: string;
  useRelayAdapt: boolean;
};

export type RelayerFindRandomRelayerForTokenParams =
  RelayerFindBestRelayerParams & {
    percentage: number;
  };

export type RelayerFindAllRelayersForTokenParams = RelayerFindBestRelayerParams;

export type RelayerFindAllRelayersForChainParams = {
  chain: Chain;
  useRelayAdapt: boolean;
};

export type RelayerRelayTransactionParams = {
  txidVersionForInputs: TXIDVersion;
  to: string;
  data: string;
  relayerRailgunAddress: string;
  relayerFeesID: string;
  chain: Chain;
  nullifiers: string[];
  overallBatchMinGasPrice: bigint;
  useRelayAdapt: boolean;
  preTransactionPOIsPerTxidLeafPerList: PreTransactionPOIsPerTxidLeafPerList;
};

export type RelayerSupportsERC20TokenParams = {
  chain: Chain;
  tokenAddress: string;
  useRelayAdapt: boolean;
};

export enum TXOPOIListStatus {
  Valid = 'Valid',
  ShieldBlocked = 'ShieldBlocked',
  ProofSubmitted = 'ProofSubmitted',
  Missing = 'Missing',
}

export type POIsPerList = {
  [key: string]: TXOPOIListStatus;
};

export type TXOsReceivedPOIStatusInfoShared = {
  tree: number;
  position: number;
  txid: string;
  commitment: string;
  blindedCommitment: string;
  poisPerList: Optional<POIsPerList>;
};

export type TXOsReceivedPOIStatusInfo = {
  strings: TXOsReceivedPOIStatusInfoShared;
  emojis: TXOsReceivedPOIStatusInfoShared;
};

export type TXOsSpentPOIStatusInfoShared = {
  blockNumber: number;
  txid: string;
  railgunTxid: string;
  railgunTransactionInfo: string;
  sentCommitmentsBlinded: string;
  poiStatusesSpentTXOs: Optional<POIsPerList>[];
  poiStatusesSentCommitments: Optional<POIsPerList>[];
  unshieldEventsBlinded: string;
  poiStatusesUnshieldEvents: Optional<POIsPerList>[];
  listKeysCanGenerateSpentPOIs: string[];
};

export type TXOsSpentPOIStatusInfo = {
  strings: TXOsSpentPOIStatusInfoShared;
  emojis: TXOsSpentPOIStatusInfoShared;
};

export type GetPOIRequiredForNetworkParams = {
  networkName: NetworkName;
};

export type GetChainTxidsStillPendingSpentPOIsParams = {
  txidVersion: TXIDVersion;
  networkName: NetworkName;
  railWalletID: string;
};

export type GetSpendableReceivedChainTxidsParams = {
  txidVersion: TXIDVersion;
  networkName: NetworkName;
  railWalletID: string;
};

export type GetTXOsReceivedPOIStatusInfoForWalletParams = {
  txidVersion: TXIDVersion;
  networkName: NetworkName;
  railWalletID: string;
};

export type GetTXOsSpentPOIStatusInfoForWalletParams = {
  txidVersion: TXIDVersion;
  networkName: NetworkName;
  railWalletID: string;
};

export type GeneratePOIsForWalletAndRailgunTxidParams = {
  txidVersion: TXIDVersion;
  networkName: NetworkName;
  railWalletID: string;
  railgunTxid: string;
};

export type GeneratePOIsForWalletParams = {
  networkName: NetworkName;
  railWalletID: string;
};

export type RefreshReceivePOIsForWalletParams = {
  txidVersion: TXIDVersion;
  networkName: NetworkName;
  railWalletID: string;
};

export type RefreshSpentPOIsForWalletParams = {
  txidVersion: TXIDVersion;
  networkName: NetworkName;
  railWalletID: string;
  railgunTxid?: string;
};
