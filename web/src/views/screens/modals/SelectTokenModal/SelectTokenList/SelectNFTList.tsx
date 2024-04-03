import { NFTAmount } from '@railgun-community/shared-models';
import React from 'react';
import { Text } from '@components/Text/Text';
import { NFTListRow } from '@components/TokenListRow/NFTListRow/NFTListRow';
import { descriptionForNFTAmount } from '@react-shared';
import styles from './SelectTokenList.module.scss';

type Props = {
  nftAmounts: NFTAmount[];
  onSelect: (token: NFTAmount) => void;
};

export const SelectNFTList: React.FC<Props> = ({ nftAmounts, onSelect }) => {
  const renderNFT = (nftAmount: NFTAmount, index: number) => {
    return (
      <NFTListRow
        key={index}
        nftAmount={nftAmount}
        description={descriptionForNFTAmount(nftAmount)}
        descriptionClassName={styles.descriptionStyle}
        onSelect={() => onSelect(nftAmount)}
      />
    );
  };

  return (
    <>
      {!nftAmounts.length && (
        <Text className={styles.placeholder}>
          No additional NFTs found in wallet.
        </Text>
      )}
      {nftAmounts.map(renderNFT)}
    </>
  );
};
