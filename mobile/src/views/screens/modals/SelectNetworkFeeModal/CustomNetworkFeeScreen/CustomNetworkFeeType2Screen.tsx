import { isDefined } from "@railgun-community/shared-models";
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
import { ErrorDetailsModal } from "../../ErrorDetailsModal/ErrorDetailsModal";
import { styles } from "./styles";

type Props = {
  navigation: NavigationProp<
    SelectNetworkFeeStackParamList,
    "CustomNetworkFeeType2Screen"
  >;
  route: RouteProp<
    { params: SelectNetworkFeeStackParamList["CustomNetworkFeeType2Screen"] },
    "params"
  >;
};

export const CustomNetworkFeeType2Screen = ({ navigation, route }: Props) => {
  const { network } = useReduxSelector("network");

  const { onDismiss, defaultGasDetails } = route.params;

  const defaultMaxFeeString = getDecimalBalanceString(
    defaultGasDetails.maxFeePerGas,
    9
  );
  const defaultMaxPriorityFeeString = getDecimalBalanceString(
    defaultGasDetails.maxPriorityFeePerGas,
    9
  );

  const [maxFeeEntry, setMaxFeeEntry] = useState(defaultMaxFeeString);
  const [maxPriorityFeeEntry, setMaxPriorityFeeEntry] = useState(
    defaultMaxPriorityFeeString
  );
  const [hasValidMaxFeeEntry, setHasValidMaxFeeEntry] = useState(true);
  const [hasValidMaxPriorityFeeEntry, setHasValidMaxPriorityFeeEntry] =
    useState(true);

  const [error, setError] = useState<Optional<Error>>();
  const [showErrorDetailsModal, setShowErrorDetailsModal] = useState(false);

  const openErrorDetailsModal = () => {
    setShowErrorDetailsModal(true);
  };
  const dismissErrorDetailsModal = () => {
    setShowErrorDetailsModal(false);
  };

  const { decimals } = network.current.baseToken;
  if (decimals !== 18) {
    logDevError(
      new Error(
        "Base token must have 18 decimals to select custom network fee."
      )
    );
    return null;
  }

  const onCancel = () => {
    onDismiss();
    navigation.dispatch(StackActions.pop(1));
  };

  const onSubmit = () => {
    if (!hasValidMaxFeeEntry || !hasValidMaxPriorityFeeEntry) {
      return;
    }
    const maxFee = stringEntryToBigInt(maxFeeEntry, 9);
    const maxPriorityFee = stringEntryToBigInt(maxPriorityFeeEntry, 9);

    if (!validateMaxPriorityFeeLessThanMaxFee(maxFee, maxPriorityFee)) {
      triggerHaptic(HapticSurface.NotifyError);
      setError(new Error("Max base fee must exceed priority fee."));
      return;
    }

    triggerHaptic(HapticSurface.EditButton);
    onDismiss(maxFee, maxPriorityFee);
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

  const validateMaxPriorityFeeLessThanMaxFee = (
    maxFee: bigint,
    maxPriorityFee: bigint
  ) => {
    return maxFee >= maxPriorityFee;
  };

  const updateMaxFee = (text: string) => {
    setMaxFeeEntry(text);
    setHasValidMaxFeeEntry(validateNumEntry(text));
  };

  const updateMaxPriorityFee = (text: string) => {
    setMaxPriorityFeeEntry(text);
    setHasValidMaxPriorityFeeEntry(validateNumEntry(text));
  };

  return (
    <View style={styles.wrapper}>
      <AppHeader
        title="Custom network fee"
        headerStatusBarHeight={16}
        backgroundColor={styleguide.colors.gray5()}
        headerLeft={<HeaderBackButton customAction={onCancel} />}
        isModal={true}
      />
      <View style={styles.content}>
        <ModalTextEntryInput
          label="Max base fee (GWEI)"
          value={maxFeeEntry}
          onChangeText={updateMaxFee}
          placeholder={defaultMaxFeeString}
          invalid={maxFeeEntry.length > 0 && !hasValidMaxFeeEntry}
          useNumberPad
        />
        <ModalTextEntryInput
          label="Priority fee (GWEI)"
          value={maxPriorityFeeEntry}
          onChangeText={updateMaxPriorityFee}
          placeholder={defaultMaxPriorityFeeString}
          invalid={
            maxPriorityFeeEntry.length > 0 && !hasValidMaxPriorityFeeEntry
          }
          useNumberPad
        />
        <View style={styles.spacer} />
        <WideButtonTextOnly
          title="Save custom fees"
          onPress={onSubmit}
          additionalStyles={styles.submitButton}
        />
        <View style={styles.spacer} />
        {isDefined(error) && (
          <>
            <Text style={styles.errorText}>
              {error.message}{" "}
              <Text
                style={styles.errorShowMore}
                onPress={openErrorDetailsModal}
              >
                (show more)
              </Text>
            </Text>
            <ErrorDetailsModal
              error={error}
              show={showErrorDetailsModal}
              onDismiss={dismissErrorDetailsModal}
            />
          </>
        )}
        <Text style={styles.disclaimerText}>
          Warning: Custom gas values risk longer wait times for transactions.
        </Text>
      </View>
    </View>
  );
};
