import { NFTAmount } from '@railgun-community/shared-models';
import React, { ReactNode } from 'react';
import { NFTImage } from '@components/Image/NFTImage';
import { ListRow } from '@components/ListRow/ListRow';
import { Text } from '@components/Text/Text';
import { useNFTImageURLs, useNFTMetadata } from '@react-shared';
import styles from './NFTListRow.module.scss';

type Props = {
  nftAmount: NFTAmount;
  description: React.ReactNode;
  descriptionClassName?: string;
  defaultNoBorder?: boolean;
  selected?: boolean;
  disabled?: boolean;
  rightView?: () => ReactNode;
  onSelect?: () => void;
};

export const NFTListRow: React.FC<Props> = ({
  nftAmount,
  description,
  descriptionClassName,
  defaultNoBorder,
  selected,
  disabled,
  onSelect,
  rightView,
}) => {
  const { metadata } = useNFTMetadata(nftAmount);
  const { thumbnailURL } = useNFTImageURLs(metadata);

  const leftView = () => {
    return (
      <div className={styles.iconContainer}>
        <NFTImage imageURL={thumbnailURL} className={styles.tokenIcon} />
      </div>
    );
  };

  const title = (
    <Text fontWeight={800} fontSize={22} className={styles.titleStyles}>
      {metadata?.name}
    </Text>
  );

  return (
    <ListRow
      title={title}
      description={description}
      descriptionClassName={descriptionClassName}
      defaultNoBorder={defaultNoBorder}
      selected={selected}
      disabled={disabled}
      leftView={leftView}
      rightView={rightView}
      onSelect={onSelect}
      height={84}
    />
  );
};
