import {
  isDefined,
  NFTAmountRecipient,
  RailgunWalletBalanceBucket,
} from '@railgun-community/shared-models';
import { ReactNode, useState } from 'react';
import cn from 'classnames';
import { FullScreenSpinner } from '@components/loading/FullScreenSpinner/FullScreenSpinner';
import { Text } from '@components/Text/Text';
import {
  DrawerName,
  EVENT_OPEN_DRAWER_WITH_DATA,
  UnshieldToOriginData,
} from '@models/drawer-types';
import {
  createSerializedERC20AmountRecipients,
  createSerializedNFTAmountRecipients,
  ERC20AmountRecipient,
  formatBalanceBucketStatus,
  formatTransactionTimestamp,
  getERC20AndNFTAmountRecipientsForUnshieldToOrigin,
  getExternalScanSiteName,
  getTransactionPOIStatusColor,
  getTransactionPOIStatusInfoText,
  NonSpendableTransaction,
  styleguide,
  transactionLinkOnExternalScanSite,
  transactionText,
  useAppDispatch,
  useReduxSelector,
} from '@react-shared';
import {
  ErrorDetailsModal,
  ErrorDetailsModalProps,
} from '@screens/modals/ErrorDetailsModal/ErrorDetailsModal';
import { drawerEventsBus } from '@services/navigation/drawer-events';
import { IconType, renderIcon } from '@services/util/icon-service';
import {
  createExternalSiteAlert,
  ExternalSiteAlertMessages,
} from '@utils/alerts';
import {
  AlertProps,
  GenericAlert,
} from '@views/components/alerts/GenericAlert/GenericAlert';
import {
  TextActionButton,
  TextButton,
} from '@views/components/TextButton/TextButton';
import { SyncProofType } from '../PendingBalancesModal';
import styles from './PendingBalancesItem.module.scss';

type Props = {
  txItem: NonSpendableTransaction;
  isRailgunForTokenInfo?: boolean;
  syncProofs: (syncType: SyncProofType) => void;
  closeModal: () => void;
};

export const PendingBalancesItem: React.FC<Props> = ({
  txItem,
  isRailgunForTokenInfo = false,
  syncProofs,
  closeModal,
}) => {
  const dispatch = useAppDispatch();
  const [showMemoFullLength, setShowMemoFullLength] = useState(false);
  const [memoHover, setMemoHover] = useState(false);
  const [alert, setAlert] = useState<AlertProps | undefined>(undefined);
  const [errorModal, setErrorModal] = useState<
    ErrorDetailsModalProps | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const { txidVersion } = useReduxSelector('txidVersion');

  if (!wallets.active) {
    return null;
  }

  const { transaction, balanceBucket } = txItem;

  const promptExternalSite = () => {
    const url = transactionLinkOnExternalScanSite(
      network.current.name,
      transaction.id,
    );
    if (isDefined(url)) {
      createExternalSiteAlert(
        url,
        setAlert,
        dispatch,
        ExternalSiteAlertMessages.OPEN_EXTERNAL_TRANSACTION,
      );
    }
  };

  const getUnshieldToOriginData = async (): Promise<
    Optional<{
      erc20AmountRecipients: ERC20AmountRecipient[];
      nftAmountRecipients: NFTAmountRecipient[];
    }>
  > => {
    try {
      if (!wallets.active) {
        throw new Error('No active wallet');
      }

      const originalShieldTxid = transaction.id;
      const { erc20AmountRecipients, nftAmountRecipients } =
        await getERC20AndNFTAmountRecipientsForUnshieldToOrigin(
          txidVersion.current,
          network.current.name,
          wallets.active.railWalletID,
          originalShieldTxid,
        );

      return {
        erc20AmountRecipients: createSerializedERC20AmountRecipients(
          wallets.active,
          network.current.name,
          erc20AmountRecipients,
        ),
        nftAmountRecipients:
          createSerializedNFTAmountRecipients(nftAmountRecipients),
      };
    } catch (err) {
      setErrorModal({
        error: err,
        onDismiss: () => setErrorModal(undefined),
      });
      return undefined;
    }
  };

  const unshieldToOrigin = async () => {
    setIsLoading(true);
    const unshieldToOriginData = await getUnshieldToOriginData();
    setIsLoading(false);
    if (!unshieldToOriginData) {
      return;
    }

    const extraData: UnshieldToOriginData = {
      ...unshieldToOriginData,
      originalShieldTxid: transaction.id,
    };
    drawerEventsBus.dispatch(EVENT_OPEN_DRAWER_WITH_DATA, {
      drawerName: DrawerName.UnshieldToOrigin,
      extraData,
    });

    closeModal();
  };

  const bottomActionButtons = (): TextActionButton[] => {
    let buttons: TextActionButton[] = [];
    let executeSyncProofs: Optional<() => void>;

    switch (balanceBucket) {
      case RailgunWalletBalanceBucket.ShieldPending:
      case RailgunWalletBalanceBucket.MissingExternalPOI:
      case RailgunWalletBalanceBucket.ProofSubmitted:
        executeSyncProofs = () => syncProofs(SyncProofType.Receive);
        break;
      case RailgunWalletBalanceBucket.MissingInternalPOI:
        executeSyncProofs = () => syncProofs(SyncProofType.Spend);
        break;
      case RailgunWalletBalanceBucket.ShieldBlocked:
      case RailgunWalletBalanceBucket.Spendable:
      case RailgunWalletBalanceBucket.Spent:
        break;
    }

    const shouldAllowUnshieldToOrigin = [
      RailgunWalletBalanceBucket.ShieldPending,
      RailgunWalletBalanceBucket.ShieldBlocked,
    ].includes(balanceBucket);

    if (shouldAllowUnshieldToOrigin) {
      buttons.push({
        text: 'Unshield to origin',
        action: unshieldToOrigin,
      });
    }

    if (isDefined(executeSyncProofs)) {
      buttons.push({
        text: 'Resync proofs',
        action: executeSyncProofs,
      });
    }

    buttons.push({
      text: `View on ${getExternalScanSiteName(network.current.name)}`,
      action: promptExternalSite,
    });

    return buttons;
  };

  const poiStatusText = getTransactionPOIStatusInfoText(
    balanceBucket,
    transaction,
    network.current,
  );

  const renderContent = (): ReactNode => {
    const isLongMemo =
      isDefined(transaction.memoText) && transaction.memoText.length > 200;

    const memo =
      isLongMemo && !showMemoFullLength
        ? `${transaction.memoText?.slice(0, 200).trim()}…`
        : transaction.memoText;

    return (
      <div className={styles.leftViewContainer}>
        <div className={styles.statusContainer}>
          <div
            className={styles.statusIndicator}
            style={{
              backgroundColor: getTransactionPOIStatusColor(balanceBucket),
            }}
          />
          <Text className={styles.statusText}>
            {formatBalanceBucketStatus(balanceBucket).toUpperCase()}
          </Text>
        </div>
        <Text className={cn(styles.transactionText, 'selectable-text')}>
          {transactionText(
            transaction,
            isRailgunForTokenInfo,
            network.current,
            wallets.active,
            wallets.available,
          )}
        </Text>
        {isDefined(transaction.memoText) && (
          <Text
            className={cn(
              styles.memoText,
              { [styles.memoTextHovered]: memoHover && isLongMemo },
              'selectable-text',
            )}
            onMouseEnter={() => setMemoHover(true)}
            onMouseLeave={() => setMemoHover(false)}
            onClick={
              isLongMemo
                ? () => {
                    setShowMemoFullLength(!showMemoFullLength);
                  }
                : undefined
            }
          >
            "{memo}"
          </Text>
        )}
        {isDefined(transaction.failedErrorMessage) && (
          <Text className={cn(styles.failedErrorText, 'selectable-text')}>
            Error: "{transaction.failedErrorMessage}"
          </Text>
        )}
        <div className={styles.footerWrapper}>
          <div className={styles.footerTextWrapper}>
            <Text className={styles.footerText}>
              {formatTransactionTimestamp(transaction.timestamp)}
            </Text>
            {isDefined(poiStatusText) && (
              <div className={styles.poiStatusTextWrapper}>
                {renderIcon(IconType.Info, 22, styleguide.colors.textSecondary)}
                <Text className={styles.footerText}>{poiStatusText}</Text>
              </div>
            )}
          </div>
          <div>
            {bottomActionButtons().map((button, index) => (
              <TextButton
                key={index}
                containerClassName={styles.bottomActionButton}
                text={button.text}
                action={button.action}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={styles.transactionItemWrapper}>{renderContent()}</div>
      {alert && <GenericAlert {...alert} />}
      {errorModal && <ErrorDetailsModal {...errorModal} />}
      {isLoading && <FullScreenSpinner />}
    </>
  );
};
