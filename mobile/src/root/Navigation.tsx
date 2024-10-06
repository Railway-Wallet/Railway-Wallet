import React, { useState } from "react";
import { enableScreens } from "react-native-screens";
import { RootStackParamList } from "@models/navigation-models";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  createNavigationContainerRef,
  ParamListBase,
  RouteProp,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  styleguide,
  usePendingTransactionCount,
  usePOIProofStatus,
} from "@react-shared";
import { SwapPrivateConfirm } from "@screens/DApps/Swap/SwapPrivateConfirm/SwapPrivateConfirm";
import { SwapPublicConfirm } from "@screens/DApps/Swap/SwapPublicConfirm/SwapPublicConfirm";
import { SwapScreen } from "@screens/DApps/Swap/SwapScreen/SwapScreen";
import { CustomNetworkFeeType2Screen } from "@screens/modals/SelectNetworkFeeModal/CustomNetworkFeeScreen/CustomNetworkFeeType2Screen";
import { CustomNetworkFeeTypes01Screen } from "@screens/modals/SelectNetworkFeeModal/CustomNetworkFeeScreen/CustomNetworkFeeTypes01Screen";
import { SelectNetworkFeeModal } from "@screens/modals/SelectNetworkFeeModal/SelectNetworkFeeModal";
import { AddCustomTokenScreen } from "@screens/pages/add-token/AddCustomTokenScreen/AddCustomTokenScreen";
import { AddTokensScreen } from "@screens/pages/add-token/AddTokensScreen/AddTokensScreen";
import { ApproveTokenConfirm } from "@screens/pages/approve/ApproveTokenConfirm/ApproveTokenConfirm";
import { CancelTransactionConfirm } from "@screens/pages/cancel/CancelTransactionConfirm/CancelTransactionConfirm";
import { AddViewOnlyWalletScreen } from "@screens/pages/import-create/AddViewOnlyWalletScreen/AddViewOnlyWalletScreen";
import { CreateWalletScreen } from "@screens/pages/import-create/CreateWalletScreen/CreateWalletScreen";
import { ImportWalletScreen } from "@screens/pages/import-create/ImportWalletScreen/ImportWalletScreen";
import { NewWalletSuccess } from "@screens/pages/import-create/NewWalletSuccess/NewWalletSuccess";
import { SeedPhraseCalloutScreen } from "@screens/pages/import-create/SeedPhraseCalloutScreen/SeedPhraseCalloutScreen";
import { ViewingKeyCalloutScreen } from "@screens/pages/import-create/ViewingKeyCalloutScreen/ViewingKeyCalloutScreen";
import { WalletProviderLoadingView } from "@screens/pages/loading-network/WalletProviderLoadingView/WalletProviderLoadingView";
import { LockedScreen } from "@screens/pages/locked/LockedScreen/LockedScreen";
import { MintTokensConfirm } from "@screens/pages/mint/MintTokensConfirm/MintTokensConfirm";
import { ReceiveTokenScreen } from "@screens/pages/receive/ReceiveTokenScreen/ReceiveTokenScreen";
import { RecoveryWalletsScreen } from "@screens/pages/recovery/RecoveryWalletsScreen";
import { SendERC20s } from "@screens/pages/send/SendERC20s/SendERC20s";
import { SendERC20sConfirm } from "@screens/pages/send/SendERC20sConfirm/SendERC20sConfirm";
import { SettingsBroadcastersScreen } from "@screens/pages/settings/SettingsBroadcastersScreen/SettingsBroadcastersScreen";
import { SettingsDefaultsScreen } from "@screens/pages/settings/SettingsDefaultsScreen/SettingsDefaultsScreen";
import { SettingsNetworkInfoScreen } from "@screens/pages/settings/SettingsNetworkInfoScreen/SettingsNetworkInfoScreen";
import { SettingsNetworksScreen } from "@screens/pages/settings/SettingsNetworksScreen/SettingsNetworksScreen";
import { SettingsWalletInfoScreen } from "@screens/pages/settings/SettingsWalletInfoScreen/SettingsWalletInfoScreen";
import { SettingsWalletsScreen } from "@screens/pages/settings/SettingsWalletsScreen/SettingsWalletsScreen";
import { ShowSeedPhraseScreen } from "@screens/pages/settings/ShowSeedPhraseScreen/ShowSeedPhraseScreen";
import { ShowViewingKeyScreen } from "@screens/pages/settings/ShowViewingKeyScreen/ShowViewingKeyScreen";
import { ShieldERC20s } from "@screens/pages/shield/ShieldERC20s/ShieldERC20s";
import { ShieldERC20sConfirm } from "@screens/pages/shield/ShieldERC20sConfirm/ShieldERC20sConfirm";
import { ERC20Info } from "@screens/pages/token-info/ERC20Info/ERC20Info";
import { UnshieldERC20s } from "@screens/pages/unshield/UnshieldERC20s/UnshieldERC20s";
import { UnshieldERC20sConfirm } from "@screens/pages/unshield/UnshieldERC20sConfirm/UnshieldERC20sConfirm";
import { ActivityScreen } from "@screens/tabs/ActivityScreen/ActivityScreen";
import { DAppsScreen } from "@screens/tabs/DAppsScreen/DAppsScreen";
import { NFTsScreen } from "@screens/tabs/NFTsScreen/NFTsScreen";
import { SettingsScreen } from "@screens/tabs/SettingsScreen/SettingsScreen";
import { WalletsScreen } from "@screens/tabs/WalletsScreen/WalletsScreen";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { isAndroid } from "@services/util/platform-os-service";
import { Icon } from "@views/components/icons/Icon";
import { FarmScreen } from "@views/screens/DApps/Farm/FarmScreen/FarmScreen";
import { FarmVaultInitial } from "@views/screens/DApps/Farm/FarmVaultInitial/FarmVaultInitial";
import { AddLiquidityConfirm } from "@views/screens/DApps/Liquidity/AddLiquidityConfirm/AddLiquidityConfirm";
import { AddLiquidityInitial } from "@views/screens/DApps/Liquidity/AddLiquidityInitial/AddLiquidityInitial";
import { LiquidityScreen } from "@views/screens/DApps/Liquidity/LiquidityScreen/LiquidityScreen";
import { RemoveLiquidityConfirm } from "@views/screens/DApps/Liquidity/RemoveLiquidityConfirm/RemoveLiquidityConfirm";
import { RemoveLiquidityInitial } from "@views/screens/DApps/Liquidity/RemoveLiquidityInitial/RemoveLiquidityInitial";
import { POIProgressModal } from "@views/screens/modals/POIPorgressModal/POIProgressModal";
import { OnboardingScreen } from "@views/screens/pages/onboarding/OnboardingScreen/OnboardingScreen";
import { SettingsAddCustomRPCScreen } from "@views/screens/pages/settings/SettingsAddCustomRPCScreen/SettingsAddCustomRPCScreen";
import { SettingsAddressBookScreen } from "@views/screens/pages/settings/SettingsAddressBookScreen/SettingsAddressBookScreen";
import { SettingsAddSavedAddressScreen } from "@views/screens/pages/settings/SettingsAddSavedAddress/SettingsAddSavedAddress";
import { FarmVaultConfirm } from "../views/screens/DApps/Farm/FarmVaultConfirm/FarmVaultConfirm";

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export const getActiveRootNavigation = () => {
  if (navigationRef.isReady()) {
    return navigationRef;
  }
  return undefined;
};

export type ScreenComponent = React.ComponentType<{}>;

const RootStack = createNativeStackNavigator();
const RootNavigator = ({
  showLockedScreen,
  backGesturesEnabled,
}: RootNavProps) => (
  <RootStack.Navigator screenOptions={{ headerShown: false }}>
    <RootStack.Group>
      {showLockedScreen && (
        <RootStack.Screen
          name="LockedScreen"
          component={LockedScreen as ScreenComponent}
        />
      )}
      <RootStack.Screen
        name="WalletProviderLoading"
        component={WalletProviderLoadingView}
      />
      <RootStack.Screen
        name="OnboardingScreen"
        component={OnboardingScreen as ScreenComponent}
      />
      <RootStack.Screen
        name="RecoveryWallets"
        component={RecoveryWalletsNavigator}
      />
      <RootStack.Screen
        options={{ animation: "fade", gestureEnabled: false }}
        name="Tabs"
        component={TabNavigator}
      />
      <RootStack.Screen
        name="NewWallet"
        component={NewWalletNavigator}
        options={{ gestureEnabled: backGesturesEnabled }}
      />
      <RootStack.Screen name="Token" component={TokenNavigator} />
    </RootStack.Group>
    <RootStack.Group screenOptions={{ presentation: "modal" }}>
      <RootStack.Screen name="AddTokens" component={AddTokenNavigator} />
    </RootStack.Group>
    <RootStack.Group screenOptions={{ presentation: "modal" }}>
      <RootStack.Screen
        name="SelectNetworkFee"
        component={SelectNetworkFeeNavigator}
      />
    </RootStack.Group>
    <RootStack.Group
      screenOptions={{ gestureEnabled: false, animation: "fade" }}
    >
      <RootStack.Screen
        name="LockedModal"
        component={LockedScreen as ScreenComponent}
      />
    </RootStack.Group>
  </RootStack.Navigator>
);

const hapticOnTabPress = {
  tabPress: () => {
    triggerHaptic(HapticSurface.NavigationTab);
  },
};

export enum NavigationTabName {
  Wallets = "Wallets",
  dApps = "dApps",
  NFTs = "NFTs",
  Activity = "Activity",
  Settings = "Settings",
}

export const getTabBarIcon = (
  color: string,
  size: number,
  route: RouteProp<ParamListBase, string>
) => {
  let iconName = "";
  switch (route.name) {
    case NavigationTabName.Wallets:
      iconName = "wallet-outline";
      break;
    case NavigationTabName.dApps:
      iconName = "puzzle-outline";
      break;
    case NavigationTabName.NFTs:
      iconName = "image-multiple-outline";
      break;
    case NavigationTabName.Activity:
      iconName = "rss";
      break;
    case NavigationTabName.Settings:
      iconName = "cog-outline";
      break;
  }
  return <Icon source={iconName} size={size} color={color} />;
};

const tabBadge = (
  route: RouteProp<ParamListBase, string>,
  pendingTransactionCount: number
): Optional<number> => {
  if (route.name !== NavigationTabName.Activity) {
    return undefined;
  }
  return pendingTransactionCount > 0 ? pendingTransactionCount : undefined;
};

const Tab = createBottomTabNavigator();
const TabNavigator = () => {
  const [showPOIModalInfo, setShowPOIModalInfo] = useState(false);
  const { poiProofProgressStatus, shouldShowAllProofsCompleted } =
    usePOIProofStatus();
  const { pendingTransactionCount } = usePendingTransactionCount();

  const onTapPOIData = () => {
    triggerHaptic(HapticSurface.NavigationButton);
    setShowPOIModalInfo(true);
  };

  const closePOIDataModal = () => {
    setShowPOIModalInfo(false);
  };

  const POIModal = (
    <POIProgressModal
      showPOIModalInfo={showPOIModalInfo}
      closeModal={closePOIDataModal}
    />
  );

  const POISuccessIcon = (
    <Icon
      source="check-circle-outline"
      size={22}
      color={styleguide.colors.txGreen()}
    />
  );

  return (
    <Tab.Navigator
      detachInactiveScreens={false}
      screenOptions={({ route }) => ({
        poiProgressData: poiProofProgressStatus,
        shouldShowAllProofsCompleted,
        onTapPOIData,
        POISuccessIcon,
        POIModal,
        tabBarIcon: ({ color, size }) => {
          return getTabBarIcon(color, size, route);
        },
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: styleguide.colors.gray7(),
        tabBarStyle: {
          backgroundColor: styleguide.colors.headerBackground,
          borderTopColor: styleguide.colors.gray7(),
          ...(isAndroid() ? { height: 60 } : {}),
        },
        tabBarLabelStyle: {
          ...styleguide.typography.label,
          fontSize: 12,
          lineHeight: 12,
          paddingBottom: isAndroid() ? 6 : 0,
        },
        tabBarBadge: tabBadge(route, pendingTransactionCount),
        tabBarBadgeStyle: {
          color: styleguide.colors.text(),
          backgroundColor: styleguide.colors.txYellow(),
          ...styleguide.typography.labelSmall,
          fontSize: 12,
          paddingTop: 1,
          marginLeft: 8,
        },
        headerShown: false,
        lazy: false,
      })}
    >
      <Tab.Screen
        name={NavigationTabName.Wallets}
        component={WalletsNavigator}
        listeners={hapticOnTabPress}
      />
      {isAndroid() && (
        <Tab.Screen
          name={NavigationTabName.dApps}
          component={DAppsNavigator}
          listeners={hapticOnTabPress}
        />
      )}
      {false && (
        <Tab.Screen
          name={NavigationTabName.NFTs}
          component={NFTsNavigator}
          listeners={hapticOnTabPress}
        />
      )}
      <Tab.Screen
        name={NavigationTabName.Activity}
        component={ActivityNavigator}
        listeners={hapticOnTabPress}
      />
      <Tab.Screen
        name={NavigationTabName.Settings}
        component={SettingsNavigator}
        listeners={hapticOnTabPress}
      />
    </Tab.Navigator>
  );
};

const RecoveryWalletsStack = createNativeStackNavigator();
const RecoveryWalletsNavigator = () => (
  <RecoveryWalletsStack.Navigator screenOptions={{ headerShown: false }}>
    <RecoveryWalletsStack.Screen
      name="RecoveryWalletsScreen"
      component={RecoveryWalletsScreen as ScreenComponent}
    />
    <RootStack.Screen
      name="SeedPhrase"
      component={SeedPhraseNavigator}
      options={{ gestureEnabled: true }}
    />
  </RecoveryWalletsStack.Navigator>
);

const SeedPhraseStack = createNativeStackNavigator();
const SeedPhraseNavigator = () => (
  <SeedPhraseStack.Navigator screenOptions={{ headerShown: false }}>
    <SeedPhraseStack.Screen
      name="ShowSeedPhrase"
      component={ShowSeedPhraseScreen as ScreenComponent}
      options={{ gestureEnabled: true }}
    />
    <SeedPhraseStack.Screen
      name="ShowViewingKey"
      component={ShowViewingKeyScreen as ScreenComponent}
      options={{ gestureEnabled: true }}
    />
  </SeedPhraseStack.Navigator>
);

const WalletsStack = createNativeStackNavigator();
const WalletsNavigator = () => (
  <WalletsStack.Navigator screenOptions={{ headerShown: false }}>
    <WalletsStack.Screen name="WalletsScreen" component={WalletsScreen} />
    <WalletsStack.Screen
      name="TokenInfo"
      component={ERC20Info as ScreenComponent}
    />
  </WalletsStack.Navigator>
);

const DAppsStack = createNativeStackNavigator();
const DAppsNavigator = () => (
  <DAppsStack.Navigator screenOptions={{ headerShown: false }}>
    <DAppsStack.Screen name="dAppsScreen" component={DAppsScreen} />
    <DAppsStack.Screen
      name="ApproveTokenConfirm"
      component={ApproveTokenConfirm as ScreenComponent}
    />

    {}
    <DAppsStack.Screen name="Swap" component={SwapScreen as ScreenComponent} />
    <DAppsStack.Screen
      name="SwapPublicConfirm"
      component={SwapPublicConfirm as ScreenComponent}
    />
    <DAppsStack.Screen
      name="SwapPrivateConfirm"
      component={SwapPrivateConfirm as ScreenComponent}
    />

    {}
    <DAppsStack.Screen
      name="FarmScreen"
      component={FarmScreen as ScreenComponent}
    />
    <DAppsStack.Screen
      name="FarmVaultInitial"
      component={FarmVaultInitial as ScreenComponent}
    />
    <DAppsStack.Screen
      name="FarmVaultConfirm"
      component={FarmVaultConfirm as ScreenComponent}
    />

    {}
    <DAppsStack.Screen
      name="LiquidityScreen"
      component={LiquidityScreen as ScreenComponent}
    />
    <DAppsStack.Screen
      name="AddLiquidityInitial"
      component={AddLiquidityInitial as ScreenComponent}
    />
    <DAppsStack.Screen
      name="AddLiquidityConfirm"
      component={AddLiquidityConfirm as ScreenComponent}
    />
    <DAppsStack.Screen
      name="RemoveLiquidityInitial"
      component={RemoveLiquidityInitial as ScreenComponent}
    />
    <DAppsStack.Screen
      name="RemoveLiquidityConfirm"
      component={RemoveLiquidityConfirm as ScreenComponent}
    />

    {}
    <RootStack.Group screenOptions={{ presentation: "modal" }}>
      <RootStack.Screen name="AddTokens" component={AddTokenNavigator} />
    </RootStack.Group>
  </DAppsStack.Navigator>
);

const NFTsStack = createNativeStackNavigator();
const NFTsNavigator = () => (
  <NFTsStack.Navigator screenOptions={{ headerShown: false }}>
    <NFTsStack.Screen name="NFTsScreen" component={NFTsScreen} />
  </NFTsStack.Navigator>
);

const ActivityStack = createNativeStackNavigator();
const ActivityNavigator = () => (
  <ActivityStack.Navigator screenOptions={{ headerShown: false }}>
    <ActivityStack.Screen name="ActivityScreen" component={ActivityScreen} />
  </ActivityStack.Navigator>
);

const SettingsStack = createNativeStackNavigator();
const SettingsNavigator = () => (
  <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
    <SettingsStack.Screen name="SettingsScreen" component={SettingsScreen} />
    <SettingsStack.Screen
      name="SettingsWallets"
      component={SettingsWalletsScreen}
    />
    <SettingsStack.Screen
      name="SettingsNetworks"
      component={SettingsNetworksScreen as ScreenComponent}
    />
    <SettingsStack.Screen
      name="SettingsDefaults"
      component={SettingsDefaultsScreen}
    />
    <SettingsStack.Screen
      name="SettingsWalletInfo"
      component={SettingsWalletInfoScreen as ScreenComponent}
    />
    <SettingsStack.Screen
      name="SettingsNetworkInfo"
      component={SettingsNetworkInfoScreen as ScreenComponent}
    />
    <SettingsStack.Screen
      name="SettingsAddRPC"
      component={SettingsAddCustomRPCScreen as ScreenComponent}
    />
    <SettingsStack.Screen
      name="SettingsBroadcasters"
      component={SettingsBroadcastersScreen}
    />
    <SettingsStack.Screen
      name="SettingsAddressBook"
      component={SettingsAddressBookScreen}
    />
    <SettingsStack.Screen
      name="SettingsAddSavedAddress"
      component={SettingsAddSavedAddressScreen}
    />
    <SettingsStack.Screen
      name="ShowSeedPhrase"
      component={ShowSeedPhraseScreen as ScreenComponent}
      options={{ gestureEnabled: true }}
    />
    <SettingsStack.Screen
      name="ShowViewingKey"
      component={ShowViewingKeyScreen as ScreenComponent}
      options={{ gestureEnabled: true }}
    />
  </SettingsStack.Navigator>
);

const NewWalletStack = createNativeStackNavigator();
const NewWalletNavigator = () => (
  <NewWalletStack.Navigator screenOptions={{ headerShown: false }}>
    <NewWalletStack.Screen name="CreateWallet" component={CreateWalletScreen} />
    <NewWalletStack.Screen name="ImportWallet" component={ImportWalletScreen} />
    <NewWalletStack.Screen
      name="AddViewOnlyWallet"
      component={AddViewOnlyWalletScreen}
    />
    <NewWalletStack.Screen
      name="NewWalletSuccess"
      component={NewWalletSuccess as ScreenComponent}
      options={{ gestureEnabled: false }}
    />
    <NewWalletStack.Screen
      name="SeedPhraseCallout"
      component={SeedPhraseCalloutScreen as ScreenComponent}
      options={{ gestureEnabled: false }}
    />
    <NewWalletStack.Screen
      name="ViewingKeyCallout"
      component={ViewingKeyCalloutScreen as ScreenComponent}
      options={{ gestureEnabled: false }}
    />
    <NewWalletStack.Screen
      name="ShowSeedPhrase"
      component={ShowSeedPhraseScreen as ScreenComponent}
      options={{ gestureEnabled: true }}
    />
    <NewWalletStack.Screen
      name="ReceiveToken"
      component={ReceiveTokenScreen as ScreenComponent}
    />
  </NewWalletStack.Navigator>
);

const TokenStack = createNativeStackNavigator();
const TokenNavigator = () => (
  <TokenStack.Navigator screenOptions={{ headerShown: false }}>
    <TokenStack.Screen
      name="ReceiveToken"
      component={ReceiveTokenScreen as ScreenComponent}
    />
    <TokenStack.Screen
      name="SendERC20s"
      component={SendERC20s as ScreenComponent}
    />
    <TokenStack.Screen
      name="SendERC20sConfirm"
      component={SendERC20sConfirm as ScreenComponent}
    />
    <TokenStack.Screen
      name="ShieldToken"
      component={ShieldERC20s as ScreenComponent}
    />
    <TokenStack.Screen
      name="ShieldERC20sConfirm"
      component={ShieldERC20sConfirm as ScreenComponent}
    />
    <TokenStack.Screen
      name="ApproveTokenConfirm"
      component={ApproveTokenConfirm as ScreenComponent}
    />
    <TokenStack.Screen
      name="UnshieldERC20s"
      component={UnshieldERC20s as ScreenComponent}
    />
    <TokenStack.Screen
      name="UnshieldERC20sConfirm"
      component={UnshieldERC20sConfirm as ScreenComponent}
    />
    <TokenStack.Screen
      name="MintTokensConfirm"
      component={MintTokensConfirm as ScreenComponent}
    />
    <TokenStack.Screen
      name="CancelTransactionConfirm"
      component={CancelTransactionConfirm as ScreenComponent}
    />
  </TokenStack.Navigator>
);

const AddToken = createNativeStackNavigator();
const AddTokenNavigator = () => (
  <AddToken.Navigator screenOptions={{ headerShown: false }}>
    <AddToken.Screen
      name="AddTokensScreen"
      component={AddTokensScreen as ScreenComponent}
    />
    <AddToken.Screen
      name="AddCustomTokenScreen"
      component={AddCustomTokenScreen as ScreenComponent}
    />
  </AddToken.Navigator>
);

const SelectNetworkFee = createNativeStackNavigator();
const SelectNetworkFeeNavigator = () => (
  <SelectNetworkFee.Navigator screenOptions={{ headerShown: false }}>
    <SelectNetworkFee.Screen
      name="SelectNetworkFeeModal"
      component={SelectNetworkFeeModal as ScreenComponent}
    />
    <SelectNetworkFee.Screen
      name="CustomNetworkFeeTypes01Screen"
      component={CustomNetworkFeeTypes01Screen as ScreenComponent}
    />
    <SelectNetworkFee.Screen
      name="CustomNetworkFeeType2Screen"
      component={CustomNetworkFeeType2Screen as ScreenComponent}
    />
  </SelectNetworkFee.Navigator>
);

export type RootNavProps = {
  showLockedScreen: boolean;
  backGesturesEnabled: boolean;
};

export const NavigationStack = ({
  backGesturesEnabled,
  showLockedScreen,
}: RootNavProps) => {
  enableScreens(true);
  return (
    <RootNavigator
      showLockedScreen={showLockedScreen}
      backGesturesEnabled={backGesturesEnabled}
    />
  );
};
