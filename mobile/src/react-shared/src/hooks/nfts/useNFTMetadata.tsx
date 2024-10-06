import { NFTAmount } from "@railgun-community/shared-models";
import { NFTMetadata } from "../../models/nft";
import { formatTokenSubID } from "../../utils/nft";
import { useReduxSelector } from "../hooks-redux";

export const useNFTMetadata = (
  nftAmount: Optional<NFTAmount>
): { metadata: Optional<NFTMetadata> } => {
  const { nftsMetadata } = useReduxSelector("nftsMetadata");

  if (!nftAmount) {
    return { metadata: undefined };
  }

  const formattedTokenSubID = formatTokenSubID(nftAmount.tokenSubID);

  const metadata =
    nftsMetadata.forNFT[nftAmount.nftAddress]?.forSubID[formattedTokenSubID];

  return {
    metadata,
  };
};
