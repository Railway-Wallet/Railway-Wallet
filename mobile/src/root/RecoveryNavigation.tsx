import React from "react";
import { enableScreens } from "react-native-screens";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LockedScreen } from "@screens/pages/locked/LockedScreen/LockedScreen";
import { RecoveryWalletsScreen } from "@screens/pages/recovery/RecoveryWalletsScreen";
import { ShowSeedPhraseScreen } from "@screens/pages/settings/ShowSeedPhraseScreen/ShowSeedPhraseScreen";
import { SettingsAddCustomRPCScreen } from "@views/screens/pages/settings/SettingsAddCustomRPCScreen/SettingsAddCustomRPCScreen";
import { SettingsNetworkInfoScreen } from "@views/screens/pages/settings/SettingsNetworkInfoScreen/SettingsNetworkInfoScreen";
import { SettingsNetworksScreen } from "@views/screens/pages/settings/SettingsNetworksScreen/SettingsNetworksScreen";
import { ShowViewingKeyScreen } from "@views/screens/pages/settings/ShowViewingKeyScreen/ShowViewingKeyScreen";
import { RootNavProps, ScreenComponent } from "./Navigation";

const RootStack = createNativeStackNavigator();
const RootNavigator = ({
  showLockedScreen,
  showNetworksScreen,
  backGesturesEnabled,
  resetRecoveryMode,
}: RecoveryRootNavProps) => (
  <RootStack.Navigator screenOptions={{ headerShown: false }}>
    <RootStack.Group>
      {showLockedScreen && (
        <RootStack.Screen
          name="LockedScreen"
          component={LockedScreen as ScreenComponent}
          initialParams={{ recoveryMode: true }}
        />
      )}
      {showNetworksScreen && (
        <RootStack.Screen
          name="RecoveryNetworks"
          component={SettingsNetworksScreen as ScreenComponent}
          initialParams={{
            resetRecoveryMode,
          }}
        />
      )}
      <RootStack.Screen
        name="RecoveryWallets"
        component={RecoveryWalletsScreen as ScreenComponent}
        initialParams={{
          resetRecoveryMode,
        }}
      />
      <RootStack.Screen
        name="SeedPhrase"
        component={SeedPhraseNavigator}
        options={{ gestureEnabled: backGesturesEnabled }}
      />
      <RootStack.Screen
        name="SettingsNetworkInfo"
        component={SettingsNetworkInfoScreen as ScreenComponent}
      />
      <RootStack.Screen
        name="SettingsAddRPC"
        component={SettingsAddCustomRPCScreen as ScreenComponent}
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

export type RecoveryRootNavProps = RootNavProps & {
  showNetworksScreen: boolean;
  resetRecoveryMode: () => void;
};

export const RecoveryNavigationStack = (props: RecoveryRootNavProps) => {
  enableScreens(true);
  return (
    <RootNavigator
      showLockedScreen={props.showLockedScreen}
      showNetworksScreen={props.showNetworksScreen}
      backGesturesEnabled={props.backGesturesEnabled}
      resetRecoveryMode={props.resetRecoveryMode}
    />
  );
};
