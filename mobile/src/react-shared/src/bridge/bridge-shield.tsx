import {
  NETWORK_CONFIG,
  NetworkName,
  NFTAmountRecipient,
  RailgunPopulateTransactionResponse,
  RailgunTransactionGasEstimateResponse,
  TransactionGasDetails,
  TXIDVersion,
} from "@railgun-community/shared-models";
import { ERC20AmountRecipient } from "../models";
import {
  BridgeCallEvent,
  GasEstimateForShieldBaseTokenParams,
  GasEstimateForShieldParams,
  PopulateShieldBaseTokenParams,
  PopulateShieldParams,
} from "../models/bridge";
import {
  compareTokenAddress,
  createRailgunERC20Amount,
  createRailgunERC20AmountRecipients,
  createRailgunNFTAmountRecipients,
} from "../utils/tokens";
import { bridgeCall } from "./ipc";

export const getShieldPrivateKeySignatureMessage = (): Promise<string> => {
  return bridgeCall<void, string>(
    BridgeCallEvent.GetShieldPrivateKeySignatureMessage,
    undefined
  );
};

export const populateShield = (
  txidVersion: TXIDVersion,
  networkName: NetworkName,
  shieldPrivateKey: string,
  erc20AmountRecipients: ERC20AmountRecipient[],
  nftAmountRecipients: NFTAmountRecipient[],
  transactionGasDetails: TransactionGasDetails
): Promise<RailgunPopulateTransactionResponse> => {
  const erc20AmountRecipientsSerialized = createRailgunERC20AmountRecipients(
    erc20AmountRecipients
  );
  const nftAmountRecipientsRailgun =
    createRailgunNFTAmountRecipients(nftAmountRecipients);

  return bridgeCall<PopulateShieldParams, RailgunPopulateTransactionResponse>(
    BridgeCallEvent.PopulateShield,
    {
      txidVersion,
      networkName,
      shieldPrivateKey,
      erc20AmountRecipients: erc20AmountRecipientsSerialized,
      nftAmountRecipients: nftAmountRecipientsRailgun,
      transactionGasDetails,
    }
  );
};

export const populateShieldBaseToken = async (
  txidVersion: TXIDVersion,
  networkName: NetworkName,
  shieldPrivateKey: string,
  erc20AmountRecipients: ERC20AmountRecipient[],
  _nftAmountRecipients: NFTAmountRecipient[],
  transactionGasDetails: TransactionGasDetails
): Promise<RailgunPopulateTransactionResponse> => {
  if (erc20AmountRecipients.length > 1) {
    throw new Error(
      "You must shield base token in a transaction by itself. Please remove other tokens from this transaction."
    );
  }
  if (
    !compareTokenAddress(
      erc20AmountRecipients[0].token.address,
      NETWORK_CONFIG[networkName].baseToken.wrappedAddress
    )
  ) {
    throw new Error(
      "Incorrect address for wrapped base token. Please reset tokens to defaults through Wallet Settings."
    );
  }
  const wrappedTokenAmountSerialized = createRailgunERC20Amount(
    erc20AmountRecipients[0]
  );
  if (!wrappedTokenAmountSerialized) {
    throw new Error("No token selected for shielding.");
  }

  const railgunAddress = erc20AmountRecipients[0].recipientAddress;

  return bridgeCall<
    PopulateShieldBaseTokenParams,
    RailgunPopulateTransactionResponse
  >(BridgeCallEvent.PopulateShieldBaseToken, {
    txidVersion,
    networkName,
    railgunAddress,
    shieldPrivateKey,
    wrappedTokenAmount: wrappedTokenAmountSerialized,
    transactionGasDetails,
  });
};

export const gasEstimateForShield = async (
  txidVersion: TXIDVersion,
  networkName: NetworkName,
  fromWalletAddress: string,
  shieldPrivateKey: string,
  erc20AmountRecipients: ERC20AmountRecipient[],
  nftAmountRecipients: NFTAmountRecipient[]
): Promise<bigint> => {
  const erc20AmountRecipientsSerialized = createRailgunERC20AmountRecipients(
    erc20AmountRecipients
  );
  const nftAmountRecipientsRailgun =
    createRailgunNFTAmountRecipients(nftAmountRecipients);
  const { gasEstimate } = await bridgeCall<
    GasEstimateForShieldParams,
    RailgunTransactionGasEstimateResponse
  >(BridgeCallEvent.GasEstimateForShield, {
    txidVersion,
    networkName,
    fromWalletAddress,
    shieldPrivateKey,
    erc20AmountRecipients: erc20AmountRecipientsSerialized,
    nftAmountRecipients: nftAmountRecipientsRailgun,
  });

  return gasEstimate;
};

export const gasEstimateForShieldBaseToken = async (
  txidVersion: TXIDVersion,
  networkName: NetworkName,
  fromWalletAddress: string,
  shieldPrivateKey: string,
  erc20AmountRecipients: ERC20AmountRecipient[]
): Promise<bigint> => {
  if (erc20AmountRecipients.length > 1) {
    throw new Error(
      "You must shield base token in a transaction by itself. Please remove other tokens from this transaction."
    );
  }
  if (
    !compareTokenAddress(
      erc20AmountRecipients[0].token.address,
      NETWORK_CONFIG[networkName].baseToken.wrappedAddress
    )
  ) {
    if (networkName === NetworkName.EthereumRopsten_DEPRECATED) {
      throw new Error(
        "Incorrect address for wrapped base token (patched issue on Ropsten). Please reset tokens to defaults through Wallet Settings to resolve."
      );
    }
    throw new Error(
      "Incorrect address for wrapped base token. Please reset tokens to defaults through Wallet Settings."
    );
  }
  const wrappedTokenAmountSerialized = createRailgunERC20Amount(
    erc20AmountRecipients[0]
  );
  if (!wrappedTokenAmountSerialized) {
    throw new Error("No token selected for shielding.");
  }

  const railgunAddress = erc20AmountRecipients[0].recipientAddress;

  const { gasEstimate } = await bridgeCall<
    GasEstimateForShieldBaseTokenParams,
    RailgunTransactionGasEstimateResponse
  >(BridgeCallEvent.GasEstimateForShieldBaseToken, {
    txidVersion,
    networkName,
    railgunAddress,
    fromWalletAddress,
    shieldPrivateKey,
    wrappedTokenAmount: wrappedTokenAmountSerialized,
  });
  return gasEstimate;
};
