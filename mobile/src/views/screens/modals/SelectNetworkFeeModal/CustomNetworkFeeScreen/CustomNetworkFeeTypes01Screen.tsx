import React, { useState } from "react";
import { Text, View } from "react-native";
import { WideButtonTextOnly } from "@components/buttons/WideButtonTextOnly/WideButtonTextOnly";
import { AppHeader } from "@components/headers/AppHeader/AppHeader";
import { HeaderBackButton } from "@components/headers/headerSideComponents/HeaderBackButton/HeaderBackButton";
import { ModalTextEntryInput } from "@components/inputs/ModalTextEntryInput/ModalTextEntryInput";
import { SelectNetworkFeeStackParamList } from "@models/navigation-models";
import {
  NavigationProp,
  RouteProp,
  StackActions,
} from "@react-navigation/native";
import {
  getDecimalBalanceString,
  logDevError,
  stringEntryToBigInt,
  styleguide,
  useReduxSelector,
} from "@react-shared";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { styles } from "./styles";

type Props = {
  navigation: NavigationProp<
    SelectNetworkFeeStackParamList,
    "CustomNetworkFeeTypes01Screen"
  >;
  route: RouteProp<
    { params: SelectNetworkFeeStackParamList["CustomNetworkFeeTypes01Screen"] },
    "params"
  >;
};

export const CustomNetworkFeeTypes01Screen = ({ navigation, route }: Props) => {
  const { network } = useReduxSelector("network");

  const { onDismiss, defaultGasDetails } = route.params;

  const defaultGasPriceString = getDecimalBalanceString(
    defaultGasDetails.gasPrice,
    9
  );

  const [gasPriceEntry, setGasPriceEntry] = useState(defaultGasPriceString);
  const [hasValidGasPriceEntry, setHasValidGasPriceEntry] = useState(true);

  const { decimals } = network.current.baseToken;
  if (decimals !== 18) {
    logDevError(
      new Error(
        "Base token must have 18 decimals to select custom network fee."
      )
    );
    return null;
  }

  const onSubmit = () => {
    if (!hasValidGasPriceEntry) {
      return;
    }
    triggerHaptic(HapticSurface.EditButton);
    const gasPrice = stringEntryToBigInt(gasPriceEntry, 9);
    onDismiss(gasPrice);
    navigation.dispatch(StackActions.pop(1));
  };

  const validateNumEntry = (entry: string) => {
    try {
      const num = stringEntryToBigInt(entry, decimals);
      return num > 0n;
    } catch (err) {
      return false;
    }
  };

  const updateGasPrice = (text: string) => {
    setGasPriceEntry(text);
    setHasValidGasPriceEntry(validateNumEntry(text));
  };

  return (
    <View style={styles.wrapper}>
      <AppHeader
        title="Custom network fee"
        headerStatusBarHeight={16}
        backgroundColor={styleguide.colors.gray5()}
        headerLeft={<HeaderBackButton customAction={onSubmit} />}
        isModal={true}
      />
      <View style={styles.content}>
        <ModalTextEntryInput
          label="Gas price (GWEI)"
          value={gasPriceEntry}
          onChangeText={updateGasPrice}
          placeholder={defaultGasPriceString}
          invalid={gasPriceEntry.length > 0 && !hasValidGasPriceEntry}
          useNumberPad
        />
        <View style={styles.spacer} />
        <WideButtonTextOnly
          title="Save custom fees"
          onPress={onSubmit}
          additionalStyles={styles.submitButton}
        />
        <Text style={styles.disclaimerText}>
          Warning: Custom gas values risk longer wait times for transactions.
        </Text>
      </View>
    </View>
  );
};
