import { isDefined } from '@railgun-community/shared-models';
import { useEffect, useMemo, useState } from 'react';
import { useReduxSelector, WalletCardSlideItem } from '@react-shared';
import { WalletsScreen } from './WalletsScreen/WalletsScreen';
import { WalletsSelectionContainer } from './WalletsScreen/WalletsSelectionContainer/WalletsSelectionContainer';
import styles from './WalletsScreenContainer.module.scss';

type Props = {
  isRailgun: boolean;
  setIsRailgun: (isRailgun: boolean) => void;
};

export const WalletsScreenContainer: React.FC<Props> = ({
  isRailgun,
  setIsRailgun,
}) => {
  const { wallets } = useReduxSelector('wallets');

  const activeWallet = wallets.active;
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [showWalletSelectorModal, setShowWalletSelectorModal] = useState(false);

  const slideItems: WalletCardSlideItem[] = useMemo(
    () => [
      {
        walletAddress: activeWallet?.railAddress,
        walletName: activeWallet?.name ?? 'PRIVATE',
        isRailgun: true,
      },
      {
        walletAddress:
          isDefined(activeWallet) && !activeWallet.isViewOnlyWallet
            ? activeWallet.ethAddress
            : undefined,
        walletName: activeWallet?.name ?? 'PUBLIC',
        isRailgun: false,
      },
    ],
    [activeWallet],
  );

  useEffect(() => {
    const index = isRailgun ? 0 : 1;
    setActiveSlideIndex(index);
  }, [isRailgun]);

  return (
    <div className={styles.container}>
      <WalletsSelectionContainer
        isRailgun={isRailgun}
        showWalletSelectorModal={showWalletSelectorModal}
        setShowWalletSelectorModal={setShowWalletSelectorModal}
      />
      <WalletsScreen
        slideItem={slideItems[activeSlideIndex]}
        setIsRailgun={setIsRailgun}
        setShowWalletSelectorModal={setShowWalletSelectorModal}
      />
    </div>
  );
};
