import { RailgunWalletBalanceBucket } from '@railgun-community/shared-models';
import { useState } from 'react';
import { WalletsSelectionContainer } from '../Wallets/WalletsScreen/WalletsSelectionContainer/WalletsSelectionContainer';
import { WalletStatusBar } from '../Wallets/WalletsScreen/WalletStatusBar/WalletStatusBar';
import { NFTsScreen } from './NFTsScreen';
import styles from './NFTs.module.scss';

type Props = {
  isRailgun: boolean;
  setIsRailgun: (isRailgun: boolean) => void;
};

export const NFTsScreenContainer: React.FC<Props> = ({
  isRailgun,
  setIsRailgun,
}) => {
  const [showWalletSelectorModal, setShowWalletSelectorModal] = useState(false);

  return (
    <div className={styles.outerContainer}>
      <WalletStatusBar
        isRailgun={isRailgun}
        displayingAssetDescription="NFTs"
        setIsRailgun={setIsRailgun}
        setShowWalletSelectorModal={setShowWalletSelectorModal}
      />
      <WalletsSelectionContainer
        isRailgun={isRailgun}
        showWalletSelectorModal={showWalletSelectorModal}
        setShowWalletSelectorModal={setShowWalletSelectorModal}
      />
      <NFTsScreen
        isRailgun={isRailgun}
        balanceBucketFilter={[RailgunWalletBalanceBucket.Spendable]}
      />
    </div>
  );
};
