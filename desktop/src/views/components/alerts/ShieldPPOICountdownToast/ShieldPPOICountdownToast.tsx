import { isDefined,TXIDVersion } from '@railgun-community/shared-models';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Text } from '@components/Text/Text';
import { TextButton } from '@components/TextButton/TextButton';
import {
  closeShieldPOICountdownToast,
  formatTimeToText,
  getShieldingPOIDisclaimerMessage,
  getWaitTimeForShieldPending,
  networkForName,
  refreshRailgunBalances,
  shortenTokenAddress,
  syncRailgunTransactionsV2,
  transactionLinkOnExternalScanSite,
  useAppDispatch,
  useBalancePriceRefresh,
  useReduxSelector,
} from '@react-shared';
import {
  createExternalSiteAlert,
  createPOIDisclaimerAlert,
  ExternalSiteAlertMessages,
} from '@utils/alerts';
import { Button } from '@views/components/Button/Button';
import { AlertProps, GenericAlert } from '../GenericAlert/GenericAlert';
import styles from './ShieldPPOICountdownToast.module.scss';

export const ShieldPPOICountdownToast = () => {
  const { remoteConfig } = useReduxSelector('remoteConfig');
  const {
    shieldPOICountdownToast: { isOpen, tx },
  } = useReduxSelector('shieldPOICountdownToast');
  const { txidVersion } = useReduxSelector('txidVersion');
  const dispatch = useAppDispatch();

  const waitTimeForNetwork = useMemo(
    () =>
      isDefined(tx) ? getWaitTimeForShieldPending(tx.networkName) ?? 0 : 0,
    [tx],
  );

  const [isHiddenView, setIsHiddenView] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [alert, setAlert] = useState<AlertProps | undefined>(undefined);
  const [externalLinkAlert, setExternalLinkAlert] = useState<
    AlertProps | undefined
  >(undefined);

  const { pullBalances } = useBalancePriceRefresh(
    refreshRailgunBalances,
    () => {},
  );

  const handleCloseToast = useCallback(async () => {
    dispatch(closeShieldPOICountdownToast());

    await pullBalances();
    if (
      txidVersion.current === TXIDVersion.V2_PoseidonMerkle &&
      isDefined(tx)
    ) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      syncRailgunTransactionsV2(tx.networkName);
    }
  }, [dispatch, pullBalances, txidVersion, tx]);

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (isDefined(tx)) {
        const timestampInSeconds = tx.timestamp + waitTimeForNetwork;
        const differenceInSeconds = Math.floor(
          timestampInSeconds - Date.now() / 1000,
        );
        setTimeLeft(differenceInSeconds);
      } else {
        setTimeLeft(0);
      }
    };

    calculateTimeLeft();

    const timer = setTimeout(() => {
      if (timeLeft > 0) {
        calculateTimeLeft();
      } else if (timeLeft === 0 || timeLeft < 0) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        handleCloseToast();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [handleCloseToast, timeLeft, tx, waitTimeForNetwork]);

  const handleOpenTransaction = () => {
    if (!tx) return;

    const url = transactionLinkOnExternalScanSite(tx.networkName, tx.id);

    if (isDefined(url)) {
      createExternalSiteAlert(
        url,
        setAlert,
        dispatch,
        ExternalSiteAlertMessages.OPEN_EXTERNAL_TRANSACTION,
      );
    }
  };

  const handleLearnMore = () => {
    if (!tx) return;
    const network = networkForName(tx.networkName);

    if (network) {
      createPOIDisclaimerAlert(
        'Shielding',
        getShieldingPOIDisclaimerMessage(network),
        setAlert,
        setExternalLinkAlert,
        dispatch,
        remoteConfig?.current?.poiDocumentation,
      );
    }
  };

  const toggleHiddenView = () => {
    setIsHiddenView(!isHiddenView);
  };

  if (!isOpen || timeLeft <= 0) {
    return null;
  }

  const shortTX = isDefined(tx) ? shortenTokenAddress(tx.id) : '';

  return (
    <div>
      {isHiddenView ? (
        <div className={styles.toastContainerHidden} onClick={toggleHiddenView}>
          <Text className={styles.countdownHidden}>{`${formatTimeToText(
            timeLeft,
          )}`}</Text>
        </div>
      ) : (
        <div className={styles.toastContainer}>
          <Text className={styles.title}>
            Shield mined. Waiting for your Private Proof of Innocence:
          </Text>
          <TextButton
            text={shortTX}
            containerClassName={styles.textHighlightContainer}
            textClassName={styles.textHighlight}
            action={handleOpenTransaction}
          />
          <div className={styles.countdownContainer}>
            <Text className={styles.countdownEst}>Est.</Text>
            <Text className={styles.countdown}>{`${formatTimeToText(
              timeLeft,
            )}`}</Text>
          </div>
          <Text className={styles.disclaimerText}>
            Have a coffee, relax, and come back soon.
          </Text>
          <div className={styles.buttonsContainer}>
            <Button
              children="Hide"
              onClick={toggleHiddenView}
              buttonClassName={styles.fullLengthButtonStyle}
            />
            <Button
              children="Learn More"
              onClick={handleLearnMore}
              buttonClassName={styles.fullLengthButtonStyle}
            />
          </div>
        </div>
      )}
      {alert && <GenericAlert {...alert} />}
      {externalLinkAlert && <GenericAlert {...externalLinkAlert} />}
    </div>
  );
};
