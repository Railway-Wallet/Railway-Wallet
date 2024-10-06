import { isDefined } from "@railgun-community/shared-models";
import { NFTMetadata } from "../../models/nft";
import { store } from "../../redux-store/store";

const IPFS_PREFIX = "ipfs://";
const DATA_URI_PREFIX = "data:";

const proxyURL = (url?: string): Optional<string> => {
  if (!isDefined(url) || url === "") {
    return undefined;
  }
  const remoteConfig = store.getState().remoteConfig.current;
  if (!isDefined(remoteConfig)) {
    throw new Error("Config not available.");
  }
  return `${remoteConfig.proxyNftsApiUrl}/${url}`;
};

const getNFTImageURL = (url?: string) => {
  if (isDefined(url) && url.startsWith(IPFS_PREFIX)) {
    const cid = url.split(IPFS_PREFIX)[1];
    return `https://ipfs-lb.b-cdn.net/ipfs/${cid}`;
  }
  if (isDefined(url) && url.startsWith(DATA_URI_PREFIX)) {
    return url;
  }
  return proxyURL(url);
};

export const useNFTImageURLs = (metadata: Optional<NFTMetadata>) => {
  const imageURL = getNFTImageURL(metadata?.image);
  const thumbnailURL = getNFTImageURL(metadata?.thumbnail);
  return {
    imageURL,
    thumbnailURL: thumbnailURL ?? imageURL,
  };
};
