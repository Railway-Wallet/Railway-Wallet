import React, { useEffect, useState } from "react";
import { BackHandler, ScrollView, View } from "react-native";
import { AppHeader } from "@components/headers/AppHeader/AppHeader";
import { HeaderBackButton } from "@components/headers/headerSideComponents/HeaderBackButton/HeaderBackButton";
import { RecoveryStackParamList } from "@models/navigation-models";
import { NavigationProp, RouteProp } from "@react-navigation/native";
import {
  loadRailgunWalletByID,
  StoredWallet,
  styleguide,
  useAppDispatch,
  WalletStorageService,
} from "@react-shared";
import { SettingsListItem } from "@screens/tabs/SettingsScreen/SettingsListItem/SettingsListItem";
import { getOrCreateDbEncryptionKey } from "@services/core/db";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { isAndroid } from "@services/util/platform-os-service";
import { styles } from "./styles";

type Props = {
  navigation: NavigationProp<RecoveryStackParamList, "RecoveryWallets">;
  route: RouteProp<
    { params?: RecoveryStackParamList["RecoveryWallets"] },
    "params"
  >;
};

export const RecoveryWalletsScreen: React.FC<Props> = ({
  navigation,
  route,
}) => {
  const [wallets, setWallets] = useState<StoredWallet[]>([]);
  const resetRecoveryMode = route.params?.resetRecoveryMode;
  const dispatch = useAppDispatch();

  const handleBackAction = () => {
    if (resetRecoveryMode) {
      resetRecoveryMode();
      return;
    }
    navigation.goBack();
  };

  useEffect(() => {
    const fetchWallets = async () => {
      const walletStorageService = new WalletStorageService(dispatch);
      const storedWallets = await walletStorageService.fetchStoredWallets();
      setWallets(storedWallets);
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchWallets();
  }, [dispatch]);

  useEffect(() => {
    const backAction = () => {
      handleBackAction();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSelectWallet = async (wallet: StoredWallet) => {
    triggerHaptic(HapticSurface.NavigationButton);
    if (wallet.isViewOnlyWallet ?? false) {
      await loadRailgunWalletByID(
        await getOrCreateDbEncryptionKey(),
        wallet.railWalletID,
        true
      );
      navigation.navigate("SeedPhrase", {
        screen: "ShowViewingKey",
        params: { wallet },
      });
    } else {
      navigation.navigate("SeedPhrase", {
        screen: "ShowSeedPhrase",
        params: { wallet },
      });
    }
  };

  const walletItem = (wallet: StoredWallet, index: number) => {
    const isLastWallet = index === wallets.length - 1;
    return (
      <View key={index}>
        <SettingsListItem
          title={wallet.name}
          description={
            wallet.isViewOnlyWallet ?? false
              ? "Show view-only private key"
              : "Show seed phrase"
          }
          icon="chevron-right"
          onTap={() => onSelectWallet(wallet)}
        />
        {!isLastWallet && <View style={styles.hr} />}
      </View>
    );
  };

  return (
    <>
      <AppHeader
        title="Wallets"
        backgroundColor={styleguide.colors.headerBackground}
        isModal={false}
        headerLeft={
          <HeaderBackButton label="Back" customAction={handleBackAction} />
        }
      />
      <View style={styles.wrapper}>
        <ScrollView>
          <View style={styles.itemRow}>
            <View style={styles.items}>{wallets.map(walletItem)}</View>
          </View>
          {isAndroid() && <View style={styles.androidBottomPadding} />}
        </ScrollView>
      </View>
    </>
  );
};
