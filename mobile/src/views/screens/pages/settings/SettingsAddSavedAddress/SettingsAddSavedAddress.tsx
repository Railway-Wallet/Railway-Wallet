import { isDefined } from "@railgun-community/shared-models";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { HeaderBackButton } from "@components/headers/headerSideComponents/HeaderBackButton/HeaderBackButton";
import { SettingsStackParamList } from "@models/navigation-models";
import { NavigationProp } from "@react-navigation/native";
import {
  logDevError,
  SavedAddressService,
  SharedConstants,
  styleguide,
  useAppDispatch,
  validateRailgunAddress,
  WalletAddressType,
} from "@react-shared";
import { validateEthAddress } from "@utils/validation";
import { AppHeader } from "@views/components/headers/AppHeader/AppHeader";
import { HeaderTextButton } from "@views/components/headers/headerSideComponents/HeaderTextButton/HeaderTextButton";
import { TextEntry } from "@views/components/inputs/TextEntry/TextEntry";
import { styles } from "./styles";

type Props = {
  navigation: NavigationProp<SettingsStackParamList, "SettingsAddSavedAddress">;
};

export const SettingsAddSavedAddressScreen: React.FC<Props> = ({
  navigation,
}) => {
  const [addressName, setAddressName] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [addressType, setAddressType] = useState<Optional<WalletAddressType>>();
  const [hasValidName, setHasValidName] = useState(false);
  const [hasValidRecipient, setHasValidRecipient] = useState(false);
  const [isValidatingRecipient, setIsValidatingRecipient] = useState(false);
  const [errorText, setErrorText] = useState<Optional<string>>(undefined);

  const dispatch = useAppDispatch();

  useEffect(() => {
    const validateAddress = async () => {
      setIsValidatingRecipient(true);
      const validRailgunAddress = await validateRailgunAddress(address);
      if (validRailgunAddress) {
        setAddressType(WalletAddressType.Railgun);
        setHasValidRecipient(true);
        setIsValidatingRecipient(false);
        return;
      }

      const validEthAddress = await validateEthAddress(address);
      if (validEthAddress) {
        setAddressType(WalletAddressType.Ethereum);
        setHasValidRecipient(validEthAddress);
        setIsValidatingRecipient(false);
      }
    };

    if (address) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      validateAddress();
    }
  }, [address]);

  const onSubmit = async () => {
    if (
      !hasValidName ||
      !hasValidRecipient ||
      isValidatingRecipient ||
      !addressType
    ) {
      return;
    }

    try {
      if (addressName?.length > SharedConstants.MAX_LENGTH_WALLET_NAME) {
        throw new Error("Address name is too long.");
      }

      let ethAddress, railAddress, externalResolvedAddress;
      switch (addressType) {
        case WalletAddressType.Railgun:
          railAddress = address;
          break;
        case WalletAddressType.Ethereum:
          ethAddress = address;
          break;
        case WalletAddressType.ExternalResolved:
          externalResolvedAddress = address;
          break;
      }
      const savedAddressService = new SavedAddressService(dispatch);
      await savedAddressService.saveAddress(
        addressName,
        ethAddress,
        railAddress,
        externalResolvedAddress
      );

      navigation.goBack();
    } catch (error) {
      logDevError(error);
      setErrorText(error.message);
    }
  };

  const updateAddressName = (name: string) => {
    setAddressName(name);
    setHasValidName(name.length > 0);
  };

  const updateAddress = (address: string) => {
    setAddress(address);
  };

  const invalidRecipient =
    address?.length > 0 && !isValidatingRecipient && !hasValidRecipient;

  return (
    <>
      <AppHeader
        title="Add Address"
        backgroundColor={styleguide.colors.headerBackground}
        headerLeft={<HeaderBackButton />}
        headerRight={
          <HeaderTextButton
            text="Save"
            onPress={onSubmit}
            disabled={
              !hasValidName || !hasValidRecipient || isValidatingRecipient
            }
          />
        }
      />
      <View style={styles.wrapper}>
        <Text style={styles.placeholderText}>
          Save a private 0zk or public 0x address.
        </Text>
        <View style={styles.inputsWrapper}>
          <TextEntry
            value={addressName}
            onChangeText={updateAddressName}
            label="Name"
            placeholder="Enter text"
            viewStyles={[styles.nameInput]}
            autoFocus
            returnKeyType="next"
            autoCapitalize="none"
          />
          <View style={styles.horizontalLine} />
          <TextEntry
            value={address}
            onChangeText={updateAddress}
            label="Address"
            placeholder="Enter address"
            viewStyles={[
              styles.bottomInput,
              invalidRecipient ? styles.errorInput : undefined,
            ]}
            autoCapitalize="none"
          />
          {isDefined(errorText) && (
            <Text style={styles.errorText}>{errorText}</Text>
          )}
        </View>
      </View>
    </>
  );
};
