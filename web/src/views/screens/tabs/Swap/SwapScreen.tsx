import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import cn from 'classnames';
import { MainPagePaddedContainer } from '@components/MainPagePaddedContainer/MainPagePaddedContainer';
import { SwapContainer } from '@components/SwapContainer/SwapContainer';
import { Text } from '@components/Text/Text';
import { ERC20Token, useReduxSelector } from '@react-shared';
import styles from './SwapScreen.module.scss';

export type SwapScreenState = {
  token?: ERC20Token;
};

type Props = {
  isRailgun: boolean;
  setIsRailgun: (isRailgun: boolean) => void;
};

export const SwapScreen: React.FC<Props> = ({ isRailgun, setIsRailgun }) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');

  const [swapContainerKey, setSwapContainerKey] = useState(0);

  const location = useLocation();
  const state: Optional<SwapScreenState> = location.state;

  useEffect(() => {
    setSwapContainerKey(swapContainerKey === 0 ? 1 : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network.current, wallets.active?.id, state]);

  const activeWallet = wallets.active;
  if (activeWallet?.isViewOnlyWallet ?? false) {
    return <Text>Not available for View-Only wallets</Text>;
  }

  return (
    (<div className={cn(styles.pageContainer, 'hide-scroll')}>
      <MainPagePaddedContainer maxWidth={760} minWidth={520}>
        <div className={styles.content}>
          <div className={styles.headerRow}>
            <Text className={styles.headerText}>
              RAILWAY <span className={styles.headerUnBoldText}>DEX</span>
            </Text>
            <Text className={styles.headerSubtext}>
              Private and public swaps on {network.current.shortPublicName}
            </Text>
          </div>
          {}
          <SwapContainer
            navigationToken={state?.token}
            isRailgun={isRailgun}
            setIsRailgun={setIsRailgun}
            key={swapContainerKey}
          />
        </div>
      </MainPagePaddedContainer>
    </div>)
  );
};
