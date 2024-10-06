import { isDefined } from "@railgun-community/shared-models";
import React, { useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { AppHeader } from "@components/headers/AppHeader/AppHeader";
import { HeaderBackButton } from "@components/headers/headerSideComponents/HeaderBackButton/HeaderBackButton";
import { TextEntry } from "@components/inputs/TextEntry/TextEntry";
import { FullScreenSpinner } from "@components/loading/FullScreenSpinner/FullScreenSpinner";
import { useSetActiveWallet } from "@hooks/useSetActiveWallet";
import { SettingsStackParamList } from "@models/navigation-models";
import Clipboard from "@react-native-clipboard/clipboard";
import { NavigationProp, RouteProp } from "@react-navigation/native";
import {
  FrontendWallet,
  IconPublic,
  IconShielded,
  logDevError,
  SharedConstants,
  showImmediateToast,
  styleguide,
  ToastType,
  useAppDispatch,
  validateWalletName,
  WalletService,
  WalletStorageService,
} from "@react-shared";
import {
  ErrorDetailsModal,
  ErrorDetailsModalProps,
} from "@screens/modals/ErrorDetailsModal/ErrorDetailsModal";
import { SettingsListHeader } from "@screens/tabs/SettingsScreen/SettingsListHeader/SettingsListHeader";
import { SettingsListItem } from "@screens/tabs/SettingsScreen/SettingsListItem/SettingsListItem";
import { promptAlert } from "@services/util/alert-service";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { WalletSecureServiceReactNative } from "@services/wallet/wallet-secure-service-react-native";
import { styles } from "./styles";

type Props = {
  navigation: NavigationProp<SettingsStackParamList, "SettingsWalletInfo">;
  route: RouteProp<
    { params: SettingsStackParamList["SettingsWalletInfo"] },
    "params"
  >;
};

export const SettingsWalletInfoScreen: React.FC<Props> = ({
  navigation,
  route,
}) => {
  const dispatch = useAppDispatch();
  const { wallet: originalWallet } = route.params;
  const [wallet, setWallet] = useState(originalWallet);
  const walletStorageService = new WalletStorageService(dispatch);
  const walletService = new WalletService(
    dispatch,
    new WalletSecureServiceReactNative()
  );
  const updateScreenWallet = (wallet: Optional<FrontendWallet>) => {
    if (wallet) {
      setWallet(wallet);
    }
  };
  const { setActiveWallet, isLoading } = useSetActiveWallet(updateScreenWallet);
  const [errorModal, setErrorModal] =
    useState<Optional<ErrorDetailsModalProps>>(undefined);

  const onTapEditName = () => {
    triggerHaptic(HapticSurface.EditButton);
    promptAlert(
      "Rename your wallet",
      `${SharedConstants.MAX_LENGTH_WALLET_NAME} character limit`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Update",
          onPress: (name?: string) => updateWalletName(name),
        },
      ],
      undefined,
      wallet.name
    );
  };

  const onTapCopyAddress = (address: string, addressType: string) => {
    triggerHaptic(HapticSurface.ClipboardCopy);
    Clipboard.setString(address);
    dispatch(
      showImmediateToast({
        message: `${addressType} address copied. Paste elsewhere to share.`,
        type: ToastType.Copy,
      })
    );
  };

  const onTapShowViewingKey = () => {
    triggerHaptic(HapticSurface.NavigationButton);
    navigation.navigate("ShowViewingKey", { wallet });
  };

  const onTapShowSeedPhrase = () => {
    triggerHaptic(HapticSurface.NavigationButton);
    navigation.navigate("ShowSeedPhrase", { wallet });
  };

  const onTapDeleteWallet = () => {
    triggerHaptic(HapticSurface.DangerButton);
    const recoveryMethod = "seed phrase";
    Alert.alert(
      "Delete this wallet?",
      `This action is permanent. Please document your ${recoveryMethod} in order to recover your funds.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete Wallet",
          onPress: finalWarningDeleteWallet,
          style: "destructive",
        },
      ]
    );
  };

  const finalWarningDeleteWallet = () => {
    triggerHaptic(HapticSurface.DangerAlert);
    Alert.alert("FINAL WARNING", "Permanently delete this wallet?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete Forever",
        onPress: deleteWallet,
        style: "destructive",
      },
    ]);
  };

  const updateWalletName = async (newWalletName?: string) => {
    if (!isDefined(newWalletName)) {
      return;
    }
    if (!validateWalletName(newWalletName)) {
      Alert.alert("Invalid entry", "Please enter a valid wallet name.");
      return;
    }
    if (newWalletName.length > SharedConstants.MAX_LENGTH_WALLET_NAME) {
      Alert.alert(
        "Please try again",
        `Wallet name is limited to ${SharedConstants.MAX_LENGTH_WALLET_NAME} characters.`
      );
      return;
    }
    const newWallet = { ...wallet, name: newWalletName };
    await walletStorageService.updateWallet(newWallet);
    triggerHaptic(HapticSurface.EditSuccess);
    setWallet(newWallet);
  };

  const deleteWallet = async () => {
    try {
      await walletService.removeWallet(wallet.id);
      navigation.goBack();
    } catch (cause) {
      const error = new Error("Failed to delete wallet", { cause });
      logDevError(error);
      setErrorModal({
        show: true,
        error,
        onDismiss: () => setErrorModal(undefined),
      });
    }
  };

  const selectActiveWallet = () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    setActiveWallet(wallet);
    triggerHaptic(HapticSurface.EditSuccess);
  };

  return (
    <>
      <AppHeader
        title={wallet.name}
        backgroundColor={styleguide.colors.headerBackground}
        headerLeft={<HeaderBackButton label="Wallets" />}
        isModal={false}
      />
      <View style={styles.wrapper}>
        <ScrollView>
          {/* eslint-disable-next-line react-native/no-inline-styles */}
          <View style={[styles.itemRow, { marginTop: 16 }]}>
            <View style={styles.items}>
              <SettingsListItem
                title={
                  wallet.isActive ? "Wallet is Active" : "Set as Active Wallet"
                }
                description="Use this wallet for balances and transactions"
                icon={wallet.isActive ? "check-bold" : undefined}
                iconColor={styleguide.colors.txGreen()}
                onTap={selectActiveWallet}
              />
            </View>
          </View>
          <View style={styles.itemRow}>
            <SettingsListHeader title="Wallet Details" />
            <View style={styles.items}>
              <TouchableOpacity onPress={onTapEditName} activeOpacity={0.8}>
                <TextEntry
                  viewStyles={[styles.walletInfoTextEntry]}
                  label="Name"
                  value={wallet.name}
                  iconButtons={[
                    {
                      icon: "pencil-outline",
                      onTap: onTapEditName,
                    },
                  ]}
                  editable={false}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.items}>
              <TouchableOpacity
                onPress={() => onTapCopyAddress(wallet.railAddress, "RAILGUN")}
                activeOpacity={0.8}
              >
                <TextEntry
                  viewStyles={[styles.walletInfoTextEntry]}
                  label="RAILGUN: All chains"
                  labelIcon={IconShielded()}
                  value={wallet.railAddress}
                  iconButtons={[
                    {
                      icon: "content-copy",
                      onTap: () =>
                        onTapCopyAddress(wallet.railAddress, "RAILGUN"),
                    },
                  ]}
                  multiline
                  editable={false}
                />
              </TouchableOpacity>
              <View style={styles.hr} />
              {!wallet.isViewOnlyWallet && (
                <TouchableOpacity
                  onPress={() =>
                    onTapCopyAddress(wallet.ethAddress, "Public EVM")
                  }
                  activeOpacity={0.8}
                >
                  <TextEntry
                    viewStyles={[styles.walletInfoTextEntry]}
                    label="Public: All EVMs"
                    labelIcon={IconPublic()}
                    value={wallet.ethAddress}
                    iconButtons={[
                      {
                        icon: "content-copy",
                        onTap: () =>
                          onTapCopyAddress(wallet.ethAddress, "Public EVM"),
                      },
                    ]}
                    multiline
                    editable={false}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={styles.itemRow}>
            <SettingsListHeader title="Sharing options" />
            <View style={styles.items}>
              <SettingsListItem
                title="Show Viewing Key"
                icon="chevron-right"
                onTap={onTapShowViewingKey}
              />
            </View>
          </View>
          {!wallet.isViewOnlyWallet && (
            <View style={styles.itemRow}>
              <SettingsListHeader title="Backup options" />
              <View style={styles.items}>
                <SettingsListItem
                  title="Show Seed Phrase"
                  icon="chevron-right"
                  onTap={onTapShowSeedPhrase}
                />
              </View>
              <Text style={styles.backupWarningText}>
                If you lose access to this device, your funds could be lost.
                Please make copies of your seed phrase offline.
              </Text>
            </View>
          )}
          {/* eslint-disable-next-line react-native/no-inline-styles */}
          <View style={[styles.itemRow, { marginBottom: 24 }]}>
            <SettingsListHeader title="Delete wallet" />
            <View style={styles.items}>
              <SettingsListItem
                title="Remove this wallet"
                onTap={onTapDeleteWallet}
                titleStyle={{ color: styleguide.colors.danger }}
              />
            </View>
          </View>
        </ScrollView>
        {isDefined(errorModal) && <ErrorDetailsModal {...errorModal} />}
        <FullScreenSpinner show={isLoading} text="Updating active wallet..." />
      </View>
    </>
  );
};
