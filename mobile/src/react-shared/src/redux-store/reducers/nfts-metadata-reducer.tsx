import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { NFTAmountAndMetadata, NFTMetadata } from "../../models/nft";
import { formatTokenSubID } from "../../utils/nft";

type NFTsMetadataMap = {
  forSubID: MapType<NFTMetadata>;
};

export type NFTsMetadataState = {
  forNFT: MapType<NFTsMetadataMap>;
};

const initialState = {
  forNFT: {},
} as NFTsMetadataState;

const slice = createSlice({
  name: "nfts-metadata",
  initialState,
  reducers: {
    addNFTsMetadata(state, action: PayloadAction<NFTAmountAndMetadata[]>) {
      const nftsAndMetadata = action.payload;

      nftsAndMetadata.forEach(({ nftAmount, metadata }) => {
        state.forNFT[nftAmount.nftAddress] ??= {
          forSubID: {},
        };
        const nftState = state.forNFT[nftAmount.nftAddress];
        if (!nftState) {
          return;
        }
        const formattedTokenSubID = formatTokenSubID(nftAmount.tokenSubID);
        nftState.forSubID[formattedTokenSubID] = metadata;
      });
    },
  },
});

export const { addNFTsMetadata } = slice.actions;
export const nftsMetadataReducer = slice.reducer;
