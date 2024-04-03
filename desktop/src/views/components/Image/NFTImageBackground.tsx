import React, { useEffect } from 'react';
import { useLoadNFTImage } from '@hooks/useLoadNFTImage';

type Props = {
  imageURL: Optional<string>;
  className: string;
};

export const NFTImageBackground: React.FC<Props> = ({
  imageURL,
  className,
}) => {
  const { backgroundImage, loadImage } = useLoadNFTImage(imageURL);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    loadImage();
  }, [loadImage]);

  return <div className={className} style={{ backgroundImage }} />;
};
