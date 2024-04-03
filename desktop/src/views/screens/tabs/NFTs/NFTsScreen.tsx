import {
  isDefined,
  NFTAmount,
  RailgunWalletBalanceBucket,
} from '@railgun-community/shared-models';
import { useEffect, useState } from 'react';
import { MainPagePaddedContainer } from '@components/MainPagePaddedContainer/MainPagePaddedContainer';
import { Text } from '@components/Text/Text';
import {
  DrawerName,
  EVENT_OPEN_DRAWER_WITH_DATA,
  TransferNFTData,
} from '@models/drawer-types';
import {
  pullWalletNFTsNetwork,
  refreshRailgunBalances,
  useAppDispatch,
  useBalancePriceRefresh,
  useFilteredNFTBalances,
  useReduxSelector,
} from '@react-shared';
import {
  ErrorDetailsModal,
  ErrorDetailsModalProps,
} from '@screens/modals/ErrorDetailsModal/ErrorDetailsModal';
import { drawerEventsBus } from '@services/navigation/drawer-events';
import { NFTList } from './NFTList/NFTList';
import { NFTListHeader } from './NFTList/NFTListHeader/NFTListHeader';
import styles from './NFTs.module.scss';

type Props = {
  isRailgun: boolean;
  balanceBucketFilter: RailgunWalletBalanceBucket[];
};

export const NFTsScreen: React.FC<Props> = ({
  isRailgun,
  balanceBucketFilter,
}) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const dispatch = useAppDispatch();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [errorModal, setErrorModal] = useState<
    ErrorDetailsModalProps | undefined
  >(undefined);

  const { pullBalances } = useBalancePriceRefresh(
    refreshRailgunBalances,
    (error: Error) =>
      setErrorModal({
        error,
        onDismiss: () => setErrorModal(undefined),
      }),
  );
  const { filteredNFTBalances } = useFilteredNFTBalances(
    searchText,
    wallets.active,
    balanceBucketFilter,
  );

  const currentNetwork = network.current;
  const activeWallet = wallets.active;

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
      pullWalletNFTsNetwork(dispatch, activeWallet, currentNetwork);
  }, [currentNetwork.name, activeWallet?.id]);

  const onActionSendNFT = (nftAmount: NFTAmount) => {
    const extraData: TransferNFTData = { nftAmount };
    return drawerEventsBus.dispatch(EVENT_OPEN_DRAWER_WITH_DATA, {
      drawerName: DrawerName.SendNFTs,
      extraData,
    });
  };

  const onActionShieldNFT = (nftAmount: NFTAmount) => {
    const extraData: TransferNFTData = { nftAmount };
    return drawerEventsBus.dispatch(EVENT_OPEN_DRAWER_WITH_DATA, {
      drawerName: DrawerName.ShieldNFTs,
      extraData,
    });
  };

  const onActionUnshieldNFT = (nftAmount: NFTAmount) => {
    const extraData: TransferNFTData = { nftAmount };
    return drawerEventsBus.dispatch(EVENT_OPEN_DRAWER_WITH_DATA, {
      drawerName: DrawerName.UnshieldNFTs,
      extraData,
    });
  };

  const refreshBalances = async () => {
    if (isRefreshing) {
      return;
    }
    setIsRefreshing(true);
    if (isRailgun) {
      await pullBalances(activeWallet, currentNetwork);
    } else {
      await pullWalletNFTsNetwork(dispatch, activeWallet, currentNetwork);
    }
    setIsRefreshing(false);
  };

  return (
    <div className={styles.pageContainer}>
      <MainPagePaddedContainer
        maxWidth={760}
        minWidth={520}
        widthOverride="auto"
      >
        <div className={styles.headerRow}>
          <Text className={styles.headerText}>NFTs</Text>
          <Text className={styles.headerSubtext}>
            Digital assets and collectibles on {network.current.shortPublicName}
          </Text>
        </div>

        <div className={styles.mainSectionWrapper}>
          <NFTListHeader
            isRailgun={isRailgun}
            refreshBalances={refreshBalances}
            onSearchChange={text => setSearchText(text)}
          />
          {!filteredNFTBalances && (
            <Text className={styles.placeholderText}>
              No wallet data found.
            </Text>
          )}
          {filteredNFTBalances && (
            <NFTList
              isRailgun={isRailgun}
              nftAmounts={
                isRailgun
                  ? filteredNFTBalances.shielded
                  : filteredNFTBalances.public
              }
              assetType={isRailgun ? 'shielded' : 'public'}
              onActionSendNFT={onActionSendNFT}
              onActionShieldNFT={onActionShieldNFT}
              onActionUnshieldNFT={onActionUnshieldNFT}
            />
          )}
        </div>
        {isDefined(errorModal) && <ErrorDetailsModal {...errorModal} />}
      </MainPagePaddedContainer>
    </div>
  );
};
