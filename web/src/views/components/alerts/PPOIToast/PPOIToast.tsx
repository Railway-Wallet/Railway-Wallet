import {
  delay,
  isDefined,
  POIProofEventStatus,
  TXIDVersion,
} from '@railgun-community/shared-models';
import { useEffect, useState } from 'react';
import { Tooltip } from 'react-tooltip';
import cn from 'classnames';
import { Button } from '@components/Button/Button';
import { Spinner } from '@components/loading/Spinner/Spinner';
import { ProgressBar } from '@components/ProgressBar/ProgressBar';
import { Text } from '@components/Text/Text';
import { UseUnloadComponent } from '@components/UseUnloadComponent/UseUnloadComponent';
import {
  generateAllPOIsForWallet,
  logDevError,
  POIProofEventStatusUI,
  refreshRailgunBalances,
  showImmediateToast,
  styleguide,
  syncRailgunTransactionsV2,
  ToastType,
  useAppDispatch,
  useBalancePriceRefresh,
  usePOIProofStatus,
  useReduxSelector,
} from '@react-shared';
import {
  ErrorDetailsModal,
  ErrorDetailsModalProps,
} from '@screens/modals/ErrorDetailsModal/ErrorDetailsModal';
import { IconType, renderIcon } from '@services/util/icon-service';
import { copyToClipboard } from '@utils/clipboard';
import styles from './PPOIToast.module.scss';

export const PPOIToast = () => {
  const dispatch = useAppDispatch();
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const { txidVersion } = useReduxSelector('txidVersion');
  const { poiProofProgressStatus, shouldShowAllProofsCompleted } =
    usePOIProofStatus();
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

  const [loadingTryAgain, setLoadingTryAgain] = useState(false);
  const railWalletID = wallets.active?.railWalletID;

  useEffect(() => {
    const runPullBalanceCheck = async () => {
      if (shouldShowAllProofsCompleted && isDefined(wallets.active)) {
        await delay(2500);

        await pullBalances(wallets.active);
        if (txidVersion.current === TXIDVersion.V2_PoseidonMerkle) {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          syncRailgunTransactionsV2(network.current.name);
        }
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    runPullBalanceCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldShowAllProofsCompleted]);

  const newTrxProcessing =
    poiProofProgressStatus?.status ===
    POIProofEventStatusUI.NewTransactionLoading;
  const loadingNextBatch =
    poiProofProgressStatus?.status === POIProofEventStatus.LoadingNextBatch;
  const inProgress =
    poiProofProgressStatus?.status === POIProofEventStatus.InProgress;
  const errorMessage = poiProofProgressStatus?.errMessage;
  const progress = poiProofProgressStatus?.progress ?? 0;
  const totalPOIs = poiProofProgressStatus?.totalCount ?? 0;
  const currentPOIIndex = poiProofProgressStatus?.index ?? 0;
  const txid = poiProofProgressStatus?.txid ?? 'none';
  const listKey = poiProofProgressStatus?.listKey ?? 'none';
  const railgunTXID = poiProofProgressStatus?.railgunTxid ?? 'none';

  const loadingState = newTrxProcessing || loadingNextBatch;
  const shouldLetUserExit =
    shouldShowAllProofsCompleted || isDefined(errorMessage);
  const dataTooltipContent = `<div><p>List Key: ${listKey}</p><p>Railgun TXID: ${railgunTXID}</p><p>${network.current.shortPublicName} TXID: ${txid}</p></div>`;
  const progressText = `Generating ${
    isDefined(poiProofProgressStatus?.index) ? currentPOIIndex + 1 : 0
  } of ${totalPOIs}...`;
  const title = shouldShowAllProofsCompleted
    ? 'Private Proof of Innocence completed'
    : 'Private Proof of Innocence';

  const shouldShowPOIToast = () => {
    if (shouldShowAllProofsCompleted || newTrxProcessing) {
      return true;
    }

    if (poiProofProgressStatus) {
      if (inProgress && poiProofProgressStatus.totalCount === 0) {
        return false;
      }
      return true;
    }

    return false;
  };

  if (!shouldShowPOIToast()) {
    return null;
  }

  const handleCopyData = async () => {
    if (loadingState) {
      return;
    }

    await copyToClipboard(
      `List Key: ${listKey} / Railgun TXID: ${railgunTXID} / ${network.current.shortPublicName} TXID: ${txid}`,
    );
    dispatch(
      showImmediateToast({
        message: `Transaction info copied to clipboard.`,
        type: ToastType.Copy,
      }),
    );
  };

  const handleTryAgain = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.stopPropagation();

    if (loadingTryAgain || !isDefined(railWalletID)) {
      return;
    }
    setLoadingTryAgain(true);

    try {
      await generateAllPOIsForWallet(network.current.name, railWalletID);
      setLoadingTryAgain(false);
    } catch (cause) {
      setLoadingTryAgain(false);
      logDevError(new Error('Retry generate POIs failed', { cause }));
    }
  };

  const getViewContent = () => {
    if (shouldShowAllProofsCompleted) {
      return null;
    }

    if (loadingState) {
      return (
        <>
          <div className={styles.loadingBatchContainer}>
            <Spinner size={16} />
            <Text>
              {newTrxProcessing
                ? 'Waiting to trigger...'
                : 'Loading next batch...'}
            </Text>
          </div>
          <Text className={styles.warningText}>
            Do not close the app while processing
          </Text>
        </>
      );
    }

    if (isDefined(errorMessage)) {
      return loadingTryAgain ? (
        <Spinner size={16} className={styles.loadingTryAgain} />
      ) : (
        <>
          <div className={styles.textContentContainer}>
            {renderIcon(IconType.Warning, 20, styleguide.colors.error())}
            <Text className={styles.progressText}>{progressText}</Text>
          </div>
          <Text className={styles.errorText}>{errorMessage}</Text>
          <Button
            children="Try again"
            onClick={handleTryAgain}
            loading={loadingTryAgain}
            buttonClassName={styles.retryButton}
          />
        </>
      );
    }

    return (
      <div className={styles.progressContainer}>
        <div className={styles.textContentContainer}>
          {renderIcon(IconType.Shield, 20, styleguide.colors.txGreen())}
          <Text className={styles.progressText}>{progressText}</Text>
        </div>
        <ProgressBar progress={progress} className={styles.progressBar} />
        <Text className={styles.warningText}>
          Do not close the app while processing
        </Text>
      </div>
    );
  };

  return (
    <div>
      {!loadingState && (
        <Tooltip id="tooltip" place="top" className={styles.tooltip} />
      )}
      <div
        data-tooltip-place="bottom"
        data-tooltip-html={dataTooltipContent}
        data-tooltip-id="tooltip"
        className={cn(styles.toastContainer, {
          [styles.toastContainerError]: isDefined(errorMessage),
        })}
        onClick={handleCopyData}
      >
        <div className={styles.headerContainer}>
          {shouldShowAllProofsCompleted &&
            renderIcon(IconType.CheckCircle, 35, styleguide.colors.txGreen())}
          <Text className={styles.title}>{title}</Text>
        </div>
        {getViewContent()}
        {errorModal && <ErrorDetailsModal {...errorModal} />}
        {!shouldLetUserExit && (
          <UseUnloadComponent message="Are you sure you want to leave? Proof of Innocence processing is not complete." />
        )}
      </div>
    </div>
  );
};
