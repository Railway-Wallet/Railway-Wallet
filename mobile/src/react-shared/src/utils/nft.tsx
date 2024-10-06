import {
  isDefined,
  NFTAmount,
  NFTTokenType,
} from "@railgun-community/shared-models";
import { NFTMetadata } from "../models";
import { store } from "../redux-store/store";

const nameForNFTTokenType = (nftTokenType: NFTTokenType) => {
  switch (nftTokenType) {
    case NFTTokenType.ERC721:
      return "ERC-721";
    case NFTTokenType.ERC1155:
      return "ERC-1155";
  }
};

export const descriptionForNFTAmount = (nftAmount: NFTAmount) => {
  return `${nameForNFTTokenType(nftAmount.nftTokenType)}`;
};

export const formatTokenSubID = (tokenId: string): string => {
  return BigInt(tokenId).toString();
};

export const getAvailableMetadataForNFT = (
  nftAmount: NFTAmount
): Optional<NFTMetadata> => {
  const { nftsMetadata } = store.getState();

  const { nftAddress, tokenSubID } = nftAmount;
  const formattedTokenSubID = formatTokenSubID(tokenSubID);

  const metadata =
    nftsMetadata.forNFT[nftAddress]?.forSubID[formattedTokenSubID];
  return metadata;
};

const formatNFTAmountString = (nftAmount: NFTAmount): Optional<string> => {
  switch (nftAmount.nftTokenType) {
    case NFTTokenType.ERC721:
      return undefined;
    case NFTTokenType.ERC1155:
      return BigInt(nftAmount.amountString).toString();
  }
};

export const getNFTAmountDisplayName = (
  nftAmount: NFTAmount,
  showAmountString = true,
  skipMetadata = false
) => {
  const formattedAmountString = formatNFTAmountString(nftAmount);
  const formattedAmountStringWithSpace =
    isDefined(formattedAmountString) && showAmountString
      ? formattedAmountString + " "
      : "";

  if (!skipMetadata) {
    const metadata = getAvailableMetadataForNFT(nftAmount);
    if (metadata) {
      return `NFT: ${formattedAmountStringWithSpace}${metadata.name ?? ""}`;
    }
  }
  const tokenTypeName = nameForNFTTokenType(nftAmount.nftTokenType);

  const tokenSubIDNumberFormat = BigInt(nftAmount.tokenSubID).toString();
  return `NFT ${tokenTypeName}: ${formattedAmountStringWithSpace}${nftAmount.nftAddress} (${tokenSubIDNumberFormat})`;
};
