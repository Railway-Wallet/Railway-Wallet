import { isDefined } from '@railgun-community/shared-models';
import React, { ReactNode, SyntheticEvent, useState } from 'react';
import cn from 'classnames';
import {
  AlertProps,
  GenericAlert,
} from '@components/alerts/GenericAlert/GenericAlert';
import { Text } from '@components/Text/Text';
import {
  TextActionButton,
  TextButton,
} from '@components/TextButton/TextButton';
import {
  AddTokensData,
  CancelTransactionData,
  DrawerName,
  EVENT_OPEN_DRAWER_WITH_DATA,
} from '@models/drawer-types';
import {
  BlockedBroadcasterService,
  broadcasterFeeTransactionText,
  canCancelTransaction,
  canMarkAsFailedTransaction,
  compareTokens,
  ERC20Token,
  formatTransactionTimestamp,
  getDistinctERC20Tokens,
  getExternalScanSiteName,
  isNonSpendableBucket,
  ProviderService,
  railgunFeeTransactionText,
  SavedTransaction,
  SavedTransactionStore,
  shortenTokenAddress,
  shortenWalletAddress,
  showImmediateToast,
  ToastType,
  transactionLinkOnExternalScanSite,
  TransactionStatus,
  transactionStatusIconColor,
  transactionSyncedHistoryDescription,
  transactionText,
  transactionTitle,
  txidVersionTransactionText,
  useAddedTokenSearch,
  useAppDispatch,
  useReduxSelector,
} from '@react-shared';
import { drawerEventsBus } from '@services/navigation/drawer-events';
import {
  createExternalSiteAlert,
  ExternalSiteAlertMessages,
} from '@utils/alerts';
import { copyToClipboard } from '@utils/clipboard';
import { PendingBalancesModal } from '@views/screens/modals/POI/PendingBalancesModal/PendingBalancesModal';
import styles from './TransactionItem.module.scss';

type Props = {
  transaction: SavedTransaction;
  filteredToken?: ERC20Token;
  isRailgunForTokenInfo?: boolean;
  generatePOIs?: () => void;
  refreshPOILists?: () => void;
  poiRequired: boolean;
};

export const TransactionItem: React.FC<Props> = ({
  transaction,
  filteredToken,
  isRailgunForTokenInfo = false,
  generatePOIs,
  refreshPOILists,
  poiRequired,
}) => {
  const [showMemoFullLength, setShowMemoFullLength] = useState(false);
  const [alert, setAlert] = useState<AlertProps | undefined>(undefined);
  const [memoHover, setMemoHover] = useState(false);
  const [showPendingBalancesModal, setShowPendingBalancesModal] =
    useState(false);

  const { broadcasterBlocklist } = useReduxSelector('broadcasterBlocklist');
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const { tokens } = useAddedTokenSearch();
  const dispatch = useAppDispatch();

  if (!wallets.active) {
    return null;
  }

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

  const cancelTransaction = async (e: SyntheticEvent) => {
    e.stopPropagation();

    const provider = await ProviderService.getProvider(network.current.name);
    const txResponse = await provider.getTransaction(transaction.id);

    if (!txResponse) {
      setAlert({
        title: 'Cannot cancel',
        message: `Unable to find transaction with hash ${transaction.id}. Mark this transaction as failed?\n\nWarning: If you submitted this transaction recently, it may take up to 30 minutes to appear on the blockchain.`,
        onClose: () => setAlert(undefined),
        submitTitle: 'Mark as Failed',
        onSubmit: async () => {
          setAlert(undefined);
          await markAsFailed();
        },
      });
      return;
    }

    drawerEventsBus.dispatch(EVENT_OPEN_DRAWER_WITH_DATA, {
      drawerName: DrawerName.CancelTransaction,
      extraData: {
        transaction: transaction,
        txResponse: txResponse,
      } as CancelTransactionData,
    });
  };

  const markAsFailedTransaction = (e: SyntheticEvent) => {
    e.stopPropagation();

    setAlert({
      title: 'WARNING',
      message: `Please note that this action will not cancel the pending transaction, which may still complete. This action will remove the badge notification on the Activity tab, and set this transaction's status as FAILED.`,
      onClose: () => setAlert(undefined),
      submitTitle: 'Mark as Failed',
      onSubmit: async () => {
        setAlert(undefined);
        await markAsFailed();
      },
    });
  };

  const markAsFailed = async () => {
    const savedTransactionStore = new SavedTransactionStore(dispatch);
    await savedTransactionStore.updateTransactionAsFailed(
      transaction.id,
      network.current.name,
      transaction.walletAddress,
      undefined,
    );
  };

  const addCustomToken = (token: ERC20Token) => {
    const extraData: AddTokensData = {
      customTokenAddress: token.address,
    };
    drawerEventsBus.dispatch(EVENT_OPEN_DRAWER_WITH_DATA, {
      drawerName: DrawerName.AddTokens,
      extraData,
    });
  };

  const blockBroadcaster = async (pubKey?: string) => {
    if (isDefined(pubKey)) {
      const blockedBroadcasterService = new BlockedBroadcasterService(dispatch);
      await blockedBroadcasterService.addBlockedBroadcaster(
        pubKey,
        undefined,
      );

      setAlert({
        title: 'Public broadcaster added to block list.',
        onClose: () => setAlert(undefined),
      });
    }
  };

  const openPendingBalances = () => {
    setShowPendingBalancesModal(true);
  };

  const isReceivedPOIPending =
    isDefined(transaction.balanceBucket) &&
    isNonSpendableBucket(transaction.balanceBucket);

  const isSpentPOIPending = transaction.pendingSpentPOI ?? false;

  const handleCopyTransactionHash = async () => {
    await copyToClipboard(transaction.id);
    dispatch(
      showImmediateToast({
        message: `${shortenWalletAddress(transaction.id)} copied to clipboard`,
        type: ToastType.Copy,
      }),
    );
  };

  const bottomActionButtons = (): TextActionButton[] => {
    let buttons: TextActionButton[] = [];
    buttons.push({
      text: `View on ${getExternalScanSiteName(network.current.name)}`,
      action: promptExternalSite,
    });
    buttons.push({
      text: `Copy transaction hash`,
      action: handleCopyTransactionHash,
    });

    if (
      isDefined(transaction.syncedHistoryVersion) &&
      transaction.syncedHistoryVersion !== 0
    ) {
      buttons.push({
        text: `About v${transaction.syncedHistoryVersion} RAILGUN history`,
        action: showSyncedHistoryDescriptionPopup,
      });
    }
    if (canCancelTransaction(transaction)) {
      buttons.push({
        text: 'Cancel transaction',
        action: cancelTransaction,
      });
    }
    if (canMarkAsFailedTransaction(transaction)) {
      buttons.push({
        text: 'Mark as failed',
        action: markAsFailedTransaction,
      });
    }

    let unknownERC20s: ERC20Token[] = [];

    transaction.tokenAmounts.forEach(amount => {
      const { token } = amount;
      if (token.isAddressOnly ?? false) {
        unknownERC20s.push(token);
      }
    });

    transaction.syncedReceiveTokenAmounts?.forEach(amount => {
      const { token } = amount;
      if (token.isAddressOnly ?? false) {
        unknownERC20s.push(token);
      }
    });

    const uniqueUnknownERC20s: ERC20Token[] =
      getDistinctERC20Tokens(unknownERC20s);

    uniqueUnknownERC20s.forEach(token => {
      let tokenAdded = false;
      for (const addedToken of tokens) {
        const match = compareTokens(addedToken, token);
        if (match) {
          tokenAdded = true;
          break;
        }
      }

      if (!tokenAdded) {
        buttons.push({
          text: `Add token to wallet: ${shortenTokenAddress(token.address)}`,
          action: () => addCustomToken(token),
        });
      }
    });

    if (
      transaction.status === TransactionStatus.failed &&
      isDefined(transaction.broadcasterRailgunAddress) &&
      !BlockedBroadcasterService.isBroadcasterBlocked(
        transaction.broadcasterRailgunAddress,
        broadcasterBlocklist.broadcasters,
      )
    ) {
      buttons.push({
        text: 'Block this public broadcaster',
        action: () => blockBroadcaster(transaction.broadcasterRailgunAddress),
      });
    }

    if (poiRequired) {
      if (isReceivedPOIPending) {
        buttons.push({
          text: 'View pending balances',
          action: openPendingBalances,
        });

        if (isDefined(refreshPOILists)) {
          buttons.push({
            text: 'Resync proofs',
            action: refreshPOILists,
          });
        }
      }

      if (isSpentPOIPending && isDefined(generatePOIs)) {
        buttons.push({
          text: 'Generate Proof',
          action: generatePOIs,
        });
      }
    }

    return buttons;
  };

  const showSyncedHistoryDescriptionPopup = () => {
    const description = transactionSyncedHistoryDescription(transaction);
    if (!isDefined(description)) {
      return;
    }
    setAlert({
      title: `On-chain history v${transaction.syncedHistoryVersion}`,
      message: description,
      onClose: () => setAlert(undefined),
    });
  };

  const renderContent = (): ReactNode => {
    if (!wallets.active) {
      return;
    }

    const railgunFee = railgunFeeTransactionText(
      transaction,
      wallets.available,
      filteredToken,
    );
    const broadcasterFee = broadcasterFeeTransactionText(
      transaction,
      wallets.active,
      wallets.available,
    );

    const isLongMemo =
      isDefined(transaction.memoText) && transaction.memoText.length > 200;

    const memo =
      isLongMemo && !showMemoFullLength
        ? `${transaction.memoText?.slice(0, 200).trim()}…`
        : transaction.memoText;

    const txidVersionText = txidVersionTransactionText(transaction);

    return (
      <div className={styles.leftViewContainer}>
        <div className={styles.statusContainer}>
          <div
            className={styles.statusIndicator}
            style={{
              backgroundColor: transactionStatusIconColor(transaction),
            }}
          />
          <Text className={styles.statusText}>
            {transactionTitle(transaction)}
          </Text>
        </div>
        <Text className={cn(styles.transactionText, 'selectable-text')}>
          {transactionText(
            transaction,
            isRailgunForTokenInfo,
            network.current,
            wallets.active,
            wallets.available,
            filteredToken,
          )}
        </Text>
        {isDefined(railgunFee) && (
          <Text className={cn(styles.feeText, 'selectable-text')}>
            {railgunFee}
          </Text>
        )}
        {isDefined(broadcasterFee) && (
          <Text className={cn(styles.feeText, 'selectable-text')}>
            {broadcasterFee}
          </Text>
        )}
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
          <Text className={styles.footerText}>
            {formatTransactionTimestamp(transaction.timestamp)}
            {isDefined(txidVersionText) ? ` • ${txidVersionText}` : null}
            {isDefined(transaction.nonce)
              ? ` • Nonce ${transaction.nonce}`
              : null}
            {transaction.sentViaBroadcaster &&
            !(transaction.syncedFromRailgun ?? false)
              ? ` • Sent via public broadcaster`
              : null}
            {transaction.syncedFromRailgun ?? false
              ? ` • Synced from encrypted on-chain history`
              : null}
            {transaction.sentViaBroadcaster &&
            !(transaction.syncedFromRailgun ?? false) &&
            !(transaction.foundBySync ?? false)
              ? ` • Not yet synced to RAILGUN balance`
              : null}
          </Text>
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

  const formatTimestampDate = () => {
    const date = new Date(transaction.timestamp * 1000);
    return `${date.toDateString()} at ${date.toLocaleTimeString()}`;
  };

  return (
    <>
      <div
        className={cn(styles.transactionItemWrapper, {
          [styles.transactionItemWrapperDisabled]:
            isReceivedPOIPending || isSpentPOIPending,
        })}
        title={formatTimestampDate()}
      >
        {renderContent()}
      </div>
      {alert && <GenericAlert {...alert} />}
      {showPendingBalancesModal && (
        <PendingBalancesModal
          onClose={() => {
            setShowPendingBalancesModal(false);
          }}
          initialBalanceBucket={transaction.balanceBucket}
        />
      )}
    </>
  );
};
