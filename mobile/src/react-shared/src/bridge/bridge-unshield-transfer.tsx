import {
  FeeTokenDetails,
  isDefined,
  NetworkName,
  NFTAmountRecipient,
  RailgunERC20AmountRecipient,
  RailgunNFTAmountRecipient,
  RailgunPopulateTransactionResponse,
  RailgunTransactionGasEstimateResponse,
  SelectedBroadcaster,
  TransactionGasDetails,
  TXIDVersion,
} from "@railgun-community/shared-models";
import {
  BridgeCallEvent,
  GasEstimateForUnprovenTransferParams,
  GasEstimateForUnprovenUnshieldBaseTokenParams,
  GasEstimateForUnprovenUnshieldParams,
  GasEstimateForUnprovenUnshieldToOriginParams,
  GetERC20AndNFTAmountRecipientsForUnshieldToOriginParams,
  PopulateProvedTransferParams,
  PopulateProvedUnshieldBaseTokenParams,
  PopulateProvedUnshieldParams,
  PopulateProvedUnshieldToOriginParams,
} from "../models/bridge";
import { ERC20Amount, ERC20AmountRecipient } from "../models/token";
import { logDev } from "../utils/logging";
import {
  createBroadcasterFeeERC20AmountRecipient,
  createRailgunERC20Amount,
  createRailgunERC20AmountRecipient,
  createRailgunERC20AmountRecipients,
  createRailgunNFTAmountRecipients,
} from "../utils/tokens";
import { bridgeCall } from "./ipc";

export const populateProvedTransfer = (
  txidVersion: TXIDVersion,
  networkName: NetworkName,
  railWalletID: string,
  showSenderAddressToRecipient: boolean,
  memoText: Optional<string>,
  erc20AmountRecipients: ERC20AmountRecipient[],
  nftAmountRecipients: NFTAmountRecipient[],
  selectedBroadcaster: Optional<SelectedBroadcaster>,
  broadcasterFeeERC20Amount: Optional<ERC20Amount>,
  sendWithPublicWallet: boolean,
  overallBatchMinGasPrice: Optional<bigint>,
  transactionGasDetails: TransactionGasDetails
): Promise<RailgunPopulateTransactionResponse> => {
  const erc20AmountRecipientsRailgun = createRailgunERC20AmountRecipients(
    erc20AmountRecipients
  );
  const broadcasterFeeERC20AmountRecipient =
    createBroadcasterFeeERC20AmountRecipient(
      selectedBroadcaster,
      broadcasterFeeERC20Amount
    );
  const broadcasterFeeERC20AmountRecipientRailgun =
    createRailgunERC20AmountRecipient(broadcasterFeeERC20AmountRecipient);
  const nftAmountRecipientsRailgun =
    createRailgunNFTAmountRecipients(nftAmountRecipients);

  return bridgeCall<
    PopulateProvedTransferParams,
    RailgunPopulateTransactionResponse
  >(BridgeCallEvent.PopulateProvedTransfer, {
    txidVersion,
    networkName,
    railWalletID,
    showSenderAddressToRecipient,
    memoText,
    erc20AmountRecipients: erc20AmountRecipientsRailgun,
    nftAmountRecipients: nftAmountRecipientsRailgun,
    broadcasterFeeERC20AmountRecipient:
      broadcasterFeeERC20AmountRecipientRailgun,
    sendWithPublicWallet,
    overallBatchMinGasPrice,
    transactionGasDetails,
  });
};

export const populateProvedUnshield = (
  txidVersion: TXIDVersion,
  networkName: NetworkName,
  railWalletID: string,
  erc20AmountRecipients: ERC20AmountRecipient[],
  nftAmountRecipients: NFTAmountRecipient[],
  selectedBroadcaster: Optional<SelectedBroadcaster>,
  broadcasterFeeERC20Amount: Optional<ERC20Amount>,
  sendWithPublicWallet: boolean,
  overallBatchMinGasPrice: Optional<bigint>,
  transactionGasDetails: TransactionGasDetails
): Promise<RailgunPopulateTransactionResponse> => {
  const erc20AmountRecipientsRailgun = createRailgunERC20AmountRecipients(
    erc20AmountRecipients
  );
  const broadcasterFeeERC20AmountRecipient =
    createBroadcasterFeeERC20AmountRecipient(
      selectedBroadcaster,
      broadcasterFeeERC20Amount
    );
  const broadcasterFeeERC20AmountRecipientRailgun =
    createRailgunERC20AmountRecipient(broadcasterFeeERC20AmountRecipient);
  const nftAmountRecipientsRailgun =
    createRailgunNFTAmountRecipients(nftAmountRecipients);

  return bridgeCall<
    PopulateProvedUnshieldParams,
    RailgunPopulateTransactionResponse
  >(BridgeCallEvent.PopulateProvedUnshield, {
    txidVersion,
    networkName,
    railWalletID,
    erc20AmountRecipients: erc20AmountRecipientsRailgun,
    nftAmountRecipients: nftAmountRecipientsRailgun,
    broadcasterFeeERC20AmountRecipient:
      broadcasterFeeERC20AmountRecipientRailgun,
    sendWithPublicWallet,
    overallBatchMinGasPrice,
    transactionGasDetails,
  });
};

export const populateProvedUnshieldBaseToken = async (
  txidVersion: TXIDVersion,
  networkName: NetworkName,
  railWalletID: string,
  erc20AmountRecipients: ERC20AmountRecipient[],
  _nftAmountRecipients: NFTAmountRecipient[],
  selectedBroadcaster: Optional<SelectedBroadcaster>,
  broadcasterFeeERC20Amount: Optional<ERC20Amount>,
  sendWithPublicWallet: boolean,
  overallBatchMinGasPrice: Optional<bigint>,
  transactionGasDetails: TransactionGasDetails
): Promise<RailgunPopulateTransactionResponse> => {
  if (erc20AmountRecipients.length > 1) {
    throw new Error(
      "You must unshield base token in a transaction by itself. Please remove other tokens from this transaction."
    );
  }
  const wrappedTokenAmountRailgun = createRailgunERC20Amount(
    erc20AmountRecipients[0]
  );
  if (!wrappedTokenAmountRailgun) {
    throw new Error("No token selected for unshielding.");
  }

  const broadcasterFeeERC20AmountRecipient =
    createBroadcasterFeeERC20AmountRecipient(
      selectedBroadcaster,
      broadcasterFeeERC20Amount
    );
  const broadcasterFeeERC20AmountRecipientRailgun =
    createRailgunERC20AmountRecipient(broadcasterFeeERC20AmountRecipient);

  const publicWalletAddress = erc20AmountRecipients[0].recipientAddress;

  return bridgeCall<
    PopulateProvedUnshieldBaseTokenParams,
    RailgunPopulateTransactionResponse
  >(BridgeCallEvent.PopulateProvedUnshieldBaseToken, {
    txidVersion,
    networkName,
    publicWalletAddress,
    railWalletID,
    wrappedTokenAmount: wrappedTokenAmountRailgun,
    broadcasterFeeERC20AmountRecipient:
      broadcasterFeeERC20AmountRecipientRailgun,
    sendWithPublicWallet,
    overallBatchMinGasPrice,
    transactionGasDetails,
  });
};

export const populateProvedUnshieldToOrigin = (
  txidVersion: TXIDVersion,
  networkName: NetworkName,
  railWalletID: string,
  erc20AmountRecipients: ERC20AmountRecipient[],
  nftAmountRecipients: NFTAmountRecipient[],
  transactionGasDetails: TransactionGasDetails
): Promise<RailgunPopulateTransactionResponse> => {
  const erc20AmountRecipientsRailgun = createRailgunERC20AmountRecipients(
    erc20AmountRecipients
  );
  const nftAmountRecipientsRailgun =
    createRailgunNFTAmountRecipients(nftAmountRecipients);

  return bridgeCall<
    PopulateProvedUnshieldToOriginParams,
    RailgunPopulateTransactionResponse
  >(BridgeCallEvent.PopulateProvedUnshieldToOrigin, {
    txidVersion,
    networkName,
    railWalletID,
    erc20AmountRecipients: erc20AmountRecipientsRailgun,
    nftAmountRecipients: nftAmountRecipientsRailgun,
    transactionGasDetails,
  });
};

export const getERC20AndNFTAmountRecipientsForUnshieldToOrigin = (
  txidVersion: TXIDVersion,
  networkName: NetworkName,
  railgunWalletID: string,
  originalShieldTxid: string
): Promise<{
  erc20AmountRecipients: RailgunERC20AmountRecipient[];
  nftAmountRecipients: RailgunNFTAmountRecipient[];
}> => {
  return bridgeCall<
    GetERC20AndNFTAmountRecipientsForUnshieldToOriginParams,
    {
      erc20AmountRecipients: RailgunERC20AmountRecipient[];
      nftAmountRecipients: RailgunNFTAmountRecipient[];
    }
  >(BridgeCallEvent.GetERC20AndNFTAmountRecipientsForUnshieldToOrigin, {
    txidVersion,
    networkName,
    railgunWalletID,
    originalShieldTxid,
  });
};

export const gasEstimateForUnprovenTransfer = async (
  txidVersion: TXIDVersion,
  networkName: NetworkName,
  railWalletID: string,
  encryptionKey: string,
  memoText: Optional<string>,
  erc20AmountRecipients: ERC20AmountRecipient[],
  nftAmountRecipients: NFTAmountRecipient[],
  originalGasDetails: TransactionGasDetails,
  feeTokenDetails: Optional<FeeTokenDetails>,
  sendWithPublicWallet: boolean
): Promise<bigint> => {
  if (!isDefined(originalGasDetails)) {
    throw new Error("Requires original gas details");
  }
  const erc20AmountRecipientsRailgun = createRailgunERC20AmountRecipients(
    erc20AmountRecipients
  );
  const nftAmountRecipientsRailgun =
    createRailgunNFTAmountRecipients(nftAmountRecipients);
  const { gasEstimate } = await bridgeCall<
    GasEstimateForUnprovenTransferParams,
    RailgunTransactionGasEstimateResponse
  >(BridgeCallEvent.GasEstimateForUnprovenTransfer, {
    txidVersion,
    networkName,
    railWalletID,
    memoText,
    encryptionKey,
    erc20AmountRecipients: erc20AmountRecipientsRailgun,
    nftAmountRecipients: nftAmountRecipientsRailgun,
    originalGasDetails,
    feeTokenDetails,
    sendWithPublicWallet,
  });
  logDev(`Transfer gas estimate (dummy): ${gasEstimate}`);
  return gasEstimate;
};

export const gasEstimateForUnprovenUnshield = async (
  txidVersion: TXIDVersion,
  networkName: NetworkName,
  railWalletID: string,
  encryptionKey: string,
  _memoText: Optional<string>,
  erc20AmountRecipients: ERC20AmountRecipient[],
  nftAmountRecipients: NFTAmountRecipient[],
  originalGasDetails: TransactionGasDetails,
  feeTokenDetails: Optional<FeeTokenDetails>,
  sendWithPublicWallet: boolean
): Promise<bigint> => {
  if (!isDefined(originalGasDetails)) {
    throw new Error("Requires original gas details");
  }
  const erc20AmountRecipientsRailgun = createRailgunERC20AmountRecipients(
    erc20AmountRecipients
  );
  const nftAmountRecipientsRailgun =
    createRailgunNFTAmountRecipients(nftAmountRecipients);
  const { gasEstimate } = await bridgeCall<
    GasEstimateForUnprovenUnshieldParams,
    RailgunTransactionGasEstimateResponse
  >(BridgeCallEvent.GasEstimateForUnprovenUnshield, {
    txidVersion,
    networkName,
    railWalletID,
    encryptionKey,
    erc20AmountRecipients: erc20AmountRecipientsRailgun,
    nftAmountRecipients: nftAmountRecipientsRailgun,
    originalGasDetails,
    feeTokenDetails,
    sendWithPublicWallet,
  });
  return gasEstimate;
};

export const gasEstimateForUnprovenUnshieldToOrigin = async (
  originalShieldTxid: string,
  txidVersion: TXIDVersion,
  networkName: NetworkName,
  railWalletID: string,
  encryptionKey: string,
  erc20AmountRecipients: ERC20AmountRecipient[],
  nftAmountRecipients: NFTAmountRecipient[]
): Promise<bigint> => {
  const erc20AmountRecipientsRailgun = createRailgunERC20AmountRecipients(
    erc20AmountRecipients
  );
  const nftAmountRecipientsRailgun =
    createRailgunNFTAmountRecipients(nftAmountRecipients);
  const { gasEstimate } = await bridgeCall<
    GasEstimateForUnprovenUnshieldToOriginParams,
    RailgunTransactionGasEstimateResponse
  >(BridgeCallEvent.GasEstimateForUnprovenUnshieldToOrigin, {
    originalShieldTxid,
    txidVersion,
    networkName,
    railWalletID,
    encryptionKey,
    erc20AmountRecipients: erc20AmountRecipientsRailgun,
    nftAmountRecipients: nftAmountRecipientsRailgun,
  });
  return gasEstimate;
};

export const gasEstimateForUnprovenUnshieldBaseToken = async (
  txidVersion: TXIDVersion,
  networkName: NetworkName,
  railWalletID: string,
  encryptionKey: string,
  _memoText: Optional<string>,
  erc20AmountRecipients: ERC20AmountRecipient[],
  _nftAmountRecipients: NFTAmountRecipient[],
  originalGasDetails: TransactionGasDetails,
  feeTokenDetails: Optional<FeeTokenDetails>,
  sendWithPublicWallet: boolean
): Promise<bigint> => {
  const wrappedTokenAmountRailgun = createRailgunERC20Amount(
    erc20AmountRecipients[0]
  );
  if (!wrappedTokenAmountRailgun) {
    throw new Error("No token selected for unshielding.");
  }
  if (!isDefined(originalGasDetails)) {
    throw new Error("Requires original gas details");
  }

  const publicWalletAddress = erc20AmountRecipients[0].recipientAddress;

  const { gasEstimate } = await bridgeCall<
    GasEstimateForUnprovenUnshieldBaseTokenParams,
    RailgunTransactionGasEstimateResponse
  >(BridgeCallEvent.GasEstimateForUnprovenUnshieldBaseToken, {
    txidVersion,
    networkName,
    publicWalletAddress,
    railWalletID,
    encryptionKey,
    wrappedTokenAmount: wrappedTokenAmountRailgun,
    originalGasDetails,
    feeTokenDetails,
    sendWithPublicWallet,
  });
  return gasEstimate;
};
