import { isDefined } from "@railgun-community/shared-models";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { FooterButtonAndroid } from "@components/footers/FooterButtonAndroid/FooterButtonAndroid";
import { AppHeader } from "@components/headers/AppHeader/AppHeader";
import { HeaderBackButton } from "@components/headers/headerSideComponents/HeaderBackButton/HeaderBackButton";
import { HeaderIconButton } from "@components/headers/headerSideComponents/HeaderIconButton/HeaderIconButton";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { SettingsStackParamList } from "@models/navigation-models";
import { NavigationProp } from "@react-navigation/native";
import {
  FrontendWallet,
  SavedAddress,
  SavedAddressService,
  shortenWalletAddress,
  styleguide,
  useAppDispatch,
  useReduxSelector,
} from "@react-shared";
import { SettingsListHeader } from "@screens/tabs/SettingsScreen/SettingsListHeader/SettingsListHeader";
import { SettingsListItem } from "@screens/tabs/SettingsScreen/SettingsListItem/SettingsListItem";
import { callActionSheet } from "@services/util/action-sheet-options-service";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { isAndroid } from "@services/util/platform-os-service";
import { styles } from "./styles";

type Props = {
  navigation: NavigationProp<SettingsStackParamList, "SettingsWallets">;
};

export const SettingsWalletsScreen: React.FC<Props> = ({ navigation }) => {
  const { wallets } = useReduxSelector("wallets");
  const { savedAddresses } = useReduxSelector("savedAddresses");

  const { showActionSheetWithOptions } = useActionSheet();
  const dispatch = useAppDispatch();

  const onTapCreateWallet = () => {
    triggerHaptic(HapticSurface.NavigationButton);
    callActionSheet(showActionSheetWithOptions, "Add wallet", [
      {
        name: "Create new wallet",
        action: () => {
          (navigation as any).navigate("NewWallet", { screen: "CreateWallet" });
        },
      },
      {
        name: "Import existing wallet",
        action: () => {
          (navigation as any).navigate("NewWallet", { screen: "ImportWallet" });
        },
      },
      {
        name: "Add view-only wallet",
        action: () => {
          (navigation as any).navigate("NewWallet", {
            screen: "AddViewOnlyWallet",
          });
        },
      },
    ]);
  };

  const walletDescription = (wallet: FrontendWallet) => {
    const railgunAddressShortened = shortenWalletAddress(wallet.railAddress);
    if (wallet.isViewOnlyWallet) {
      return `Private: ${railgunAddressShortened}\nView-only wallet`;
    }
    const ethAddressShortened = shortenWalletAddress(wallet.ethAddress);
    return `Private: ${railgunAddressShortened}\nPublic EVM: ${ethAddressShortened}`;
  };

  const onSelectWallet = (wallet: FrontendWallet) => {
    triggerHaptic(HapticSurface.NavigationButton);
    navigation.navigate("SettingsWalletInfo", { wallet });
  };

  const walletItem = (wallet: FrontendWallet, index: number) => {
    const isLastWallet =
      index === wallets.available?.length + wallets.viewOnly?.length - 1;
    return (
      <View key={index} style={styles.walletItemContainer}>
        <SettingsListItem
          title={wallet.name}
          titleIcon={wallet.isActive ? "check-bold" : undefined}
          description={walletDescription(wallet)}
          icon="chevron-right"
          onTap={() => onSelectWallet(wallet)}
        />
        {!isLastWallet && <View style={styles.hr} />}
      </View>
    );
  };

  const savedAddressItem = (savedAddress: SavedAddress, index: number) => {
    let addressShortened: string = "";
    if (isDefined(savedAddress.ethAddress)) {
      addressShortened = shortenWalletAddress(savedAddress.ethAddress);
    }
    if (isDefined(savedAddress.railAddress)) {
      addressShortened = shortenWalletAddress(savedAddress.railAddress);
    }
    const isLastWallet = index === savedAddresses.current.length - 1;
    return (
      <View key={index}>
        <SettingsListItem
          title={savedAddress.name}
          description={addressShortened}
          onTap={() => onTapSavedAddressItem(savedAddress)}
        />
        {!isLastWallet && <View style={styles.hr} />}
      </View>
    );
  };

  const onTapSavedAddressItem = (savedAddress: SavedAddress) => {
    triggerHaptic(HapticSurface.NavigationButton);
    callActionSheet(
      showActionSheetWithOptions,
      `${savedAddress.name}: ${
        savedAddress.ethAddress ?? savedAddress.railAddress
      }`,
      [
        {
          name: "Delete saved address",
          action: async () => {
            const savedAddressService = new SavedAddressService(dispatch);
            await savedAddressService.delete(savedAddress);
          },
        },
      ]
    );
  };

  const allWallets = [...wallets.available, ...wallets.viewOnly];

  return (
    <>
      <AppHeader
        title="Wallets"
        backgroundColor={styleguide.colors.headerBackground}
        headerLeft={<HeaderBackButton label="Settings" />}
        headerRight={
          <HeaderIconButton icon="plus" onPress={onTapCreateWallet} />
        }
        isModal={false}
      />
      <View style={styles.wrapper}>
        <ScrollView>
          <View style={styles.itemRow}>
            <SettingsListHeader title="Wallets" />
            <View style={styles.items}>{allWallets.map(walletItem)}</View>
            {!allWallets.length && (
              <Text style={styles.placeholderText}>
                Press{" "}
                <Text style={styles.bold} onPress={onTapCreateWallet}>
                  {isAndroid() ? "New Wallet" : "+"}
                </Text>{" "}
                to add a new wallet.
              </Text>
            )}
          </View>
          {savedAddresses.current.length > 0 && (
            <View style={styles.itemRow}>
              <SettingsListHeader title="Saved addresses" />
              <View style={styles.items}>
                {savedAddresses.current.map((savedAddress, index) =>
                  savedAddressItem(savedAddress, index)
                )}
              </View>
            </View>
          )}
          {isAndroid() && <View style={styles.androidBottomPadding} />}
        </ScrollView>
        <FooterButtonAndroid
          buttonAction={onTapCreateWallet}
          buttonTitle="New Wallet"
        />
      </View>
    </>
  );
};
