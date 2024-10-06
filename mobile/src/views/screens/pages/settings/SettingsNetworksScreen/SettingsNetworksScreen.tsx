import { ChainType, Network } from "@railgun-community/shared-models";
import React from "react";
import { ScrollView, View } from "react-native";
import { AppHeader } from "@components/headers/AppHeader/AppHeader";
import { HeaderBackButton } from "@components/headers/headerSideComponents/HeaderBackButton/HeaderBackButton";
import { SettingsStackParamList } from "@models/navigation-models";
import { NavigationProp, RouteProp } from "@react-navigation/native";
import {
  getSupportedNetworks,
  styleguide,
  useReduxSelector,
} from "@react-shared";
import { SettingsListItem } from "@screens/tabs/SettingsScreen/SettingsListItem/SettingsListItem";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { styles } from "./styles";

type Props = {
  navigation: NavigationProp<SettingsStackParamList, "SettingsNetworks">;
  route: RouteProp<
    { params?: SettingsStackParamList["SettingsNetworks"] },
    "params"
  >;
};

export const SettingsNetworksScreen: React.FC<Props> = ({
  navigation,
  route,
}) => {
  const { network } = useReduxSelector("network");
  const resetRecoveryMode = route.params?.resetRecoveryMode;

  const activeNetworkName = network.current.name;
  const networks = getSupportedNetworks();

  const onSelectNetwork = (network: Network) => {
    triggerHaptic(HapticSurface.NavigationButton);
    navigation.navigate("SettingsNetworkInfo", { network });
  };

  const chainTypeDescription = (network: Network) => {
    switch (network.chain.type) {
      case ChainType.EVM: {
        return `EVM network: ${network.chain.id}`;
      }
    }
  };

  const networkItem = (network: Network, index: number) => {
    const isLastNetwork = index === networks.length - 1;
    const isActive = network.name === activeNetworkName;
    return (
      <View key={index}>
        <SettingsListItem
          title={network.publicName}
          titleIcon={isActive ? "check-bold" : undefined}
          description={chainTypeDescription(network)}
          icon="chevron-right"
          onTap={() => onSelectNetwork(network)}
        />
        {!isLastNetwork && <View style={styles.hr} />}
      </View>
    );
  };

  return (
    <>
      <AppHeader
        title="Networks"
        backgroundColor={styleguide.colors.headerBackground}
        headerLeft={
          resetRecoveryMode ? (
            <HeaderBackButton label="Back" customAction={resetRecoveryMode} />
          ) : (
            <HeaderBackButton label="Settings" />
          )
        }
        isModal={false}
      />
      <View style={styles.wrapper}>
        <ScrollView>
          <View style={styles.itemRow}>
            <View style={styles.items}>{networks.map(networkItem)}</View>
          </View>
        </ScrollView>
      </View>
    </>
  );
};
