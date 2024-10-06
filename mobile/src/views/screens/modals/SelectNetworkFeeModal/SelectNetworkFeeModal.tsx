import {
  EVMGasType,
  isDefined,
  TransactionGasDetails,
} from "@railgun-community/shared-models";
import React, { useState } from "react";
import { Text, View } from "react-native";
import { FooterButtonAndroid } from "@components/footers/FooterButtonAndroid/FooterButtonAndroid";
import { AppHeader } from "@components/headers/AppHeader/AppHeader";
import { HeaderTextButton } from "@components/headers/headerSideComponents/HeaderTextButton/HeaderTextButton";
import { SelectNetworkFeeStackParamList } from "@models/navigation-models";
import {
  NavigationProp,
  RouteProp,
  StackActions,
} from "@react-navigation/native";
import {
  broadcasterFeeInfoText,
  CustomGasTransactionDetails,
  logDev,
  NetworkFeeSelection,
  networkGasText,
  styleguide,
  useReduxSelector,
} from "@react-shared";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { NetworkFeeOption } from "./NetworkFeeOption/NetworkFeeOption";
import { styles } from "./styles";

type Props = {
  navigation: NavigationProp<
    SelectNetworkFeeStackParamList,
    "SelectNetworkFeeModal"
  >;
  route: RouteProp<
    { params: SelectNetworkFeeStackParamList["SelectNetworkFeeModal"] },
    "params"
  >;
};

export const SelectNetworkFeeModal: React.FC<Props> = ({
  route,
  navigation,
}) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");
  const { networkPrices } = useReduxSelector("networkPrices");

  const {
    onDismiss,
    currentOption,
    gasDetailsMap,
    defaultCustomGasTransactionDetails,
    selectedBroadcaster,
    selectedFeeToken,
    isBroadcasterTransaction,
  } = route.params;

  const [selectedOption, setSelectedOption] = useState(currentOption);

  const [customGasPrice, setCustomGasPrice] = useState<Optional<bigint>>(
    defaultCustomGasTransactionDetails.gasPrice
  );
  const [customMaxFeePerGas, setCustomMaxFeePerGas] = useState<
    Optional<bigint>
  >(defaultCustomGasTransactionDetails.maxFeePerGas);
  const [customMaxPriorityFeePerGas, setCustomMaxPriorityFeePerGas] = useState<
    Optional<bigint>
  >(defaultCustomGasTransactionDetails.maxPriorityFeePerGas);

  if (!gasDetailsMap) {
    return null;
  }

  const onSelectNetworkFeeOption = (option: NetworkFeeSelection) => {
    triggerHaptic(HapticSurface.SelectItem);
    setSelectedOption(option);
  };

  const networkFeeOptionRightView = (gasDetails: TransactionGasDetails) => {
    if (!isDefined(gasDetails)) {
      return null;
    }

    const showExactCurrencyGasPrice = true;

    let gasTextFormatted: {
      networkFeeText: string;
      networkFeePriceText: string;
    };

    if (isBroadcasterTransaction) {
      if (!selectedBroadcaster) {
        logDev("Requires selected broadcaster to choose network fee.");
        return null;
      }
      const broadcasterFeeInfo = broadcasterFeeInfoText(
        wallets.available,
        network.current,
        networkPrices,
        selectedBroadcaster,
        selectedFeeToken,
        gasDetails,
        showExactCurrencyGasPrice
      );
      gasTextFormatted = {
        networkFeeText:
          broadcasterFeeInfo?.broadcasterFeeText ?? "Updating gas fee",
        networkFeePriceText:
          broadcasterFeeInfo?.broadcasterFeeSubtext ?? "Please wait...",
      };
    } else {
      gasTextFormatted = networkGasText(
        network.current,
        networkPrices,
        gasDetails,
        showExactCurrencyGasPrice
      );
    }

    return (
      <View style={styles.rightText}>
        <Text style={styles.rightTitle}>{gasTextFormatted.networkFeeText}</Text>
        <Text style={styles.rightDescription}>
          {gasTextFormatted.networkFeePriceText}
        </Text>
      </View>
    );
  };

  const customGasDetailsTypes01 = (
    evmGasType: EVMGasType.Type0 | EVMGasType.Type1,
    gasPrice: bigint
  ): TransactionGasDetails => {
    return {
      evmGasType,
      gasEstimate: gasDetailsMap[NetworkFeeSelection.Standard].gasEstimate,
      gasPrice,
    };
  };

  const customGasDetailsType2 = (
    maxFeePerGas: bigint,
    maxPriorityFeePerGas: bigint
  ): TransactionGasDetails => {
    return {
      evmGasType: EVMGasType.Type2,
      gasEstimate: gasDetailsMap[NetworkFeeSelection.Standard].gasEstimate,
      maxFeePerGas,
      maxPriorityFeePerGas,
    };
  };

  const customNetworkFeeOptionRightView = () => {
    const normalGasDetails = gasDetailsMap[NetworkFeeSelection.Standard];
    switch (normalGasDetails.evmGasType) {
      case EVMGasType.Type0:
      case EVMGasType.Type1: {
        if (isDefined(customGasPrice)) {
          return networkFeeOptionRightView(
            customGasDetailsTypes01(normalGasDetails.evmGasType, customGasPrice)
          );
        }
        break;
      }
      case EVMGasType.Type2: {
        if (
          isDefined(customMaxFeePerGas) &&
          isDefined(customMaxPriorityFeePerGas)
        ) {
          return networkFeeOptionRightView(
            customGasDetailsType2(
              customMaxFeePerGas,
              customMaxPriorityFeePerGas
            )
          );
        }
        break;
      }
    }

    return rightView("Advanced gas selection", "Set custom gas fee");
  };

  const rightView = (rightTitle: string, rightDescription: string) => {
    return (
      <View style={styles.rightText}>
        <Text style={styles.rightTitle}>{rightTitle}</Text>
        <Text style={styles.rightDescription}>{rightDescription}</Text>
      </View>
    );
  };

  const getDefaultGasDetailsForCustomFee = () => {
    const defaultGasDetails = gasDetailsMap[selectedOption];
    if (selectedOption === NetworkFeeSelection.Custom) {
      switch (defaultGasDetails.evmGasType) {
        case EVMGasType.Type0:
        case EVMGasType.Type1: {
          if (isDefined(customGasPrice)) {
            return customGasDetailsTypes01(
              defaultGasDetails.evmGasType,
              customGasPrice
            );
          }
          break;
        }
        case EVMGasType.Type2: {
          if (
            isDefined(customMaxFeePerGas) &&
            isDefined(customMaxPriorityFeePerGas)
          ) {
            return customGasDetailsType2(
              customMaxFeePerGas,
              customMaxPriorityFeePerGas
            );
          }
          break;
        }
      }
    }
    return defaultGasDetails;
  };

  const onSelectCustomFee = () => {
    triggerHaptic(HapticSurface.SelectItem);
    const defaultGasDetails = getDefaultGasDetailsForCustomFee();
    switch (defaultGasDetails.evmGasType) {
      case EVMGasType.Type0:
      case EVMGasType.Type1:
        navigation.navigate("CustomNetworkFeeTypes01Screen", {
          onDismiss: onDismissCustomFeeTypes01Modal,
          defaultGasDetails,
        });
        break;
      case EVMGasType.Type2:
        navigation.navigate("CustomNetworkFeeType2Screen", {
          onDismiss: onDismissCustomFeeType2Modal,
          defaultGasDetails,
        });
        break;
    }
  };

  const onDismissCustomFeeTypes01Modal = (customGasPrice?: bigint) => {
    if (isDefined(customGasPrice)) {
      setCustomGasPrice(customGasPrice);
      setSelectedOption(NetworkFeeSelection.Custom);
    }
  };

  const onDismissCustomFeeType2Modal = (
    customMaxFeePerGas?: bigint,
    customMaxPriorityFeePerGas?: bigint
  ) => {
    if (
      isDefined(customMaxFeePerGas) &&
      isDefined(customMaxPriorityFeePerGas)
    ) {
      setCustomMaxFeePerGas(customMaxFeePerGas);
      setCustomMaxPriorityFeePerGas(customMaxPriorityFeePerGas);
      setSelectedOption(NetworkFeeSelection.Custom);
    }
  };

  const onSave = () => {
    const customGasTransactionDetails: CustomGasTransactionDetails = {
      gasPrice: customGasPrice,
      maxFeePerGas: customMaxFeePerGas,
      maxPriorityFeePerGas: customMaxPriorityFeePerGas,
    };
    onDismiss(selectedOption, customGasTransactionDetails);
    navigation.dispatch(StackActions.pop(1));
  };

  return (
    <>
      <View style={styles.wrapper}>
        <AppHeader
          title="Network Fee"
          headerStatusBarHeight={16}
          backgroundColor={styleguide.colors.gray5()}
          headerLeft={
            <HeaderTextButton
              text="Cancel"
              onPress={() => {
                onDismiss();
                navigation.dispatch(StackActions.pop(1));
              }}
            />
          }
          headerRight={<HeaderTextButton text="Save" onPress={onSave} />}
          isModal={true}
        />
        <View style={styles.listWrapper}>
          <Text style={styles.listHeader}>Select transaction speed</Text>
          <NetworkFeeOption
            title="Slower"
            description=""
            selected={selectedOption === NetworkFeeSelection.Slower}
            onSelect={() =>
              onSelectNetworkFeeOption(NetworkFeeSelection.Slower)
            }
            rightView={() =>
              networkFeeOptionRightView(
                gasDetailsMap[NetworkFeeSelection.Slower]
              )
            }
          />
          <NetworkFeeOption
            title="Standard"
            description=""
            selected={selectedOption === NetworkFeeSelection.Standard}
            onSelect={() =>
              onSelectNetworkFeeOption(NetworkFeeSelection.Standard)
            }
            rightView={() =>
              networkFeeOptionRightView(
                gasDetailsMap[NetworkFeeSelection.Standard]
              )
            }
          />
          <NetworkFeeOption
            title="Faster"
            description=""
            selected={selectedOption === NetworkFeeSelection.Faster}
            onSelect={() =>
              onSelectNetworkFeeOption(NetworkFeeSelection.Faster)
            }
            rightView={() =>
              networkFeeOptionRightView(
                gasDetailsMap[NetworkFeeSelection.Faster]
              )
            }
          />
          <NetworkFeeOption
            title="Aggressive"
            description=""
            selected={selectedOption === NetworkFeeSelection.Aggressive}
            onSelect={() =>
              onSelectNetworkFeeOption(NetworkFeeSelection.Aggressive)
            }
            rightView={() =>
              networkFeeOptionRightView(
                gasDetailsMap[NetworkFeeSelection.Aggressive]
              )
            }
          />
          <NetworkFeeOption
            title="Custom"
            description=""
            selected={selectedOption === NetworkFeeSelection.Custom}
            onSelect={() => onSelectCustomFee()}
            rightView={() => customNetworkFeeOptionRightView()}
          />
        </View>
      </View>
      <FooterButtonAndroid buttonTitle="Save" buttonAction={onSave} />
    </>
  );
};
