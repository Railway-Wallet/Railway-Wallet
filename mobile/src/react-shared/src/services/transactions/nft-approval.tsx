import {
  NetworkName,
  NFTAmount,
  NFTTokenType,
  TransactionGasDetails,
} from "@railgun-community/shared-models";
import { ContractTransaction, TransactionResponse } from "ethers";
import { erc721Contract, erc1155Contract } from "../contract/contract";
import { ProviderService } from "../providers/provider-service";
import { executeTransaction } from "./execute-service";
import { getGasEstimate } from "./gas-estimate";

const createERC721ApproveAll = async (
  networkName: NetworkName,
  spender: string,
  nftAmount: NFTAmount
): Promise<ContractTransaction> => {
  const provider = await ProviderService.getProvider(networkName);
  const erc721 = erc721Contract(nftAmount.nftAddress, provider);
  return erc721.setApprovalForAll.populateTransaction(spender, true);
};

const createERC1155ApproveAll = async (
  networkName: NetworkName,
  spender: string,
  nftAmount: NFTAmount
): Promise<ContractTransaction> => {
  const provider = await ProviderService.getProvider(networkName);
  const erc1155 = erc1155Contract(nftAmount.nftAddress, provider);
  return erc1155.setApprovalForAll.populateTransaction(spender, true);
};

const createNFTApproveAll = (
  networkName: NetworkName,
  spender: string,
  nftAmount: NFTAmount
): Promise<ContractTransaction> => {
  switch (nftAmount.nftTokenType) {
    case NFTTokenType.ERC721: {
      return createERC721ApproveAll(networkName, spender, nftAmount);
    }
    case NFTTokenType.ERC1155: {
      return createERC1155ApproveAll(networkName, spender, nftAmount);
    }
  }
};

export const getNFTApproveAllGasEstimate = async (
  networkName: NetworkName,
  spender: string,
  fromWalletAddress: string,
  nftAmount: NFTAmount
): Promise<bigint> => {
  const nftApproveAll = await createNFTApproveAll(
    networkName,
    spender,
    nftAmount
  );
  return getGasEstimate(networkName, nftApproveAll, fromWalletAddress);
};

export const executeNFTApproveAll = async (
  pKey: string,
  networkName: NetworkName,
  spender: string,
  nftAmount: NFTAmount,
  gasDetails?: TransactionGasDetails,
  customNonce?: number,
  overrideGasLimitForCancel?: bigint
): Promise<TransactionResponse> => {
  const nftApproveAll = await createNFTApproveAll(
    networkName,
    spender,
    nftAmount
  );
  return executeTransaction(
    pKey,
    networkName,
    nftApproveAll,
    gasDetails,
    customNonce,
    overrideGasLimitForCancel
  );
};
