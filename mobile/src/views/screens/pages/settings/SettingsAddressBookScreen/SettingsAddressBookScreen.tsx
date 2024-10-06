import { isDefined } from "@railgun-community/shared-models";
import React from "react";
import { FlatList, ListRenderItem, Text, View } from "react-native";
import { HeaderBackButton } from "@components/headers/headerSideComponents/HeaderBackButton/HeaderBackButton";
import { SettingsStackParamList } from "@models/navigation-models";
import { NavigationProp } from "@react-navigation/native";
import {
  SavedAddress,
  SavedAddressService,
  shortenWalletAddress,
  styleguide,
  useAppDispatch,
  useReduxSelector,
} from "@react-shared";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { AppHeader } from "@views/components/headers/AppHeader/AppHeader";
import { HeaderIconButton } from "@views/components/headers/headerSideComponents/HeaderIconButton/HeaderIconButton";
import { SettingsListItem } from "@views/screens/tabs/SettingsScreen/SettingsListItem/SettingsListItem";
import { styles } from "./styles";

type Props = {
  navigation: NavigationProp<SettingsStackParamList, "SettingsAddressBook">;
};

export const SettingsAddressBookScreen: React.FC<Props> = ({ navigation }) => {
  const { savedAddresses } = useReduxSelector("savedAddresses");
  const dispatch = useAppDispatch();

  const deleteAddress = (address: SavedAddress) => {
    const savedAddressService = new SavedAddressService(dispatch);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    savedAddressService.delete(address);
  };

  const descriptionItem = (savedAddress: SavedAddress) => {
    if (isDefined(savedAddress.railAddress)) {
      return `Private address: ${shortenWalletAddress(
        savedAddress.railAddress
      )}`;
    }

    if (isDefined(savedAddress.ethAddress)) {
      return `Public address: ${shortenWalletAddress(savedAddress.ethAddress)}`;
    }

    if (isDefined(savedAddress.externalResolvedAddress)) {
      return `Resolved address: ${savedAddress.externalResolvedAddress}`;
    }

    return "No address found";
  };

  const renderSavedAddress: ListRenderItem<SavedAddress> = ({
    item,
    index,
  }) => {
    return (
      <SettingsListItem
        key={index}
        title={item.name}
        description={descriptionItem(item)}
        icon="trash-can-outline"
        onTap={() => deleteAddress(item)}
      />
    );
  };

  const addNewAddress = () => {
    triggerHaptic(HapticSurface.NavigationButton);
    navigation.navigate("SettingsAddSavedAddress");
  };

  // eslint-disable-next-line react/no-unstable-nested-components
  const ItemSeparator = () => <View style={styles.hr} />;

  return (
    <>
      <AppHeader
        title="Saved Addresses"
        backgroundColor={styleguide.colors.headerBackground}
        headerLeft={<HeaderBackButton label="Settings" />}
        headerRight={<HeaderIconButton icon="plus" onPress={addNewAddress} />}
      />
      <View style={styles.wrapper}>
        <FlatList
          data={savedAddresses.current}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderSavedAddress}
          contentContainerStyle={styles.items}
          ItemSeparatorComponent={ItemSeparator}
          ListEmptyComponent={
            <View style={styles.items}>
              <Text style={styles.placeholderText}>No saved addresses.</Text>
            </View>
          }
        />
      </View>
    </>
  );
};
