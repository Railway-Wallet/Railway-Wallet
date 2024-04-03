import React from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { AppHeader } from '@components/headers/AppHeader/AppHeader';
import { HeaderBackButton } from '@components/headers/headerSideComponents/HeaderBackButton/HeaderBackButton';
import { SettingsStackParamList } from '@models/navigation-models';
import { NavigationProp } from '@react-navigation/native';
import {
  BlockedRelayerService,
  shortenWalletAddress,
  styleguide,
  useAppDispatch,
  useReduxSelector,
} from '@react-shared';
import { SettingsListHeader } from '@screens/tabs/SettingsScreen/SettingsListHeader/SettingsListHeader';
import { SettingsListItem } from '@screens/tabs/SettingsScreen/SettingsListItem/SettingsListItem';
import { HapticSurface, triggerHaptic } from '@services/util/haptic-service';
import { styles } from './styles';

type Props = {
  navigation: NavigationProp<SettingsStackParamList, 'SettingsRelayers'>;
};

export const SettingsRelayersScreen: React.FC<Props> = () => {
  const { relayerBlocklist } = useReduxSelector('relayerBlocklist');

  const dispatch = useAppDispatch();

  const unblockRelayer = async (pubKey: string) => {
    const blockedRelayerService = new BlockedRelayerService(dispatch);
    await blockedRelayerService.removeBlockedRelayer(pubKey);
  };

  const promptRemoveBlockedRelayer = (pubKey: string) => {
    triggerHaptic(HapticSurface.NavigationButton);
    Alert.alert(
      'Unblock relayer?',
      `Address: ${shortenWalletAddress(pubKey)}.`,
      [
        {
          text: 'Unblock',
          onPress: () => unblockRelayer(pubKey),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
    );
  };

  const hasBlockedRelayers = relayerBlocklist.relayers.length > 0;

  return (
    <>
      <AppHeader
        title={'Public Relayers'}
        backgroundColor={styleguide.colors.headerBackground}
        headerLeft={<HeaderBackButton label="Settings" />}
        isModal={false}
      />
      <View style={styles.wrapper}>
        <ScrollView>
          {/* eslint-disable-next-line react-native/no-inline-styles */}
          <View style={[styles.itemRow, { marginTop: 20, marginBottom: 20 }]}>
            <SettingsListHeader title="Blocked Public Relayers" />
            <View
              style={[
                styles.items,
                hasBlockedRelayers ? styles.extraItemsTopPadding : {},
              ]}
            >
              {!hasBlockedRelayers && (
                <Text style={styles.placeholderText}>
                  No blocked public relayers.
                </Text>
              )}
              {relayerBlocklist.relayers.map((blockedRelayer, index) => (
                <SettingsListItem
                  key={index}
                  title={shortenWalletAddress(blockedRelayer.railgunAddress)}
                  icon="minus-circle"
                  onTap={() =>
                    promptRemoveBlockedRelayer(blockedRelayer.railgunAddress)
                  }
                />
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
};
