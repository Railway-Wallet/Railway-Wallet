import { isDefined } from '@railgun-community/shared-models';
import { useCallback, useState } from 'react';
import axios from 'axios';
import { ImageNFTLoading, ImageNFTMissing } from '@assets/img/imagesWeb';
import { logDevError, NFTImageCache, useReduxSelector } from '@react-shared';

const DATA_URI_PREFIX = 'data:';

const backgroundImageFromSrc = (src: string) => {
  return `url(${src})`;
};

export const useLoadNFTImage = (imageURL: Optional<string>) => {
  const { network } = useReduxSelector('network');

  const networkName = network.current.name;

  const LOADING_IMAGE = ImageNFTLoading();
  const MISSING_IMAGE = ImageNFTMissing();

  const [imageSrc, setImageSrc] = useState(LOADING_IMAGE);
  const [backgroundImage, setBackgroundImage] = useState(
    backgroundImageFromSrc(LOADING_IMAGE),
  );

  const updateImageSrc = useCallback((src: string) => {
    setImageSrc(src);
    setBackgroundImage(backgroundImageFromSrc(src));
  }, []);

  const loadImage = useCallback(async () => {
    try {
      if (!isDefined(imageURL)) {
        return;
      }
      if (imageURL.startsWith(DATA_URI_PREFIX)) {
        const dataURI = imageURL;
        updateImageSrc(dataURI);
        return;
      }
      const cachedSrc = await NFTImageCache.getCachedSrc(networkName, imageURL);
      if (isDefined(cachedSrc)) {
        updateImageSrc(cachedSrc);
        return;
      }
      const result = await axios(imageURL, {
        headers: {},
        responseType: 'arraybuffer',
      });
      if (!isDefined(result)) {
        throw new Error('No image downloaded');
      }
      const uint8Array = new Uint8Array(result.data);
      const base64 = Buffer.from(uint8Array).toString('base64');
      const src = `data:image;base64,${base64}`;
      await NFTImageCache.cacheImageSrc(networkName, imageURL, src);
      updateImageSrc(src);
    } catch (err) {
      logDevError(err);
      updateImageSrc(MISSING_IMAGE);
    }
  }, [MISSING_IMAGE, imageURL, networkName, updateImageSrc]);

  return { imageSrc, backgroundImage, loadImage };
};
