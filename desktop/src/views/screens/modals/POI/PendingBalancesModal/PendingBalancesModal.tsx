import {
  isDefined,
  RailgunWalletBalanceBucket,
} from '@railgun-community/shared-models';
import { useEffect, useRef, useState } from 'react';
import {
  AlertProps,
  GenericAlert,
} from '@components/alerts/GenericAlert/GenericAlert';
import { Text } from '@components/Text/Text';
import {
  getPOIBalancesDisclaimerMessage,
  getWalletTransactionHistory,
  NonSpendableTransaction,
  RailgunTransactionHistoryService,
  refreshReceivePOIsForWallet,
  refreshSpentPOIsForWallet,
  useAppDispatch,
  useReduxSelector,
} from '@react-shared';
import { Spinner } from '@views/components/loading/Spinner/Spinner';
import { GenericModal } from '@views/components/modals/GenericModal/GenericModal';
import { createPOIDisclaimerAlert } from '../../../../../utils/alerts';
import { Button } from '../../../../components/Button/Button';
import { PendingBalancesTabs } from './Tabs/PendingBalancesTabs';
import { PendingBalancesItem } from './TxItem/PendingBalancesItem';
import styles from './PendingBalancesModal.module.scss';

export enum PendingBalancesModalTabOption {
  Pending = 'Pending',
  Incomplete = 'Incomplete',
  Restricted = 'Restricted',
}

export enum SyncProofType {
  Spend = 'Spend',
  Receive = 'Receive',
}

interface PendingBalancesModalProps {
  onClose: () => void;
  initialBalanceBucket?: RailgunWalletBalanceBucket;
}

const modalContentOverrideStyles = {
  width: 700,
};

export const PendingBalancesModal = ({
  onClose,
  initialBalanceBucket,
}: PendingBalancesModalProps) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const { txidVersion } = useReduxSelector('txidVersion');
  const { remoteConfig } = useReduxSelector('remoteConfig');

  const [alert, setAlert] = useState<AlertProps | undefined>(undefined);
  const [externalLinkAlert, setExternalLinkAlert] = useState<
    AlertProps | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<PendingBalancesModalTabOption>(
    PendingBalancesModalTabOption.Pending,
  );
  const [showRestrictedTab, setShowRestrictedTab] = useState<boolean>(false);
  const [allTxItems, setAllTxItems] = useState<NonSpendableTransaction[]>([]);
  const isInitialLoadRef = useRef<boolean>(true);

  const dispatch = useAppDispatch();

  const currentNetwork = network.current;
  const currentWallet = wallets.active;

  useEffect(() => {
    if (isDefined(initialBalanceBucket)) {
      switch (initialBalanceBucket) {
        case RailgunWalletBalanceBucket.ShieldPending:
        case RailgunWalletBalanceBucket.ProofSubmitted:
          setSelectedTab(PendingBalancesModalTabOption.Pending);
          break;
        case RailgunWalletBalanceBucket.MissingExternalPOI:
        case RailgunWalletBalanceBucket.MissingInternalPOI:
          setSelectedTab(PendingBalancesModalTabOption.Incomplete);
          break;
        case RailgunWalletBalanceBucket.ShieldBlocked:
          setSelectedTab(PendingBalancesModalTabOption.Restricted);
          break;
        case RailgunWalletBalanceBucket.Spendable:
        case RailgunWalletBalanceBucket.Spent:
          break;
      }
    }
  }, [initialBalanceBucket]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchNonPOITransactionItems();
  }, [currentNetwork, currentWallet]);

  const fetchNonPOITransactionItems = async () => {
    setAllTxItems([]);
    if (!isDefined(currentWallet)) return;

    setIsLoading(true);
    const txHistoryService = new RailgunTransactionHistoryService(dispatch);
    const railgunTransactions = await getWalletTransactionHistory(
      currentNetwork.chain,
      currentWallet.railWalletID,
      0,
    );
    const txItems = await txHistoryService.getNonPOITransactions(
      currentNetwork.name,
      currentWallet,
      wallets.available,
      railgunTransactions,
    );

    const hasRestrictedTransactions = txItems.some(
      txItem =>
        txItem.balanceBucket === RailgunWalletBalanceBucket.ShieldBlocked,
    );
    setShowRestrictedTab(hasRestrictedTransactions);

    if (
      isInitialLoadRef.current &&
      !isDefined(initialBalanceBucket) &&
      txItems.length > 0
    ) {
      const firstNonSpendableTxItem = txItems[0];
      switch (firstNonSpendableTxItem.balanceBucket) {
        case RailgunWalletBalanceBucket.ShieldPending:
        case RailgunWalletBalanceBucket.ProofSubmitted:
          setSelectedTab(PendingBalancesModalTabOption.Pending);
          break;
        case RailgunWalletBalanceBucket.MissingExternalPOI:
        case RailgunWalletBalanceBucket.MissingInternalPOI:
          setSelectedTab(PendingBalancesModalTabOption.Incomplete);
          break;
        case RailgunWalletBalanceBucket.ShieldBlocked:
          setSelectedTab(PendingBalancesModalTabOption.Restricted);
          break;
        case RailgunWalletBalanceBucket.Spendable:
        case RailgunWalletBalanceBucket.Spent:
          break;
      }
    }
    isInitialLoadRef.current = false;

    setAllTxItems(txItems);
    setIsLoading(false);
  };

  const syncProofs = async (syncProofType: SyncProofType) => {
    if (!currentWallet) return;

    setIsLoading(true);
    if (syncProofType === SyncProofType.Spend) {
      await refreshReceivePOIsForWallet(
        txidVersion.current,
        currentNetwork.name,
        currentWallet?.railWalletID,
      );
    } else {
      await refreshSpentPOIsForWallet(
        txidVersion.current,
        currentNetwork.name,
        currentWallet?.railWalletID,
        undefined,
      );
    }

    await fetchNonPOITransactionItems();
  };

  const filteredTxItems: NonSpendableTransaction[] = allTxItems.filter(
    txItem => {
      switch (selectedTab) {
        case PendingBalancesModalTabOption.Pending:
          return (
            txItem.balanceBucket === RailgunWalletBalanceBucket.ShieldPending ||
            txItem.balanceBucket === RailgunWalletBalanceBucket.ProofSubmitted
          );
        case PendingBalancesModalTabOption.Incomplete:
          return (
            txItem.balanceBucket ===
              RailgunWalletBalanceBucket.MissingExternalPOI ||
            txItem.balanceBucket ===
              RailgunWalletBalanceBucket.MissingInternalPOI
          );
        case PendingBalancesModalTabOption.Restricted:
          return (
            txItem.balanceBucket === RailgunWalletBalanceBucket.ShieldBlocked
          );
      }
    },
  );

  return (
    <>
      <GenericModal
        onClose={onClose}
        title="Pending balances"
        contentOverrideStyles={modalContentOverrideStyles}
        accessoryView={
          <Button
            textClassName={styles.fullLengthButtonStyle}
            onClick={() => {
              createPOIDisclaimerAlert(
                'About Pending Balances',
                getPOIBalancesDisclaimerMessage(),
                setAlert,
                setExternalLinkAlert,
                dispatch,
                remoteConfig?.current?.poiDocumentation,
                undefined, "Okay",
              );
            }}
          >
            What is this?
          </Button>
        }
      >
        <PendingBalancesTabs
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          showRestrictedTab={showRestrictedTab}
        />
        {isLoading && (
          <div className={styles.loadingContainer}>
            <Spinner size={44} />
          </div>
        )}
        {!isLoading && (
          <div className={styles.itemList}>
            {filteredTxItems.map((txItem, index) => (
              <PendingBalancesItem
                txItem={txItem}
                syncProofs={syncProofs}
                key={index}
                closeModal={onClose}
              />
            ))}
            {filteredTxItems.length === 0 && (
              <Text className={styles.noTxItem}>
                No {selectedTab.toLowerCase()} transactions.
              </Text>
            )}
          </div>
        )}
      </GenericModal>
      {alert && <GenericAlert {...alert} />}
      {externalLinkAlert && <GenericAlert {...externalLinkAlert} />}
    </>
  );
};
