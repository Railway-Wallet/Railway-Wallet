import {
  isDefined,
  MerkletreeScanStatus,
  NetworkName,
  TXIDVersion,
} from '@railgun-community/shared-models';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@components/Button/Button';
import { Drawer } from '@components/Drawer/Drawer';
import { SlideDirection } from '@components/Drawer/DrawerContent/DrawerContent';
import { FullScreenSpinner } from '@components/loading/FullScreenSpinner/FullScreenSpinner';
import { Spinner } from '@components/loading/Spinner/Spinner';
import { Selector } from '@components/Selector/Selector';
import { Text } from '@components/Text/Text';
import { EVENT_CLOSE_DRAWER } from '@models/drawer-types';
import {
  AppSettingsService,
  getSupportedNetworks,
  ImageSwirl,
  logDevError,
  MerkletreeScanCurrentStatus,
  MerkletreeType,
  networkForName,
  NetworkService,
  ReactConfig,
  refreshRailgunBalances,
  textForTXIDVersion,
  useAppDispatch,
  useBalancePriceRefresh,
  usePendingTransactionCount,
  useReduxSelector,
  useShouldEnableNFTs,
} from '@react-shared';
import { TabRoute } from '@root/App/TabNavigator/TabContainer/TabContainer';
import { Tab } from '@root/App/TabNavigator/TabNavigator';
import {
  ErrorDetailsModal,
  ErrorDetailsModalProps,
} from '@screens/modals/ErrorDetailsModal/ErrorDetailsModal';
import { SettingsScreen } from '@screens/tabs/Settings/SettingsScreen';
import {
  AppEventChangeNetworkData,
  AppEventData,
  appEventsBus,
  EVENT_CHANGE_NETWORK,
} from '@services/navigation/app-events';
import { drawerEventsBus } from '@services/navigation/drawer-events';
import { IconType } from '@services/util/icon-service';
import { TabOption, TabOptionType } from './TabOption/TabOption';
import styles from './SidebarMenu.module.scss';

type NetworkOption = {
  value: NetworkName;
  label: string;
};

type TXIDOption = {
  value: TXIDVersion;
  label: string;
};

export const SidebarMenu = (): JSX.Element => {
  const { network } = useReduxSelector('network');
  const { txidVersion } = useReduxSelector('txidVersion');
  const { merkletreeHistoryScan } = useReduxSelector('merkletreeHistoryScan');

  const [showLoadingText, setShowLoadingText] = useState<Optional<string>>();
  const [errorModal, setErrorModal] = useState<
    ErrorDetailsModalProps | undefined
  >(undefined);

  const networkOptions: NetworkOption[] = useMemo(() => {
    const supportedNetworks = getSupportedNetworks();
    return supportedNetworks.map(network => ({
      value: network.name,
      label:
        network.isDevOnlyNetwork === true
          ? `[DEV] ${network.publicName}`
          : network.publicName,
    }));
  }, []);

  const txidOptions: TXIDOption[] = useMemo(() => {
    const txidVersions = Object.values(TXIDVersion);
    return txidVersions.map(txidVersion => ({
      value: txidVersion,
      label: textForTXIDVersion(txidVersion),
    }));
  }, []);

  const initialNetworkOption =
    networkOptions.find(n => n.value === network.current.name) ??
    networkOptions[0];
  const [currentNetworkOption, setCurrentNetworkOption] =
    useState(initialNetworkOption);

  const currentTxidVersion = txidVersion.current;
  const initialTXIDOption =
    txidOptions.find(n => n.value === currentTxidVersion) ?? txidOptions[0];
  const [currentTXIDOption, setCurrentTXIDOption] = useState(initialTXIDOption);

  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  const dispatch = useAppDispatch();

  useEffect(() => {
    setCurrentTXIDOption(
      txidOptions.find(n => n.value === currentTxidVersion) ?? txidOptions[0],
    );
  }, [currentTxidVersion]);

  const { pullPrices, pullBalances } = useBalancePriceRefresh(
    refreshRailgunBalances,
    (error: Error) =>
      setErrorModal({
        error,
        onDismiss: () => setErrorModal(undefined),
      }),
  );

  const { pendingTransactionCount } = usePendingTransactionCount();

  const { shouldEnableNFTs } = useShouldEnableNFTs();

  const setNetworkOption = (networkName: NetworkName) => {
    const option = networkOptions.find(({ value }) => value === networkName);
    if (option) {
      setCurrentNetworkOption(option);
    }
  };

  const onSelectNetwork = async (option: NetworkOption) => {
    if (option == null) {
      return;
    }
    const networkName = option.value;
    await updateSelectedNetwork(networkName);
  };

  const onSelectTXIDVersion = async (option: TXIDOption) => {
    await AppSettingsService.setTXIDVersion(dispatch, option.value);
    setCurrentTXIDOption(option);
  };

  const updateSelectedNetwork = async (
    networkName: NetworkName,
    forceChangeNetwork: boolean = false,
  ) => {
    if (!forceChangeNetwork && networkName === network.current.name) {
      return;
    }
    const newNetwork = networkForName(networkName);
    if (!newNetwork) {
      return;
    }

    setShowLoadingText(
      `Loading ${newNetwork.publicName} and scanning new transactions`,
    );

    try {
      const networkService = new NetworkService(dispatch);
      const shouldFallbackOnError = true;
      await networkService.tryChangeNetwork(
        network.current.name,
        networkName,
        shouldFallbackOnError,
        pullPrices,
        pullBalances,
      );
      setNetworkOption(networkName);

      setShowLoadingText(undefined);
    } catch (cause) {
      setShowLoadingText(undefined);
      const error = new Error(
        'Connection error while loading network. Please try again.',
        { cause },
      );
      logDevError(error);
      setErrorModal({
        error,
        onDismiss: () => setErrorModal(undefined),
      });

      drawerEventsBus.dispatch(EVENT_CLOSE_DRAWER);
    }
  };

  const changeNetworkViaEventsBus = async (data: AppEventData) => {
    await updateSelectedNetwork(
      (data as AppEventChangeNetworkData).networkName,
      (data as AppEventChangeNetworkData).forceChangeNetwork,
    );
  };

  useEffect(() => {
    appEventsBus.on(EVENT_CHANGE_NETWORK, changeNetworkViaEventsBus);
    return () => {
      appEventsBus.remove(EVENT_CHANGE_NETWORK, changeNetworkViaEventsBus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeSettings = () => setSettingsModalOpen(false);

  const openSettings = () => setSettingsModalOpen(true);

  const utxoMerkletreeScanData: Optional<MerkletreeScanCurrentStatus> =
    merkletreeHistoryScan.forNetwork[network.current.name]?.forType[
      MerkletreeType.UTXO
    ];
  const railgunBalancesUpdating =
    utxoMerkletreeScanData?.status === MerkletreeScanStatus.Started ||
    utxoMerkletreeScanData?.status === MerkletreeScanStatus.Updated;
  const balanceScanProgress = utxoMerkletreeScanData?.progress ?? 0;

  const txidMerkletreeScanData: Optional<MerkletreeScanCurrentStatus> =
    merkletreeHistoryScan.forNetwork[network.current.name]?.forType[
      MerkletreeType.TXID
    ];
  const txidsUpdating =
    txidMerkletreeScanData?.status === MerkletreeScanStatus.Started ||
    txidMerkletreeScanData?.status === MerkletreeScanStatus.Updated;
  const txidScanProgress = txidMerkletreeScanData?.progress ?? 0;

  const tabs: TabOptionType[] = useMemo(
    () => [
      {
        tab: Tab.Wallets,
        href: TabRoute.Wallets,
        icon: IconType.Wallet,
      },
      {
        tab: Tab.Activity,
        href: TabRoute.Activity,
        icon: IconType.ActivityFeed,
        badge:
          pendingTransactionCount > 0 ? pendingTransactionCount : undefined,
      },
      {
        tab: Tab.NFTs,
        href: TabRoute.NFTs,
        icon: IconType.NFT,
        disabled: !shouldEnableNFTs,
      },
      {
        tab: Tab.DApps,
        icon: IconType.DApps,
      },
    ],
    [pendingTransactionCount, shouldEnableNFTs],
  );

  const renderTabOption = (tab: TabOptionType, index: number) => (
    <TabOption key={index} {...tab} />
  );

  return (
    <>
      <div className={styles.sideBarMenuContainer}>
        <div className={styles.innerContainer}>
          <div className={styles.logoContainer}>
            <Text className={styles.railwayLogoText}>RAILWAY</Text>
            <div className={styles.selectorsWrapper}>
              <Selector
                options={networkOptions}
                value={currentNetworkOption}
                placeholder="Select Network"
                onValueChange={option =>
                  onSelectNetwork(option as NetworkOption)
                }
                containerClassName={styles.selector}
                testId="network-selector"
              />
              {ReactConfig.ENABLE_V3 && network.current.supportsV3 && (
                <Selector
                  options={txidOptions}
                  value={currentTXIDOption}
                  placeholder="Select Balances Version"
                  onValueChange={option =>
                    onSelectTXIDVersion(option as TXIDOption)
                  }
                  containerClassName={styles.selector}
                  testId="txid-version-selector"
                />
              )}
            </div>
          </div>
          <div className={styles.linksContainer}>
            {tabs.map(renderTabOption)}
          </div>
          <div
            className={styles.swirl}
            style={{ backgroundImage: `url(${ImageSwirl()})` }}
          />
          {railgunBalancesUpdating && (
            <div className={styles.historyScanContainer}>
              <Spinner size={20} />
              <div>
                <Text className={styles.historyScanText}>
                  RAILGUN balances updating:{' '}
                  {(balanceScanProgress * 100).toFixed(0)}%
                </Text>
              </div>
            </div>
          )}
          {txidsUpdating && (
            <div className={styles.txidScanContainer}>
              <Spinner size={20} />
              <div>
                <Text className={styles.historyScanText}>
                  RAILGUN TXIDs updating: {(txidScanProgress * 100).toFixed(0)}%
                </Text>
              </div>
            </div>
          )}
          <div className={styles.settingsButtonContainer}>
            <Button
              startIcon={IconType.Settings}
              onClick={openSettings}
              buttonClassName={styles.settingsButton}
              textClassName={styles.settingsButtonText}
              iconSize={18}
            >
              Settings
            </Button>
          </div>
        </div>
      </div>
      <Drawer
        isOpen={settingsModalOpen}
        onRequestClose={closeSettings}
        headerText="Settings"
        variant={SlideDirection.SLIDE_FROM_LEFT}
        drawerWidth={400}
        contentClassName={styles.settingsDrawer}
        showWalletAddress={false}
      >
        <SettingsScreen />
      </Drawer>
      {isDefined(errorModal) && <ErrorDetailsModal {...errorModal} />}
      {isDefined(showLoadingText) && (
        <FullScreenSpinner text={showLoadingText} />
      )}
    </>
  );
};
