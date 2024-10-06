import {
  BroadcasterConnectionStatus,
  isDefined,
} from "@railgun-community/shared-models";
import React, { useEffect, useState } from "react";
import {
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import VersionNumber from "react-native-version-number";
import {
  AlertProps,
  GenericAlert,
} from "@components/alerts/GenericAlert/GenericAlert";
import { FloatingHeader } from "@components/headers/FloatingHeader/FloatingHeader";
import { FullScreenSpinner } from "@components/loading/FullScreenSpinner/FullScreenSpinner";
import { TabHeaderText } from "@components/text/TabHeaderText/TabHeaderText";
import {
  SettingsStackParamList,
  TokenStackParamList,
} from "@models/navigation-models";
import { CommonActions, NavigationProp } from "@react-navigation/native";
import {
  ERC20AmountRecipient,
  generateAllPOIsForWallet,
  getWalletTransactionHistory,
  logDevError,
  NonceStorageService,
  RailgunTransactionHistorySync,
  ReactConfig,
  refreshRailgunBalances,
  rescanFullUTXOMerkletreesAndWallets,
  resetFullTXIDMerkletreesV2,
  showImmediateToast,
  styleguide,
  ToastType,
  tryReconnectWakuBroadcasterClient,
  useAppDispatch,
  useBroadcasterConnectionStatus,
  usePOIRequiredForCurrentNetwork,
  useReduxSelector,
} from "@react-shared";
import { CreatePinModal } from "@screens/modals/CreatePinModal/CreatePinModal";
import {
  ErrorDetailsModal,
  ErrorDetailsModalProps,
} from "@screens/modals/ErrorDetailsModal/ErrorDetailsModal";
import { hasPinSet } from "@services/security/secure-app-service";
import { wipeDevice_DESTRUCTIVE } from "@services/security/wipe-device-service";
import { openExternalLinkAlert } from "@services/util/alert-service";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { openInAppBrowserLink } from "@services/util/in-app-browser-service";
import { openAppReviewLink } from "@services/util/in-app-review-service";
import {
  getPlatformDevice,
  isAndroid,
} from "@services/util/platform-os-service";
import { Constants } from "@utils/constants";
import { PendingBalancesModal } from "@views/screens/modals/POIBalanceBucketModal/PendingBalancesModal";
import { calculateFloatingHeaderOpacityFromPageContentOffset } from "../WalletsScreen/WalletFloatingHeader/WalletFloatingHeader";
import { SettingsListHeader } from "./SettingsListHeader/SettingsListHeader";
import { SettingsListItem } from "./SettingsListItem/SettingsListItem";
import { styles } from "./styles";

interface SettingsScreenProps {
  navigation: NavigationProp<SettingsStackParamList, "Settings">;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  navigation,
}) => {
  StatusBar.setBarStyle("light-content");

  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");

  const { poiRequired } = usePOIRequiredForCurrentNetwork();
  const {
    broadcasterConnectionStatus,
    statusText: broadcasterStatusText,
    indicatorColor: broadcasterIndicatorColor,
  } = useBroadcasterConnectionStatus();

  const [headerOpacity, setHeaderOpacity] = useState(0);
  const [loadingText, setLoadingText] = useState<Optional<string>>(undefined);
  const [showCreatePinButton, setShowCreatePinButton] = useState(true);
  const [showUpdatePinButton, setShowUpdatePinButton] = useState(true);
  const [showCreatePinModal, setShowCreatePinModal] = useState(false);
  const [pendingBalancesOpen, setPendingBalancesOpen] = useState(false);
  const [alert, setAlert] = useState<AlertProps>({});
  const insets = useSafeAreaInsets();
  const [errorModal, setErrorModal] =
    useState<Optional<ErrorDetailsModalProps>>(undefined);

  const { appVersion } = VersionNumber;

  const device = getPlatformDevice(Platform.OS);

  const dispatch = useAppDispatch();

  useEffect(() => {
    const checkShouldShowCreatePin = async () => {
      const hasPin = await hasPinSet();
      setShowCreatePinButton(!hasPin);
      setShowUpdatePinButton(hasPin);
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    checkShouldShowCreatePin();
  }, []);

  const onPageScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const pageContentOffset = event.nativeEvent.contentOffset.y;
    const opacity =
      calculateFloatingHeaderOpacityFromPageContentOffset(pageContentOffset);
    setHeaderOpacity(opacity);
  };

  const onSelectBroadcasterStatus = async () => {
    await tryReconnectWakuBroadcasterClient();
  };

  const onSelectWallets = () => {
    triggerHaptic(HapticSurface.NavigationButton);
    navigation.navigate("SettingsWallets");
  };

  const onSelectNetworks = () => {
    triggerHaptic(HapticSurface.NavigationButton);
    navigation.navigate("SettingsNetworks", {});
  };

  const onSelectAddressBook = () => {
    triggerHaptic(HapticSurface.NavigationButton);
    navigation.navigate("SettingsAddressBook");
  };

  const onSelectBroadcasters = () => {
    triggerHaptic(HapticSurface.NavigationButton);
    navigation.navigate("SettingsBroadcasters");
  };

  const onSelectDefaultSettings = () => {
    triggerHaptic(HapticSurface.NavigationButton);
    navigation.navigate("SettingsDefaults");
  };

  const onSelectAboutRailgun = async () => {
    triggerHaptic(HapticSurface.NavigationButton);
    await openInAppBrowserLink(Constants.ABOUT_RAILGUN_URL, dispatch);
  };

  const onSelectRateReview = async () => {
    triggerHaptic(HapticSurface.NavigationButton);
    const openLinkSuccess = await openAppReviewLink();
    if (!openLinkSuccess) {
      const message = `Please review the Railway app through the ${
        isAndroid() ? "Google Play store" : "App Store"
      }.`;
      Alert.alert("Could not submit rating", message);
    }
  };

  const onSelectCommunitySupport = async () => {
    triggerHaptic(HapticSurface.NavigationButton);
    openExternalLinkAlert(Constants.RAILWAY_SUPPORT_TELEGRAM, dispatch);
  };

  const promptRescanPrivateBalances = () => {
    triggerHaptic(HapticSurface.NavigationButton);
    Alert.alert(
      "Re-scan balances",
      "We suggest this action to sync your private balances, in case of error. This action can take a few minutes.",
      [
        {
          text: "Scan",
          onPress: rescanPrivateBalances,
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const rescanPrivateBalances = async () => {
    const currentNetwork = network.current;
    setAlert({
      show: true,
      title: "Scanning",
      message: `Re-scanning private wallet balances for ${currentNetwork.shortPublicName}. You may close this panel. Balances will refresh in the background.`,
      onSubmit: () => {
        setAlert({});
      },
    });
    await RailgunTransactionHistorySync.clearSyncedTransactions(
      dispatch,
      currentNetwork.name
    );

    try {
      await rescanFullUTXOMerkletreesAndWallets(
        currentNetwork.chain,
        wallets.active ? [wallets.active.railWalletID] : undefined
      );
      dispatch(
        showImmediateToast({
          type: ToastType.Success,
          message: `Private balances successfully synced with ${currentNetwork.shortPublicName}.`,
        })
      );
    } catch (cause) {
      const error = new Error("Error re-scanning private balances", { cause });
      logDevError(error);
      setErrorModal({
        show: true,
        error,
        onDismiss: () => setErrorModal(undefined),
      });
    }
  };

  const promptResetTXIDMerkletreesV2 = () => {
    Alert.alert(
      "Reset TXID data [V2]",
      "We suggest this action to re-sync RAILGUN TXID data. This action can take a few minutes.",
      [
        {
          text: "Scan",
          onPress: resetTXIDMerkletreesV2,
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const resetTXIDMerkletreesV2 = async () => {
    const currentNetwork = network.current;
    setLoadingText(
      `Resetting TXID data for ${network.current.shortPublicName}. You may close this panel. Data will refresh in the background.`
    );

    try {
      await resetFullTXIDMerkletreesV2(currentNetwork.chain);
      setLoadingText(undefined);
      dispatch(
        showImmediateToast({
          type: ToastType.Success,
          message: `TXID data synced with ${currentNetwork.shortPublicName}.`,
        })
      );
    } catch (cause) {
      setLoadingText(undefined);
      const error = new Error("TXID Reset Error", { cause });
      logDevError(error);
      setErrorModal({
        show: true,
        error,
        onDismiss: () => setErrorModal(undefined),
      });
    }
  };

  const deleteAppData_DANGEROUS = async () => {
    setLoadingText("Updating app settings...");

    try {
      await wipeDevice_DESTRUCTIVE(dispatch);
      (navigation as any).navigate("WalletsScreen");
    } catch (cause) {
      const error = new Error("Reset failed. Please try again.", { cause });
      logDevError(error);
      setErrorModal({
        show: true,
        error,
        onDismiss: () => setErrorModal(undefined),
      });
    }

    setLoadingText(undefined);
  };

  const confirmReset = () => {
    Alert.alert(
      "FINAL CONFIRMATION",
      "WARNING: This action cannot be reversed. Please document seed phrases before resetting your app.",
      [
        {
          text: "Delete wallets and reset app",
          onPress: deleteAppData_DANGEROUS,
          style: "destructive",
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const onSelectReset = () => {
    triggerHaptic(HapticSurface.NavigationButton);
    Alert.alert(
      "Are you sure?",
      "This will delete all wallets and reset configurations to defaults. You may re-import your wallets using the seed phrase.",
      [
        {
          text: "Delete app data",
          onPress: confirmReset,
          style: "destructive",
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const handleSetPin = () => {
    triggerHaptic(HapticSurface.NavigationButton);
    setShowCreatePinModal(true);
  };

  const clearLastTransactionNonce = async () => {
    triggerHaptic(HapticSurface.NavigationButton);
    if (!wallets.active || wallets.active.isViewOnlyWallet) {
      Alert.alert(
        "Error",
        "Cannot clear nonce for missing wallet or view-only wallet"
      );
      return;
    }

    const nonceService = new NonceStorageService();
    await nonceService.clearLastTransactionNonce(
      wallets.active.ethAddress,
      network.current.name
    );

    Alert.alert("Cleared stored nonce");
  };

  const forceResyncTransactions = async () => {
    await RailgunTransactionHistorySync.resyncAllTransactionsIfNecessary(
      dispatch,
      network.current,
      getWalletTransactionHistory,
      refreshRailgunBalances,
      true
    );
  };

  const resyncTransactionHistory = async () => {
    triggerHaptic(HapticSurface.NavigationButton);
    Alert.alert("Cleared transaction history... scanning again");
    await forceResyncTransactions();
  };

  const promptGenerateAllPOIs = () => {
    triggerHaptic(HapticSurface.NavigationButton);
    Alert.alert(
      "Generate all Private POIs",
      "This action will generate all the Private Proofs of Innocence for your transactions, it can take a few minutes.",
      [
        {
          text: "Generate",
          onPress: generateAllPOIs,
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const generateAllPOIs = async () => {
    if (!wallets.active) {
      return;
    }
    setLoadingText("Triggering Private POIs...");

    const currentNetwork = network.current;

    try {
      await generateAllPOIsForWallet(
        network.current.name,
        wallets.active?.railWalletID
      );

      setLoadingText(undefined);

      dispatch(
        showImmediateToast({
          type: ToastType.Success,
          message: `Generated all available Private POIs for ${currentNetwork.shortPublicName}.`,
        })
      );
    } catch (cause) {
      setLoadingText(undefined);
      const error = new Error(
        "Generating Private POIs failed. Please try again.",
        { cause }
      );
      logDevError(error);
      setErrorModal({
        show: true,
        error,
        onDismiss: () => setErrorModal(undefined),
      });
    }
  };

  const navigateUnshieldToOrigin = (
    originalShieldTxid: string,
    erc20AmountRecipients: ERC20AmountRecipient[]
  ) => {
    setPendingBalancesOpen(false);
    const params: TokenStackParamList["UnshieldERC20sConfirm"] = {
      erc20AmountRecipients: erc20AmountRecipients,
      isBaseTokenUnshield: false,
      nftAmountRecipients: [],
      balanceBucketFilter: [],
      unshieldToOriginShieldTxid: originalShieldTxid,
    };
    navigation.dispatch(
      CommonActions.navigate("Token", {
        screen: "UnshieldERC20sConfirm",
        params,
      })
    );
  };

  return (
    <>
      <CreatePinModal
        show={showCreatePinModal}
        dismiss={() => setShowCreatePinModal(false)}
      />
      <FloatingHeader
        opacity={headerOpacity}
        backgroundColor={styleguide.colors.headerBackground}
        title="Settings"
        isModal={false}
      />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView
          style={styles.scrollView}
          onScroll={onPageScroll}
          scrollEventThrottle={16}
        >
          <View style={[styles.titleRow, { opacity: 1 - headerOpacity }]}>
            <TabHeaderText title="Settings" />
          </View>
          <View style={styles.itemRow}>
            <SettingsListHeader title="Status" />
            <View style={styles.items}>
              <SettingsListItem
                title="Broadcasters"
                description={broadcasterStatusText}
                icon="circle-medium"
                iconColor={broadcasterIndicatorColor}
                onTap={
                  broadcasterConnectionStatus ===
                  BroadcasterConnectionStatus.Disconnected
                    ? onSelectBroadcasterStatus
                    : undefined
                }
              />
            </View>
          </View>
          <View style={styles.itemRow}>
            <SettingsListHeader title="Manage" />
            <View style={styles.items}>
              <SettingsListItem
                title="Wallets"
                description="Manage your available wallets"
                icon="chevron-right"
                onTap={onSelectWallets}
              />
              <View style={styles.hr} />
              {poiRequired && (
                <>
                  <SettingsListItem
                    title="Pending balances"
                    description="View pending shields and other balances"
                    icon="chevron-right"
                    onTap={() => setPendingBalancesOpen(true)}
                  />
                  <View style={styles.hr} />
                </>
              )}
              <SettingsListItem
                title="Networks & RPCs"
                description="Customize network RPCs"
                icon="chevron-right"
                onTap={onSelectNetworks}
              />
              <View style={styles.hr} />
              <SettingsListItem
                title="Address book"
                description="Manage saved addresses"
                icon="chevron-right"
                onTap={onSelectAddressBook}
              />
              <View style={styles.hr} />
              {ReactConfig.IS_DEV && (
                <>
                  <SettingsListItem
                    title="Public Broadcasters"
                    description="Customize public broadcasters"
                    icon="chevron-right"
                    onTap={onSelectBroadcasters}
                  />
                  <View style={styles.hr} />
                </>
              )}
              <SettingsListItem
                title="Default settings"
                description="Set currency for balances"
                icon="chevron-right"
                onTap={onSelectDefaultSettings}
              />
              {showCreatePinButton && (
                <>
                  <View style={styles.hr} />
                  <SettingsListItem
                    title="Set PIN"
                    description="Secure your wallets with a PIN"
                    icon="lock-outline"
                    onTap={handleSetPin}
                  />
                </>
              )}
              {__DEV__ && showUpdatePinButton && (
                <>
                  <View style={styles.hr} />
                  <SettingsListItem
                    title="Update PIN (Dev only)"
                    description="Secure your wallets with a new PIN"
                    icon="lock-outline"
                    onTap={handleSetPin}
                  />
                </>
              )}
            </View>
          </View>
          <View style={styles.itemRow}>
            <SettingsListHeader title="Help" />
            <View style={styles.items}>
              <SettingsListItem
                title="Community"
                description="Get app support on Telegram"
                icon="chat-processing-outline"
                onTap={onSelectCommunitySupport}
              />
              <View style={styles.hr} />
              <SettingsListItem
                title="Re-scan private balances"
                description={`Sync RAILGUN balances on ${network.current.shortPublicName}`}
                icon="refresh"
                onTap={promptRescanPrivateBalances}
              />
              <View style={styles.hr} />
              <SettingsListItem
                title="Generate all Private POIs"
                description={`Run Private Proof of Innocence for ${network.current.shortPublicName}`}
                icon="calculator"
                onTap={promptGenerateAllPOIs}
              />
              {ReactConfig.IS_DEV && (
                <>
                  <View style={styles.hr} />
                  <SettingsListItem
                    title="[Dev] Reset RAILGUN TXIDs"
                    description={`Clear and sync TXID data on ${network.current.shortPublicName}`}
                    icon="refresh"
                    onTap={promptRescanPrivateBalances}
                  />
                </>
              )}
              <View style={styles.hr} />
              <SettingsListItem
                title="Reset wallets"
                description="Reset to app defaults"
                icon="trash-can-outline"
                onTap={onSelectReset}
              />
            </View>
          </View>
          <View style={styles.itemRow}>
            <SettingsListHeader title="App" />
            <View style={styles.items}>
              <SettingsListItem
                title="Review the Railway app"
                description="Show us some love"
                icon="star-outline"
                onTap={onSelectRateReview}
              />
              <View style={styles.hr} />
              <SettingsListItem
                title="About RAILGUN"
                description="Open railgun.org"
                icon="open-in-new"
                onTap={onSelectAboutRailgun}
              />
            </View>
          </View>
          {__DEV__ && (
            <View style={styles.itemRow}>
              <SettingsListHeader title="Dev Only" />
              <View style={styles.items}>
                <SettingsListItem
                  title={`[Dev] Clear stored nonce: ${network.current.shortPublicName}`}
                  description="Reset last transaction nonce"
                  icon="trash-can-outline"
                  onTap={clearLastTransactionNonce}
                />
                <View style={styles.hr} />
                <SettingsListItem
                  title={`[Dev] Re-sync transaction history`}
                  description="Clear synced RAILGUN history and scan again"
                  icon="refresh"
                  onTap={resyncTransactionHistory}
                />
              </View>
            </View>
          )}
          <Text style={styles.footerText}>
            Railway {device}, Version {appVersion}
          </Text>
        </ScrollView>
      </View>
      {isDefined(loadingText) && (
        <FullScreenSpinner show={true} text={loadingText} />
      )}
      {poiRequired && (
        <PendingBalancesModal
          show={pendingBalancesOpen}
          onDismiss={() => {
            setPendingBalancesOpen(false);
          }}
          navigateUnshieldToOrigin={navigateUnshieldToOrigin}
        />
      )}
      {isDefined(errorModal) && <ErrorDetailsModal {...errorModal} />}
      <GenericAlert {...alert} />
    </>
  );
};
