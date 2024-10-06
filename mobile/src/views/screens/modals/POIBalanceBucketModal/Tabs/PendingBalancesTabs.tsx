import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { PendingBalancesModalTabOption } from "../PendingBalancesModal";
import { styles } from "./styles";

interface PendingBalancesTabsProps {
  selectedTab: PendingBalancesModalTabOption;
  setSelectedTab: (tab: PendingBalancesModalTabOption) => void;
  showRestrictedTab: boolean;
}

export const PendingBalancesTabs = ({
  selectedTab,
  setSelectedTab,
  showRestrictedTab,
}: PendingBalancesTabsProps) => {
  const allTabs = Object.values(PendingBalancesModalTabOption).filter(
    (tab) =>
      showRestrictedTab || tab !== PendingBalancesModalTabOption.Restricted
  );

  return (
    <View style={styles.poiTabContainer}>
      {allTabs.map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.poiTab, tab === selectedTab && styles.poiTabSelected]}
          onPress={() => {
            triggerHaptic(HapticSurface.NavigationButton);
            setSelectedTab(tab);
          }}
        >
          <Text
            style={[
              styles.poiTabText,
              tab === selectedTab && styles.poiTextSelected,
            ]}
          >
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};
