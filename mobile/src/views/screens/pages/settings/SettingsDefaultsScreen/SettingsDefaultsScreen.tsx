import React from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { AppHeader } from "@components/headers/AppHeader/AppHeader";
import { HeaderBackButton } from "@components/headers/headerSideComponents/HeaderBackButton/HeaderBackButton";
import { TextEntry } from "@components/inputs/TextEntry/TextEntry";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { SettingsStackParamList } from "@models/navigation-models";
import { NavigationProp } from "@react-navigation/native";
import {
  AppSettingsService,
  Currency,
  currencyName,
  styleguide,
  SUPPORTED_CURRENCIES,
} from "@react-shared";
import {
  callActionSheet,
  OptionWithAction,
} from "@services/util/action-sheet-options-service";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { createUpdateSettingsAlert } from "@utils/alerts";
import { styles } from "./styles";

type Props = {
  navigation: NavigationProp<SettingsStackParamList, "SettingsDefaults">;
};

export const SettingsDefaultsScreen: React.FC<Props> = () => {
  const { showActionSheetWithOptions } = useActionSheet();

  const createCurrencyOption = (currency: Currency): OptionWithAction => {
    return {
      name: currencyName(currency),
      action: () => selectCurrency(currency),
    };
  };

  const onTapEditCurrency = () => {
    triggerHaptic(HapticSurface.NavigationButton);
    const currencyOptions = SUPPORTED_CURRENCIES.map(createCurrencyOption);
    callActionSheet(
      showActionSheetWithOptions,
      "Select currency",
      currencyOptions
    );
  };

  const selectCurrency = (currency: Currency) => {
    triggerHaptic(HapticSurface.EditButton);
    createUpdateSettingsAlert(currency);
  };

  return (
    <>
      <AppHeader
        title="Default settings"
        backgroundColor={styleguide.colors.headerBackground}
        headerLeft={<HeaderBackButton label="Settings" />}
        isModal={false}
      />
      <View style={styles.wrapper}>
        <ScrollView>
          <View style={styles.itemRow}>
            <TouchableOpacity
              style={styles.items}
              activeOpacity={0.8}
              onPress={onTapEditCurrency}
            >
              <TextEntry
                viewStyles={[styles.walletInfoTextEntry]}
                label="Currency"
                value={currencyName(AppSettingsService.currency)}
                iconButtons={[
                  {
                    icon: "pencil-outline",
                    onTap: onTapEditCurrency,
                  },
                ]}
                editable={false}
              />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </>
  );
};
