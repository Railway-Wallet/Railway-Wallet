import { NFTAmount } from '@railgun-community/shared-models';
import { NFTImageBackground } from '@components/Image/NFTImageBackground';
import { Text } from '@components/Text/Text';
import { useNFTImageURLs, useNFTMetadata } from '@react-shared';
import styles from './SelectedNFTHighlight.module.scss';

type Props = {
  nftAmount: NFTAmount;
  onClick: () => void;
};

export const SelectedNFTHighlight = ({ nftAmount, onClick }: Props) => {
  const { metadata } = useNFTMetadata(nftAmount);
  const { imageURL } = useNFTImageURLs(metadata);

  return (
    <div className={styles.container} onClick={onClick}>
      <div className={styles.imageWrapper}>
        <NFTImageBackground imageURL={imageURL} className={styles.image} />
      </div>
      <div className={styles.textWrapper}>
        <Text className={styles.title}>{metadata?.name}</Text>
      </div>
    </div>
  );
};
