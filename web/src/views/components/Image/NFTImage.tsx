import React from 'react';
import { useLoadNFTImage } from '@hooks/useLoadNFTImage';

type Props = {
  imageURL: Optional<string>;
  className: string;
};

export const NFTImage: React.FC<Props> = ({ imageURL, className }) => {
  const { imageSrc, loadImage } = useLoadNFTImage(imageURL);

  return (
    <img src={imageSrc} className={className} alt="NFT" onLoad={loadImage} />
  );
};
