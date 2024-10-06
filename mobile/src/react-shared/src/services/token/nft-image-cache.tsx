import { isDefined, NetworkName } from "@railgun-community/shared-models";
import { SharedConstants } from "../../config/shared-constants";
import { StorageService } from "../storage";

type NFTImageSrc = {
  imageURL: string;
  src: string;
};

export class NFTImageCache {
  static async cacheImageSrc(
    networkName: NetworkName,
    imageURL: string,
    src: string
  ): Promise<void> {
    await this.cacheNFTImages(networkName, [{ imageURL, src }]);
  }

  static async getCachedSrc(
    networkName: NetworkName,
    imageURL: string
  ): Promise<Optional<string>> {
    const cache = await this.getCachedImages(networkName);
    return cache[imageURL];
  }

  private static imageCacheKey(networkName: NetworkName): string {
    return `${SharedConstants.NFT_IMAGE_CACHE}|${networkName}`;
  }

  private static async getCachedImages(
    networkName: NetworkName
  ): Promise<MapType<string>> {
    const key = this.imageCacheKey(networkName);
    const value = await StorageService.getItem(key);
    if (isDefined(value)) {
      return JSON.parse(value) as MapType<string>;
    }
    return {};
  }

  private static async cacheNFTImages(
    networkName: NetworkName,
    nftImageSrcs: NFTImageSrc[]
  ): Promise<void> {
    const cache = await this.getCachedImages(networkName);
    nftImageSrcs.forEach(({ imageURL, src }) => {
      cache[imageURL] = src;
    });
    await StorageService.setItem(
      this.imageCacheKey(networkName),
      JSON.stringify(cache)
    );
  }
}
