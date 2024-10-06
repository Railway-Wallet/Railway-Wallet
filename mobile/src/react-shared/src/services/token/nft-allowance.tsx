import {
  isDefined,
  NetworkName,
  NFTAmount,
  NFTTokenType,
  sanitizeError,
} from "@railgun-community/shared-models";
import { ToastType } from "../../models/toast";
import { showImmediateToast } from "../../redux-store/reducers/toast-reducer";
import { AppDispatch } from "../../redux-store/store";
import { logDevError } from "../../utils";
import { erc721Contract, erc1155Contract } from "../contract/contract";
import { ProviderService } from "../providers/provider-service";

const getERC721CollectionApprovedForSpender = async (
  networkName: NetworkName,
  walletAddress: string,
  spender: string,
  nftAmount: NFTAmount
) => {
  const provider = await ProviderService.getProvider(networkName);
  const erc721 = erc721Contract(nftAmount.nftAddress, provider);
  return erc721.isApprovedForAll(walletAddress, spender);
};

const getERC1155CollectionApprovedForSpender = async (
  networkName: NetworkName,
  walletAddress: string,
  spender: string,
  nftAmount: NFTAmount
) => {
  const provider = await ProviderService.getProvider(networkName);
  const erc1155 = erc1155Contract(nftAmount.nftAddress, provider);
  return erc1155.isApprovedForAll(walletAddress, spender);
};

export const getNFTCollectionApprovedForSpender = async (
  dispatch: AppDispatch,
  networkName: NetworkName,
  walletAddress: Optional<string>,
  nftAmount: Optional<NFTAmount>,
  spender: string
): Promise<boolean> => {
  if (!isDefined(walletAddress)) {
    return false;
  }
  if (!nftAmount) {
    return false;
  }
  try {
    switch (nftAmount.nftTokenType) {
      case NFTTokenType.ERC721: {
        return getERC721CollectionApprovedForSpender(
          networkName,
          walletAddress,
          spender,
          nftAmount
        );
      }
      case NFTTokenType.ERC1155: {
        return getERC1155CollectionApprovedForSpender(
          networkName,
          walletAddress,
          spender,
          nftAmount
        );
      }
    }
  } catch (err) {
    logDevError(
      new Error("Error getting spender allowance for NFT collection", {
        cause: err,
      })
    );

    if (!(err instanceof Error)) {
      throw err;
    }
    if (err.message.includes("provider destroyed")) return false;
    const error = sanitizeError(err);
    dispatch(
      showImmediateToast({
        message: `Error getting spender allowance for NFT collection ${nftAmount.nftAddress}: ${error.message}`,
        type: ToastType.Error,
      })
    );
    return false;
  }
};
