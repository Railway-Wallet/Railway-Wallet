import React from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { AppHeader } from "@components/headers/AppHeader/AppHeader";
import { HeaderBackButton } from "@components/headers/headerSideComponents/HeaderBackButton/HeaderBackButton";
import { SettingsStackParamList } from "@models/navigation-models";
import { NavigationProp } from "@react-navigation/native";
import {
  BlockedBroadcasterService,
  shortenWalletAddress,
  styleguide,
  useAppDispatch,
  useReduxSelector,
} from "@react-shared";
import { SettingsListHeader } from "@screens/tabs/SettingsScreen/SettingsListHeader/SettingsListHeader";
import { SettingsListItem } from "@screens/tabs/SettingsScreen/SettingsListItem/SettingsListItem";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { styles } from "./styles";

type Props = {
  navigation: NavigationProp<SettingsStackParamList, "SettingsBroadcasters">;
};

export const SettingsBroadcastersScreen: React.FC<Props> = () => {
  const { broadcasterBlocklist } = useReduxSelector("broadcasterBlocklist");

  const dispatch = useAppDispatch();

  const unblockBroadcaster = async (pubKey: string) => {
    const blockedBroadcasterService = new BlockedBroadcasterService(dispatch);
    await blockedBroadcasterService.removeBlockedBroadcaster(pubKey);
  };

  const promptRemoveBlockedBroadcaster = (pubKey: string) => {
    triggerHaptic(HapticSurface.NavigationButton);
    Alert.alert(
      "Unblock broadcaster?",
      `Address: ${shortenWalletAddress(pubKey)}.`,
      [
        {
          text: "Unblock",
          onPress: () => unblockBroadcaster(pubKey),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const hasBlockedBroadcasters = broadcasterBlocklist.broadcasters.length > 0;

  return (
    <>
      <AppHeader
        title={"Public Broadcasters"}
        backgroundColor={styleguide.colors.headerBackground}
        headerLeft={<HeaderBackButton label="Settings" />}
        isModal={false}
      />
      <View style={styles.wrapper}>
        <ScrollView>
          {/* eslint-disable-next-line react-native/no-inline-styles */}
          <View style={[styles.itemRow, { marginTop: 20, marginBottom: 20 }]}>
            <SettingsListHeader title="Blocked Public Broadcasters" />
            <View
              style={[
                styles.items,
                hasBlockedBroadcasters ? styles.extraItemsTopPadding : {},
              ]}
            >
              {!hasBlockedBroadcasters && (
                <Text style={styles.placeholderText}>
                  No blocked public broadcasters.
                </Text>
              )}
              {broadcasterBlocklist.broadcasters.map(
                (blockedBroadcaster, index) => (
                  <SettingsListItem
                    key={index}
                    title={shortenWalletAddress(
                      blockedBroadcaster.railgunAddress
                    )}
                    icon="minus-circle"
                    onTap={() =>
                      promptRemoveBlockedBroadcaster(
                        blockedBroadcaster.railgunAddress
                      )
                    }
                  />
                )
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
};
