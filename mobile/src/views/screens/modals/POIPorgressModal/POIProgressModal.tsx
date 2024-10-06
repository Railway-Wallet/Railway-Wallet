import {
  delay,
  isDefined,
  POIProofEventStatus,
  TXIDVersion,
} from "@railgun-community/shared-models";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Bar as ProgressBar } from "react-native-progress";
import { HeaderBackButton } from "@components/headers/headerSideComponents/HeaderBackButton/HeaderBackButton";
import Clipboard from "@react-native-clipboard/clipboard";
import {
  generateAllPOIsForWallet,
  IconShielded,
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
} from "@react-shared";
import {
  ErrorDetailsModal,
  ErrorDetailsModalProps,
} from "@screens/modals/ErrorDetailsModal/ErrorDetailsModal";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { ButtonTextOnly } from "@views/components/buttons/ButtonTextOnly/ButtonTextOnly";
import { AppHeader } from "@views/components/headers/AppHeader/AppHeader";
import { Icon } from "@views/components/icons/Icon";
import { styles } from "./styles";

type Props = {
  showPOIModalInfo: boolean;
  closeModal: () => void;
};

export const POIProgressModal = ({ showPOIModalInfo, closeModal }: Props) => {
  const { poiProofProgressStatus, shouldShowAllProofsCompleted } =
    usePOIProofStatus();
  const dispatch = useAppDispatch();
  const { wallets } = useReduxSelector("wallets");
  const { network } = useReduxSelector("network");
  const { txidVersion } = useReduxSelector("txidVersion");
  const railWalletID = wallets.active?.railWalletID;
  const networkShortPublicName = network.current.shortPublicName;

  const [loadingTryAgain, setLoadingTryAgain] = useState(false);
  const [showErrorDetailsModal, setShowErrorDetailsModal] = useState(false);
  const [errorModal, setErrorModal] =
    useState<Optional<ErrorDetailsModalProps>>(undefined);

  const openErrorDetailsModal = () => {
    setShowErrorDetailsModal(true);
  };
  const dismissErrorDetailsModal = () => {
    setShowErrorDetailsModal(false);
  };

  const { pullBalances } = useBalancePriceRefresh(
    refreshRailgunBalances,
    (error: Error) =>
      setErrorModal({
        show: true,
        error,
        onDismiss: () => setErrorModal(undefined),
      })
  );

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

  const loadingNextBatch =
    poiProofProgressStatus?.status === POIProofEventStatus.LoadingNextBatch;
  const newTrxProcessing =
    poiProofProgressStatus?.status ===
    POIProofEventStatusUI.NewTransactionLoading;
  const errMessage = poiProofProgressStatus?.errMessage;
  const progress = poiProofProgressStatus?.progress ?? 0;
  const totalPOIs = poiProofProgressStatus?.totalCount ?? 0;
  const currentPOIIndex = poiProofProgressStatus?.index ?? 0;
  const txid = poiProofProgressStatus?.txid ?? "none";
  const listKey = poiProofProgressStatus?.listKey ?? "none";
  const railgunTXID = poiProofProgressStatus?.railgunTxid ?? "none";
  const currentPOI = isDefined(poiProofProgressStatus?.index)
    ? currentPOIIndex + 1
    : 0;
  const progressText = `Generating ${
    isDefined(poiProofProgressStatus?.index) ? currentPOIIndex + 1 : 0
  } of ${totalPOIs}...`;
  const hideInfo =
    loadingNextBatch || newTrxProcessing || shouldShowAllProofsCompleted;

  const handleTryAgain = async () => {
    if (loadingTryAgain || !isDefined(railWalletID)) {
      return;
    }
    setLoadingTryAgain(true);

    try {
      await generateAllPOIsForWallet(network.current.name, railWalletID);
      setLoadingTryAgain(false);
    } catch (cause) {
      logDevError(new Error("Retry generate POIs failed", { cause }));
      setLoadingTryAgain(false);
    }
  };

  const getViewContent = () => {
    if (shouldShowAllProofsCompleted) {
      return (
        <View style={styles.progressContainer}>
          <Icon
            source="check-circle-outline"
            size={22}
            color={styleguide.colors.txGreen()}
          />
          <Text style={styles.title}>
            {"Private Proof of Innocence completed"}
          </Text>
        </View>
      );
    }

    if (loadingNextBatch || newTrxProcessing) {
      return (
        <>
          <View style={styles.loadingContainer}>
            <ActivityIndicator />
            <Text style={styles.title}>
              {newTrxProcessing
                ? "Waiting to trigger..."
                : "Loading next batch..."}
            </Text>
          </View>
          <Text style={styles.warningText}>
            {"Do not close the app while processing"}
          </Text>
        </>
      );
    }

    if (isDefined(errMessage)) {
      return loadingTryAgain ? (
        <ActivityIndicator style={styles.tryAgain} />
      ) : (
        <>
          <View style={styles.progressContainer}>
            <Icon
              source={"alert-circle-outline"}
              size={22}
              color={styleguide.colors.danger}
            />
            <Text style={styles.title}>{progressText}</Text>
          </View>
          <Text style={[styles.text, styles.errorText]}>
            {errMessage}{" "}
            <Text style={styles.errorShowMore} onPress={openErrorDetailsModal}>
              (show more)
            </Text>
          </Text>
          <ButtonTextOnly
            title="Try again"
            onTap={handleTryAgain}
            viewStyle={styles.tryAgain}
          />
        </>
      );
    }

    return (
      <>
        <View style={styles.progressContainer}>
          <Icon
            source={IconShielded()}
            size={22}
            color={styleguide.colors.txGreen()}
          />
          <Text
            style={styles.title}
          >{`Generating ${currentPOI} of ${totalPOIs}...`}</Text>
        </View>
        <View style={styles.progressBarWrapper}>
          <ProgressBar
            progress={progress / 100}
            color={styleguide.colors.txGreen()}
            borderColor={styleguide.colors.white}
            width={300}
          />
        </View>
        <Text style={styles.warningText}>
          {"Do not close the app while processing"}
        </Text>
      </>
    );
  };

  const handleCopyData = () => {
    triggerHaptic(HapticSurface.ClipboardCopy);
    Clipboard.setString(
      `List Key: ${listKey} / Railgun TXID: ${railgunTXID} / ${network.current.shortPublicName} TXID: ${txid}`
    );
    dispatch(
      showImmediateToast({
        message: `Transaction info copied to clipboard.`,
        type: ToastType.Copy,
      })
    );
  };

  return (
    <Modal
      visible={showPOIModalInfo}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={closeModal}
    >
      <>
        <AppHeader
          isModal
          title="Private Proof of Innocence"
          headerStatusBarHeight={16}
          backgroundColor={styleguide.colors.gray5()}
          headerLeft={<HeaderBackButton customAction={closeModal} />}
        />
        <View style={styles.container}>
          {getViewContent()}
          {!hideInfo && (
            <>
              <TouchableOpacity
                style={styles.copyContainer}
                onPress={handleCopyData}
              >
                <View style={styles.copyButtonContainer}>
                  <Icon
                    source="content-copy"
                    size={22}
                    color={styleguide.colors.white}
                  />
                </View>
                <Text style={styles.text}>{`List Key: ${listKey}`}</Text>
                <Text
                  style={styles.text}
                >{`Railgun TXID: ${railgunTXID}`}</Text>
                <Text
                  style={styles.text}
                >{`${networkShortPublicName} TXID: ${txid}`}</Text>
              </TouchableOpacity>
              <Text style={styles.warningText}>
                {
                  "Private Proof of Innocence is an intense operation. If you have many proofs to generate, we recommend using the desktop app, which will prove much faster."
                }
              </Text>
            </>
          )}
        </View>
        {showErrorDetailsModal &&
          isDefined(errMessage) &&
          errMessage.length > 0 && (
            <ErrorDetailsModal
              error={new Error(errMessage)}
              show={showErrorDetailsModal}
              onDismiss={dismissErrorDetailsModal}
            />
          )}
        {isDefined(errorModal) && <ErrorDetailsModal {...errorModal} />}
      </>
    </Modal>
  );
};
