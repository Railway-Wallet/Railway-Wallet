import {
  NetworkName,
  NFTAmountRecipient,
  NFTTokenType,
  TransactionGasDetails,
} from "@railgun-community/shared-models";
import { ContractTransaction, TransactionResponse } from "ethers";
import { erc721Contract, erc1155Contract } from "../contract/contract";
import { ProviderService } from "../providers/provider-service";
import { executeTransaction } from "./execute-service";
import { getGasEstimate } from "./gas-estimate";

const createERC721Transfer = async (
  networkName: NetworkName,
  fromWalletAddress: string,
  nftAmountRecipient: NFTAmountRecipient
): Promise<ContractTransaction> => {
  const provider = await ProviderService.getProvider(networkName);
  const erc721 = erc721Contract(nftAmountRecipient.nftAddress, provider);
  return erc721.transferFrom.populateTransaction(
    fromWalletAddress,
    nftAmountRecipient.recipientAddress,
    nftAmountRecipient.tokenSubID
  );
};

const createERC1155Transfer = async (
  networkName: NetworkName,
  fromWalletAddress: string,
  nftAmountRecipient: NFTAmountRecipient,
  data?: string
): Promise<ContractTransaction> => {
  const provider = await ProviderService.getProvider(networkName);
  const erc1155 = erc1155Contract(nftAmountRecipient.nftAddress, provider);
  return erc1155.safeTransferFrom.populateTransaction(
    fromWalletAddress,
    nftAmountRecipient.recipientAddress,
    nftAmountRecipient.tokenSubID,
    BigInt(nftAmountRecipient.amountString),
    data ?? ""
  );
};

export const getNFTTransferGasEstimate = async (
  networkName: NetworkName,
  fromWalletAddress: string,
  nftAmountRecipient: NFTAmountRecipient
): Promise<bigint> => {
  let nftTransfer: ContractTransaction;
  switch (nftAmountRecipient.nftTokenType) {
    case NFTTokenType.ERC721: {
      nftTransfer = await createERC721Transfer(
        networkName,
        fromWalletAddress,
        nftAmountRecipient
      );
      break;
    }
    case NFTTokenType.ERC1155: {
      nftTransfer = await createERC1155Transfer(
        networkName,
        fromWalletAddress,
        nftAmountRecipient
      );
      break;
    }
  }

  return getGasEstimate(networkName, nftTransfer, fromWalletAddress);
};

export const executeNFTTransfer = async (
  pKey: string,
  networkName: NetworkName,
  fromWalletAddress: string,
  nftAmountRecipient: NFTAmountRecipient,
  gasDetails?: TransactionGasDetails,
  customNonce?: number,
  overrideGasLimitForCancel?: bigint
): Promise<TransactionResponse> => {
  let nftTransfer: ContractTransaction;
  switch (nftAmountRecipient.nftTokenType) {
    case NFTTokenType.ERC721: {
      nftTransfer = await createERC721Transfer(
        networkName,
        fromWalletAddress,
        nftAmountRecipient
      );
      break;
    }
    case NFTTokenType.ERC1155: {
      nftTransfer = await createERC1155Transfer(
        networkName,
        fromWalletAddress,
        nftAmountRecipient
      );
      break;
    }
  }

  return executeTransaction(
    pKey,
    networkName,
    nftTransfer,
    gasDetails,
    customNonce,
    overrideGasLimitForCancel
  );
};
