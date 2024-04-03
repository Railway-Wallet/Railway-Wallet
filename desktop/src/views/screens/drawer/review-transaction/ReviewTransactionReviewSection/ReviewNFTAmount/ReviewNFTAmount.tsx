import { NFTAmount, NFTTokenType } from '@railgun-community/shared-models';
import React from 'react';
import { NFTImage } from '@components/Image/NFTImage';
import { Text } from '@components/Text/Text';
import { useNFTImageURLs, useNFTMetadata } from '@react-shared';
import styles from '../ReviewTransactionReviewSection.module.scss';

type Props = {
  nftAmount: NFTAmount;
};

export const ReviewNFTAmount: React.FC<Props> = ({ nftAmount }) => {
  const { metadata } = useNFTMetadata(nftAmount);
  const { thumbnailURL } = useNFTImageURLs(metadata);

  const showTokenAmount = nftAmount.nftTokenType === NFTTokenType.ERC1155;

  return (
    <>
      <div className={styles.reviewTokenContainer}>
        <NFTImage imageURL={thumbnailURL} className={styles.nftImage} />
        <Text className={styles.tokenText}>
          {showTokenAmount && (
            <span className={styles.tokenAmount}>
              {BigInt(nftAmount.amountString).toString()}
            </span>
          )}
          <div className={styles.nftTexts}>
            <span className={styles.tokenAmount}>
              {metadata?.collectionName}
            </span>
            <span className={styles.tokenSymbol}>{metadata?.name}</span>
          </div>
        </Text>
      </div>
    </>
  );
};
