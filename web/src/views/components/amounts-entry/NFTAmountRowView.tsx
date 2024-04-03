import { NFTAmount } from '@railgun-community/shared-models';
import React from 'react';
import { NFTListRow } from '@components/TokenListRow/NFTListRow/NFTListRow';
import { descriptionForNFTAmount, localDecimalSymbol } from '@react-shared';
import styles from './AmountsEntry.module.scss';

type Props = {
  nftAmount: NFTAmount;
  index: number;
  onSelectNFTAmount: () => void;
};

export const DECIMAL_SYMBOL = localDecimalSymbol();

export const NFTAmountRowView: React.FC<Props> = ({
  nftAmount,
  index,
  onSelectNFTAmount,
}) => {
  return (
    <NFTListRow
      key={index}
      nftAmount={nftAmount}
      description={descriptionForNFTAmount(nftAmount)}
      descriptionClassName={styles.descriptionStyle}
      onSelect={onSelectNFTAmount}
    />
  );
};
