import {
  isDefined,
  NFTAmount,
  RailgunWalletBalanceBucket,
} from "@railgun-community/shared-models";
import { useCallback } from "react";
import { FrontendWallet } from "../../models/wallet";
import { formatTokenSubID } from "../../utils/nft";
import { useReduxSelector } from "../hooks-redux";
import { NFTData, useNFTBalances } from "./useNFTBalances";

export const useFilteredNFTBalances = (
  searchText: string,
  wallet: Optional<FrontendWallet>,
  balanceBucketFilter: RailgunWalletBalanceBucket[]
): { filteredNFTBalances: Optional<NFTData> } => {
  const { nftsMetadata } = useReduxSelector("nftsMetadata");

  const { nftBalances } = useNFTBalances(wallet, balanceBucketFilter);

  const lowerCaseSearchText = searchText.toLowerCase();

  const filterNFTs = useCallback(
    (nftAmounts: Optional<NFTAmount[]>) => {
      if (!nftAmounts) {
        return undefined;
      }

      return nftAmounts.filter((nftAmount) => {
        if (!searchText.length) {
          return true;
        }
        if (nftAmount.nftAddress.toLowerCase() === lowerCaseSearchText) {
          return true;
        }
        const formattedTokenSubID = formatTokenSubID(nftAmount.tokenSubID);
        const metadata =
          nftsMetadata.forNFT[nftAmount.nftAddress]?.forSubID[
            formattedTokenSubID
          ];
        if (!isDefined(metadata)) {
          return false;
        }

        if (
          metadata.name?.toLowerCase().includes(lowerCaseSearchText) === true
        ) {
          return true;
        }
        if (
          metadata.description?.toLowerCase().includes(lowerCaseSearchText) ===
          true
        ) {
          return true;
        }

        return false;
      });
    },
    [lowerCaseSearchText, nftsMetadata, searchText]
  );

  if (!nftBalances) {
    return { filteredNFTBalances: undefined };
  }

  const filteredNFTBalances = {
    public: filterNFTs(nftBalances.public),
    shielded: filterNFTs(nftBalances.shielded),
  };

  return { filteredNFTBalances };
};
