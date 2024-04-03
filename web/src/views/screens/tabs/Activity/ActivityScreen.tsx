import {
  isDefined,
  MerkletreeScanStatus,
  TXIDVersion,
} from '@railgun-community/shared-models';
import { useRef, useState } from 'react';
import cn from 'classnames';
import {
  AlertProps,
  GenericAlert,
} from '@components/alerts/GenericAlert/GenericAlert';
import { Button } from '@components/Button/Button';
import { Input } from '@components/Input/Input';
import { Spinner } from '@components/loading/Spinner/Spinner';
import { MainPagePaddedContainer } from '@components/MainPagePaddedContainer/MainPagePaddedContainer';
import { Text } from '@components/Text/Text';
import { TextButton } from '@components/TextButton/TextButton';
import { TransactionList } from '@components/TransactionList/TransactionList';
import { DrawerName, EVENT_OPEN_DRAWER_WITH_DATA } from '@models/drawer-types';
import {
  addressLinkOnExternalScanSite,
  AvailableWallet,
  generateAllPOIsForWallet,
  getWalletTransactionHistory,
  logDevError,
  MerkletreeType,
  PendingTransactionWatcher,
  RailgunTransactionHistorySync,
  syncRailgunTransactionsV2,
  TransactionHistoryStatus,
  useAppDispatch,
  useFilteredNetworkTransactions,
  useFilteredNetworkTransactionsMissingTimestamp,
  usePOIRequiredForCurrentNetwork,
  useReduxSelector,
} from '@react-shared';
import {
  ErrorDetailsModal,
  ErrorDetailsModalProps,
} from '@screens/modals/ErrorDetailsModal/ErrorDetailsModal';
import { drawerEventsBus } from '@services/navigation/drawer-events';
import { IconType } from '@services/util/icon-service';
import { createExternalSiteAlert } from '@utils/alerts';
import styles from './Activity.module.scss';

export const ActivityScreen: React.FC = () => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const { txidVersion } = useReduxSelector('txidVersion');
  const { merkletreeHistoryScan } = useReduxSelector('merkletreeHistoryScan');
  const { savedTransactions } = useReduxSelector('savedTransactions');
  const { transactionHistoryStatus } = useReduxSelector(
    'transactionHistoryStatus',
  );
  const { poiRequired } = usePOIRequiredForCurrentNetwork();

  const [alert, setAlert] = useState<AlertProps | undefined>(undefined);
  const [errorModal, setErrorModal] = useState<
    ErrorDetailsModalProps | undefined
  >(undefined);
  const isRefreshing = useRef(false);

  const { networkTransactions, refreshPoiLists } =
    useFilteredNetworkTransactions(poiRequired);
  const { networkTransactionsMissingTimestamp } =
    useFilteredNetworkTransactionsMissingTimestamp();
  const [transactionSearchText, setTransactionSearchText] = useState('');
  const [generatingPOIs, setGeneratingPOIs] = useState<boolean>(false);

  const status =
    transactionHistoryStatus.forNetwork[network.current.name]?.status;
  const utxoMerkletreeScanStatus =
    merkletreeHistoryScan.forNetwork[network.current.name]?.forType[
      MerkletreeType.UTXO
    ]?.status;
  const isScanningMerkletree =
    utxoMerkletreeScanStatus === MerkletreeScanStatus.Started ||
    utxoMerkletreeScanStatus === MerkletreeScanStatus.Updated;

  const dispatch = useAppDispatch();

  const activeWallet = wallets.active;
  const availableWallet: Optional<AvailableWallet> =
    isDefined(activeWallet) && !activeWallet.isViewOnlyWallet
      ? activeWallet
      : undefined;

  const promptExternalSite = () => {
    if (availableWallet) {
      const url = addressLinkOnExternalScanSite(
        network.current.name,
        availableWallet.ethAddress,
      );
      if (isDefined(url)) {
        createExternalSiteAlert(url, setAlert, dispatch);
      }
    }
  };

  const watchPendingTransactions = () => {
    const allNetworkTransactions =
      savedTransactions.forNetwork[network.current.name] ?? [];
    PendingTransactionWatcher.watchPendingTransactions(
      allNetworkTransactions,
      network.current,
    );
  };

  const promptGeneratePOI = () => {
    setAlert({
      title: 'Generate Private POI',
      message:
        'This action will generate a Private Proof of Innocence for your transaction.',
      onClose: () => setAlert(undefined),
      submitTitle: 'Generate',
      onSubmit: async () => {
        setAlert(undefined);
        await generatePOIs();
      },
    });
  };

  const generatePOIs = async () => {
    if (!wallets.active) return;

    setGeneratingPOIs(true);

    await generateAllPOIsForWallet(
      network.current.name,
      wallets.active.railWalletID,
    );

    setGeneratingPOIs(false);

    refreshPoiLists();
  };

  const syncTransactions = async () => {
    try {
      await RailgunTransactionHistorySync.unsafeSyncTransactionHistory(
        dispatch,
        network.current,
        getWalletTransactionHistory,
      );
    } catch (cause) {
      const error = new Error('Failed to sync transactions', { cause });
      logDevError(error);
      setErrorModal({
        error,
        onDismiss: () => setErrorModal(undefined),
      });
    }
  };

  const refreshTransactions = async () => {
    if (isRefreshing.current) {
      return;
    }
    isRefreshing.current = true;
    watchPendingTransactions();
    if (
      txidVersion.current === TXIDVersion.V2_PoseidonMerkle &&
      poiRequired &&
      isDefined(wallets.active)
    ) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      syncRailgunTransactionsV2(network.current.name);
    } else {
      await syncTransactions();
    }
    isRefreshing.current = false;
  };

  const onExportTransactions = () => {
    drawerEventsBus.dispatch(EVENT_OPEN_DRAWER_WITH_DATA, {
      drawerName: DrawerName.ExportTransactions,
    });
  };

  return (
    <div className={styles.pageContainer}>
      <MainPagePaddedContainer maxWidth={760} minWidth={520}>
        <div className={styles.headerRow}>
          <Text className={styles.headerText}>Activity</Text>
          <TextButton
            action={promptExternalSite}
            disabled={!availableWallet}
            textClassName={styles.headerSubtext}
            text={`Network: ${network.current.publicName}`}
          />
        </div>
        <div className={styles.transactionsWrapper}>
          <div className={styles.transactionsHeader}>
            <div className={styles.transactionsHeaderText}>
              <Text className={styles.transactionsHeaderTitle}>
                Transactions
              </Text>
              <Text className={styles.transactionsHeaderSubtitle}>
                {activeWallet?.name ?? 'Unknown wallet'}
              </Text>
            </div>
            <div className={styles.transactionHeaderRightWrapper}>
              <div className={styles.refreshButtonSpinnerWrapper}>
                {!isScanningMerkletree &&
                  status === TransactionHistoryStatus.Synced && (
                    <Button
                      iconOnly
                      alt="resync transactions"
                      endIcon={IconType.Download}
                      onClick={onExportTransactions}
                      buttonClassName={styles.downloadButton}
                    />
                  )}
                {(isScanningMerkletree ||
                  status === TransactionHistoryStatus.Syncing ||
                  generatingPOIs) && (
                  <Spinner size={24} className={styles.refreshSpinner} />
                )}
                {!isScanningMerkletree &&
                  status !== TransactionHistoryStatus.Syncing && (
                    <Button
                      iconOnly
                      alt="resync transactions"
                      endIcon={IconType.Refresh}
                      onClick={refreshTransactions}
                    />
                  )}
              </div>
              <Input
                maxWidth={320}
                placeholder="Search"
                startIcon={IconType.Search}
                disabled={!networkTransactions.length}
                onChange={e => setTransactionSearchText(e.target.value)}
              />
            </div>
          </div>
          <div className={cn(styles.transactionListWrapper, 'hide-scroll')}>
            <TransactionList
              transactions={networkTransactions}
              searchText={transactionSearchText}
              resyncTransactions={refreshTransactions}
              transactionsMissingTimestamp={networkTransactionsMissingTimestamp}
              generatePOIs={promptGeneratePOI}
              refreshPOILists={refreshPoiLists}
              poiRequired={poiRequired}
            />
          </div>
        </div>
      </MainPagePaddedContainer>
      {alert && <GenericAlert {...alert} />}
      {errorModal && <ErrorDetailsModal {...errorModal} />}
    </div>
  );
};
