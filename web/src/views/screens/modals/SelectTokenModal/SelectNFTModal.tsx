import {
  NFTAmount,
  RailgunWalletBalanceBucket,
} from '@railgun-community/shared-models';
import React from 'react';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { Text } from '@components/Text/Text';
import {
  compareNFTAmounts,
  useNFTBalances,
  useReduxSelector,
} from '@react-shared';
import { SelectNFTList } from './SelectTokenList/SelectNFTList';
import styles from './SelectTokenModal.module.scss';

type Props = {
  onDismiss: (nftAmount?: NFTAmount) => void;
  isRailgun: boolean;
  selectedNFTAmounts: NFTAmount[];
  balanceBucketFilter: RailgunWalletBalanceBucket[];
};

export const SelectNFTModal: React.FC<Props> = ({
  onDismiss,
  isRailgun,
  selectedNFTAmounts,
  balanceBucketFilter,
}) => {
  const { wallets } = useReduxSelector('wallets');

  const activeWallet = wallets.active;

  const { nftBalances } = useNFTBalances(activeWallet, balanceBucketFilter);
  if (!nftBalances) {
    return null;
  }

  const nftAmounts = isRailgun ? nftBalances.shielded : nftBalances.public;
  if (!nftAmounts) {
    return null;
  }

  const filteredNFTAmounts: NFTAmount[] = nftAmounts.filter(nftAmount => {
    return (
      selectedNFTAmounts.find(selectedNFTAmount =>
        compareNFTAmounts(selectedNFTAmount, nftAmount),
      ) == null
    );
  });

  return (
    <GenericModal onClose={onDismiss} title="Select NFT">
      <div className={styles.wrapper}>
        <SelectNFTList
          nftAmounts={filteredNFTAmounts}
          onSelect={(nftAmount: NFTAmount) => onDismiss(nftAmount)}
        />
        <div className={styles.footer}>
          <div className={styles.footerContent}>
            <Text className={styles.footerText}>
              Showing NFTs in wallet: {activeWallet?.name ?? 'Unknown'}.
            </Text>
          </div>
        </div>
      </div>
    </GenericModal>
  );
};
