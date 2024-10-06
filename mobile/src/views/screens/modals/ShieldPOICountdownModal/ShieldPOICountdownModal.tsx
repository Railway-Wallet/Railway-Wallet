import { isDefined, TXIDVersion } from "@railgun-community/shared-models";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, Text, View } from "react-native";
import {
  AlertProps,
  GenericAlert,
} from "@components/alerts/GenericAlert/GenericAlert";
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
} from "@react-shared";
import { openExternalLinkAlert } from "@services/util/alert-service";
import { createPOIDisclaimerAlert } from "@utils/alerts";
import { ButtonTextOnly } from "@views/components/buttons/ButtonTextOnly/ButtonTextOnly";
import { styles } from "./styles";

export const ShieldPOICountdownModal = () => {
  const { remoteConfig } = useReduxSelector("remoteConfig");
  const {
    shieldPOICountdownToast: { isOpen, tx },
  } = useReduxSelector("shieldPOICountdownToast");
  const { txidVersion } = useReduxSelector("txidVersion");
  const dispatch = useAppDispatch();

  const [timeLeft, setTimeLeft] = useState(0);
  const [alert, setAlert] = useState<AlertProps | undefined>(undefined);

  const { pullBalances } = useBalancePriceRefresh(
    refreshRailgunBalances,
    () => {}
  );

  const handleCloseModal = useCallback(async () => {
    dispatch(closeShieldPOICountdownToast());

    await pullBalances();
    if (
      txidVersion.current === TXIDVersion.V2_PoseidonMerkle &&
      isDefined(tx)
    ) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      syncRailgunTransactionsV2(tx.networkName);
    }
  }, [dispatch, pullBalances, tx, txidVersion]);

  const waitTimeForNetwork = useMemo(
    () =>
      isDefined(tx) ? getWaitTimeForShieldPending(tx.networkName) ?? 0 : 0,
    [tx]
  );
  const shortTX = isDefined(tx) ? shortenTokenAddress(tx.id) : "";

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (isDefined(tx)) {
        const timestampInSeconds = tx.timestamp + waitTimeForNetwork;
        const differenceInSeconds = Math.floor(
          timestampInSeconds - Date.now() / 1000
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
        handleCloseModal();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [handleCloseModal, timeLeft, tx, waitTimeForNetwork]);

  const handleOpenTransaction = () => {
    if (!tx) return;

    const url = transactionLinkOnExternalScanSite(tx.networkName, tx.id);

    if (isDefined(url)) {
      openExternalLinkAlert(url, dispatch);
    }
  };

  const handleLearnMore = () => {
    if (!tx) return;
    const network = networkForName(tx.networkName);

    if (network) {
      createPOIDisclaimerAlert(
        "Shielding",
        getShieldingPOIDisclaimerMessage(network),
        setAlert,
        dispatch,
        remoteConfig?.current?.poiDocumentation
      );
    }
  };

  const hide = !isOpen || timeLeft <= 0;

  return (
    <Modal
      visible={!hide}
      onRequestClose={handleCloseModal}
      transparent
      animationType="fade"
    >
      <View style={styles.containerBackground}>
        <View style={styles.container}>
          <Text style={styles.title}>
            Shield mined. Waiting for your Private Proof of Innocence:
          </Text>
          <Text style={styles.txText} onPress={handleOpenTransaction}>
            {shortTX}
          </Text>
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownEst}>Est.</Text>
            <Text style={styles.countdown}>{`${formatTimeToText(
              timeLeft
            )}`}</Text>
          </View>
          <Text style={styles.disclaimerText}>
            Have a coffee, relax, and come back soon.
          </Text>
          <View style={styles.buttonContainer}>
            <ButtonTextOnly
              title="Hide"
              onTap={handleCloseModal}
              viewStyle={styles.buttonStyle}
              labelStyle={styles.buttonTextStyle}
            />
            <ButtonTextOnly
              title="Learn More"
              onTap={handleLearnMore}
              viewStyle={styles.buttonStyle}
              labelStyle={styles.buttonTextStyle}
            />
          </View>
        </View>
      </View>
      <GenericAlert {...alert} />
    </Modal>
  );
};
