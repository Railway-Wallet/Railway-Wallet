import { isDefined } from "@railgun-community/shared-models";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { AppHeader } from "@components/headers/AppHeader/AppHeader";
import { HeaderBackButton } from "@components/headers/headerSideComponents/HeaderBackButton/HeaderBackButton";
import { DAppsStackParamList } from "@models/navigation-models";
import { NavigationProp, RouteProp } from "@react-navigation/native";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { PublicPrivateSelector } from "./PublicPrivateSelector/PublicPrivateSelector";
import { SwapContainer } from "./SwapContent/SwapContainer";
import { styles } from "./SwapContent/styles";

type Props = {
  navigation: NavigationProp<DAppsStackParamList, "Swap">;
  route: RouteProp<{ params: DAppsStackParamList["Swap"] }, "params">;
};

export const SwapScreen: React.FC<Props> = ({ navigation, route }) => {
  const { navigationToken, isRailgun: isRailgunNavigation } = route.params;

  const [isRailgun, setIsRailgun] = useState(true);

  useEffect(() => {
    if (isDefined(isRailgunNavigation)) {
      setIsRailgun(isRailgunNavigation);
    }
  }, [isRailgunNavigation]);

  return (
    <>
      <AppHeader
        title="Railway DEX"
        isModal={false}
        headerLeft={<HeaderBackButton />}
        headerRight={
          <PublicPrivateSelector
            isRailgun={isRailgun}
            onTap={() => {
              triggerHaptic(HapticSurface.EditSuccess);
              setIsRailgun(!isRailgun);
            }}
          />
        }
      />
      <View style={styles.wrapper}>
        <Text style={styles.headerText}>
          RAILWAY <Text style={styles.thinnerHeader}>DEX</Text>
        </Text>
        <Text style={styles.subheaderText}>
          Private and public DEX aggregator
        </Text>
        <SwapContainer
          navigationToken={navigationToken}
          isRailgun={isRailgun}
          navigation={navigation}
        />
      </View>
    </>
  );
};
