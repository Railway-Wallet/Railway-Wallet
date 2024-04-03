import { isDefined,NFTAmount } from '@railgun-community/shared-models';
import { Text } from '@components/Text/Text';
import { NFTListItem } from './NFTListItem/NFTListItem';
import styles from './NFTList.module.scss';

type Props = {
  isRailgun: boolean;
  nftAmounts: Optional<NFTAmount[]>;
  assetType: string;
  onActionSendNFT: (nftAmount: NFTAmount) => void;
  onActionShieldNFT: (nftAmount: NFTAmount) => void;
  onActionUnshieldNFT: (nftAmount: NFTAmount) => void;
};

export const NFTList = ({
  isRailgun,
  nftAmounts,
  assetType,
  onActionSendNFT,
  onActionShieldNFT,
  onActionUnshieldNFT,
}: Props) => {
  const hasNFTs = isDefined(nftAmounts) && nftAmounts.length > 0;

  return (
    <div className={styles.nftContainer}>
      {hasNFTs &&
        nftAmounts.map((nftAmount, index) => (
          <NFTListItem
            key={index}
            isRailgun={isRailgun}
            nftAmount={nftAmount}
            onActionSend={() => onActionSendNFT(nftAmount)}
            onActionShield={() => onActionShieldNFT(nftAmount)}
            onActionUnshield={() => onActionUnshieldNFT(nftAmount)}
          />
        ))}
      {!hasNFTs && (
        <>
          {nftAmounts && (
            <Text className={styles.placeholderText}>
              No {assetType} assets found.
            </Text>
          )}
          {!nftAmounts && (
            <Text className={styles.placeholderText}>Loading...</Text>
          )}
        </>
      )}
    </div>
  );
};
