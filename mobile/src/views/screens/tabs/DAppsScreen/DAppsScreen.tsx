import { isDefined } from "@railgun-community/shared-models";
import React, { useState } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StatusBar,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon0xExchange } from "@assets/img/ImagesMobile";
import { FloatingHeader } from "@components/headers/FloatingHeader/FloatingHeader";
import { DAppListRow } from "@components/list/DAppListRow/DAppListRow";
import { TabHeaderText } from "@components/text/TabHeaderText/TabHeaderText";
import { DAppSettings } from "@models/DApps";
import { DAppsStackParamList } from "@models/navigation-models";
import { NavigationProp } from "@react-navigation/native";
import {
  ReactConfig,
  styleguide,
  useReduxSelector,
  useShouldEnableSwaps,
} from "@react-shared";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { isIOS } from "@services/util/platform-os-service";
import { Constants } from "@utils/constants";
import { calculateFloatingHeaderOpacityFromPageContentOffset } from "../WalletsScreen/WalletFloatingHeader/WalletFloatingHeader";
import { styles } from "./styles";

type DAppsScreenProps = {
  navigation: NavigationProp<DAppsStackParamList, "DApps">;
};

export const DAppsScreen: React.FC<DAppsScreenProps> = ({ navigation }) => {
  StatusBar.setBarStyle("light-content");

  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");

  const [headerOpacity, setHeaderOpacity] = useState(0);
  const insets = useSafeAreaInsets();

  const onPageScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const pageContentOffset = event.nativeEvent.contentOffset.y;
    const opacity =
      calculateFloatingHeaderOpacityFromPageContentOffset(pageContentOffset);
    setHeaderOpacity(opacity);
  };

  const swapsUnavailableOnPlatform =
    isIOS() && !Constants.ENABLE_SWAPS_PROD_IOS && !ReactConfig.IS_DEV;
  const { shouldEnableSwaps } = useShouldEnableSwaps(
    swapsUnavailableOnPlatform
  );

  const dApps: DAppSettings[] = [
    {
      title: "Railway DEX",
      description: "Private and public swaps",
      icon: Icon0xExchange(),
      routeName: "Swap",
      enabled: shouldEnableSwaps,
    },
    {
      title: "Farm",
      description: "Earn yield",
      icon: "tractor-variant",
      routeName: "FarmScreen",
      enabled: true,
    },
    {
      title: "Liquidity",
      description: "Manage DEX liquidity",
      icon: "pool",
      routeName: "LiquidityScreen",
      enabled: true,
    },
  ];

  const hasWallet = isDefined(wallets.active);
  const isViewOnlyWallet = wallets.active?.isViewOnlyWallet ?? false;

  const onSelectDApp = (dApp: DAppSettings) => {
    triggerHaptic(HapticSurface.NavigationButton);
    navigation.navigate(dApp.routeName, {});
  };

  const renderDApp = (dApp: DAppSettings) => (
    <DAppListRow
      title={dApp.title}
      description={dApp.description}
      icon={dApp.icon}
      onSelect={() => onSelectDApp(dApp)}
    />
  );

  const enabledDapps = dApps.filter((dapp) => dapp.enabled);
  const hasDapps = enabledDapps.length > 0;

  const header = (
    <>
      <View style={[styles.titleRow, { opacity: 1 - headerOpacity }]}>
        <TabHeaderText title="dApps" />
      </View>
      {!hasDapps && (
        <View style={styles.errorTextWrapper}>
          <Text style={styles.errorText}>
            No dApps available for {network.current.publicName} on this device.
          </Text>
        </View>
      )}
      {!hasWallet && hasDapps && (
        <View style={styles.errorTextWrapper}>
          <Text style={styles.errorText}>
            Please add a wallet to access dApps.
          </Text>
        </View>
      )}
      {isViewOnlyWallet && hasDapps && (
        <View style={styles.errorTextWrapper}>
          <Text style={styles.errorText}>
            View-only wallets may not access dApps.
          </Text>
        </View>
      )}
    </>
  );

  return (
    <>
      <FloatingHeader
        opacity={headerOpacity}
        backgroundColor={styleguide.colors.headerBackground}
        title="dApps"
        isModal={false}
      />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <FlatList
          ListHeaderComponent={header}
          ListHeaderComponentStyle={styles.listHeaderStyle}
          onScroll={onPageScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
          contentContainerStyle={styles.tokenListContentContainer}
          data={hasWallet && !isViewOnlyWallet ? enabledDapps : []}
          keyExtractor={(_item: DAppSettings, index: number) => String(index)}
          renderItem={(dApp) => renderDApp(dApp.item)}
        />
      </View>
    </>
  );
};
