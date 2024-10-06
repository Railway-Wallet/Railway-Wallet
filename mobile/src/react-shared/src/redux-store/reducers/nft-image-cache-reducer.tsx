import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type NFTImageSrc = {
  imageURL: string;
  src: string;
};

export type NFTsImageCacheState = MapType<string>;

const initialState = {} as NFTsImageCacheState;

const slice = createSlice({
  name: "nft-image-cache",
  initialState,
  reducers: {
    cacheNFTImages(state, action: PayloadAction<NFTImageSrc[]>) {
      const nftImageSrcs = action.payload;

      nftImageSrcs.forEach(({ imageURL, src }) => {
        state[imageURL] = src;
      });
    },
  },
});

export const { cacheNFTImages } = slice.actions;
export const nftImageCacheReducer = slice.reducer;
