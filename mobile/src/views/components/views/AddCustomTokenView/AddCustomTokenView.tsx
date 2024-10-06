import { isDefined } from "@railgun-community/shared-models";
import React, { useEffect, useRef, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { WideButtonTextOnly } from "@components/buttons/WideButtonTextOnly/WideButtonTextOnly";
import { AppHeader } from "@components/headers/AppHeader/AppHeader";
import { HeaderBackButton } from "@components/headers/headerSideComponents/HeaderBackButton/HeaderBackButton";
import { ModalTextEntryInput } from "@components/inputs/ModalTextEntryInput/ModalTextEntryInput";
import {
  getERC20TokenDetails,
  logDevError,
  SearchableERC20,
  styleguide,
  TokenIconKey,
  useReduxSelector,
  validateCustomTokenFields,
  validateERC20TokenContract,
} from "@react-shared";
import { ErrorDetailsModal } from "@views/screens/modals/ErrorDetailsModal/ErrorDetailsModal";
import { styles } from "./styles";

type Props = {
  initialAddTokenAddress?: string;
  initialFullToken?: SearchableERC20;
  onSuccess: (token: SearchableERC20) => void;
  isAddingToken?: boolean;
  disableEditing?: boolean;
  onClose?: () => void;
};

export const AddCustomTokenView: React.FC<Props> = ({
  initialAddTokenAddress,
  isAddingToken,
  initialFullToken,
  onSuccess,
  onClose,
  disableEditing,
}) => {
  const { network } = useReduxSelector("network");

  const [hasValidTokenContract, setHasValidTokenContract] = useState(false);
  const [foundToken, setFoundToken] =
    useState<Optional<SearchableERC20>>(undefined);

  const [contractAddress, setContractAddress] = useState("");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [decimals, setDecimals] = useState("");
  const [icon, setIcon] = useState<Optional<TokenIconKey>>();
  const [logoURI, setLogoURI] = useState<Optional<string>>();
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<Optional<Error>>();
  const [showErrorDetailsModal, setShowErrorDetailsModal] = useState(false);

  const openErrorDetailsModal = () => {
    setShowErrorDetailsModal(true);
  };
  const dismissErrorDetailsModal = () => {
    setShowErrorDetailsModal(false);
  };

  useEffect(() => {
    if (isDefined(initialAddTokenAddress)) {
      setContractAddress(initialAddTokenAddress);
    }
    if (isDefined(initialFullToken)) {
      setFoundToken(initialFullToken);
      setContractAddress(initialFullToken.address);
      setHasValidTokenContract(true);
      setName(initialFullToken.name);
      setSymbol(initialFullToken.symbol);
      setDecimals(String(initialFullToken.decimals));
      setIcon(initialFullToken.icon);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearStates = () => {
    setError(undefined);
    setFoundToken(undefined);
    setName("");
    setSymbol("");
    setDecimals("");
    setIcon(undefined);
    setLogoURI(undefined);
  };

  useEffect(() => {
    if (!isDefined(initialFullToken)) {
      clearStates();

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      pullCoinInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractAddress]);

  const pullCoinInfo = async () => {
    try {
      if (!contractAddress.length) {
        return;
      }

      const isValidTokenContract = await validateERC20TokenContract(
        network.current.name,
        contractAddress
      );
      setHasValidTokenContract(isValidTokenContract);
      if (!isValidTokenContract) {
        throw new Error("Invalid token address");
      }

      setIcon(undefined);
      setDecimals("");
      setIsSearching(true);
      const searchCoin: SearchableERC20 = await getERC20TokenDetails(
        contractAddress,
        network.current
      );
      setIsSearching(false);

      setDecimals(String(searchCoin.decimals));

      if (searchCoin.name !== "" && searchCoin.symbol !== "") {
        setFoundToken(searchCoin);
        setName(searchCoin.name);
        setSymbol(searchCoin.symbol);
        setLogoURI(searchCoin.logoURI);
      }
    } catch (cause) {
      setIsSearching(false);
      setFoundToken(undefined);
      const error = new Error(
        `Could not get token details for ${network.current.publicName}`,
        { cause }
      );
      logDevError(error);
      setError(error);
    }
  };

  const onAddToken = () => {
    try {
      const token = validateCustomTokenFields(
        contractAddress,
        foundToken,
        hasValidTokenContract,
        name,
        symbol,
        decimals,
        icon,
        logoURI
      );
      if (token) {
        onSuccess(token);
      }
    } catch (cause) {
      const error = new Error(`Error adding custom token`, { cause });
      logDevError(error);
      setError(error);
    }
  };

  const addressEntryRef = useRef<TextInput | null>(null);
  const refEntry2 = useRef<TextInput | null>(null);
  const refEntry3 = useRef<TextInput | null>(null);

  return (
    <>
      <AppHeader
        title="Custom token"
        headerStatusBarHeight={16}
        headerLeft={<HeaderBackButton customAction={onClose} />}
        backgroundColor={styleguide.colors.gray5()}
        isModal={true}
      />
      <KeyboardAwareScrollView style={styles.wrapper} enableOnAndroid={true}>
        <View style={styles.spacer} />
        <ModalTextEntryInput
          label="Token address"
          placeholder="0x0"
          value={contractAddress}
          onChangeText={setContractAddress}
          invalid={contractAddress !== "" && !hasValidTokenContract}
          maxLength={42}
          autoCapitalize="none"
          multiline
          topBorder
          bottomBorder
          autoFocus
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => {
            refEntry2.current?.focus();
          }}
          labelIcon={hasValidTokenContract ? "check" : undefined}
          labelIconColor={styleguide.colors.txGreen()}
          labelIconSize={18}
          reference={addressEntryRef}
          editable={disableEditing !== true}
        />
        <View style={styles.spacer} />
        <ModalTextEntryInput
          label="Name"
          placeholder="Railgun"
          value={isSearching ? "Loading..." : name}
          onChangeText={setName}
          editable={
            !isDefined(foundToken) && !isSearching && disableEditing !== true
          }
          topBorder
          maxLength={24}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => {
            refEntry3.current?.focus();
          }}
          reference={refEntry2}
        />
        <View style={styles.horizontalLine} />
        <ModalTextEntryInput
          label="Symbol"
          placeholder="RAIL"
          value={isSearching ? "Loading..." : symbol}
          onChangeText={setSymbol}
          editable={
            !isDefined(foundToken) && !isSearching && disableEditing !== true
          }
          autoCapitalize="characters"
          maxLength={16}
          returnKeyType="next"
          blurOnSubmit={false}
          reference={refEntry3}
          bottomBorder
        />
        <View style={styles.spacer} />
        <WideButtonTextOnly
          title={
            isDefined(isAddingToken) && isAddingToken
              ? "Adding Token..."
              : "Add"
          }
          disabled={isAddingToken}
          onPress={onAddToken}
          additionalStyles={styles.submitButton}
        />
        <View style={styles.spacer} />
        {isDefined(error) && (
          <View style={styles.errorTextWrapper}>
            <Text style={styles.errorText}>
              {error.message}{" "}
              <Text
                style={styles.errorShowMore}
                onPress={openErrorDetailsModal}
              >
                (show more)
              </Text>
            </Text>
          </View>
        )}
      </KeyboardAwareScrollView>
      {isDefined(error) && (
        <ErrorDetailsModal
          error={error}
          show={showErrorDetailsModal}
          onDismiss={dismissErrorDetailsModal}
        />
      )}
    </>
  );
};
