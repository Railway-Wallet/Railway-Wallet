import {
  isDefined,
  WalletCreationType,
} from "@railgun-community/shared-models";
import React, { useRef, useState } from "react";
import { Text, TextInput, View } from "react-native";
import DatePicker from "react-native-date-picker";
import { FooterButtonAndroid } from "@components/footers/FooterButtonAndroid/FooterButtonAndroid";
import { AppHeader } from "@components/headers/AppHeader/AppHeader";
import { HeaderBackButton } from "@components/headers/headerSideComponents/HeaderBackButton/HeaderBackButton";
import { HeaderTextButton } from "@components/headers/headerSideComponents/HeaderTextButton/HeaderTextButton";
import { TextEntry } from "@components/inputs/TextEntry/TextEntry";
import { useSetPinWarning } from "@hooks/alerts/useSetPinWarning";
import { NewWalletStackParamList } from "@models/navigation-models";
import { NavigationProp } from "@react-navigation/native";
import {
  AppSettingsService,
  CalloutType,
  FrontendWallet,
  SharedConstants,
  validateWalletName,
} from "@react-shared";
import { ProcessNewWalletModal } from "@screens/modals/ProcessNewWalletModal/ProcessNewWalletModal";
import { ScanQRCodeModal } from "@screens/modals/ScanQRCodeModal/ScanQRCodeModal";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { InfoCallout } from "@views/components/callouts/InfoCallout/InfoCallout";
import { SelectableListItem } from "@views/components/list/SelectableListItem/SelectableListItem";
import { styles } from "./styles";

const MOCKED_MNEMONIC =
  "debate fish design eye property sunday weather clean house odor either baby";

interface ImportWalletScreenProps {
  navigation: NavigationProp<NewWalletStackParamList, "ImportWallet">;
}

export const ImportWalletScreen: React.FC<ImportWalletScreenProps> = ({
  navigation,
}) => {
  const [walletCreationDate, setWalletCreationDate] = useState(new Date());
  const [walletCreationTimestamp, setWalletCreationTimestamp] =
    useState<number>();
  const [showWalletCreationDateSelector, setShowWalletCreationDateSelector] =
    useState(false);
  const [mnemonic, setMnemonic] = useState("");
  const [walletName, setWalletName] = useState("");
  const [derivationIndex, setDerivationIndex] = useState<string>("");
  const [hasValidDerivationIndex, setHasValidDerivationIndex] = useState(false);
  const [hasValidEntries, setHasValidEntries] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showScanQRCodeModal, setShowScanQRCodeModal] = useState(false);

  const { createPinModal } = useSetPinWarning();

  const validateEntries = (walletName: string) => {
    setHasValidEntries(validateWalletName(walletName));
  };

  const updateMnemonic = (value: string) => {
    setMnemonic(value.toLowerCase());
    validateEntries(walletName);
  };

  const updateWalletName = (value: string) => {
    setWalletName(value);
    validateEntries(value);
  };

  const updateDerivationIndex = (value: string) => {
    setDerivationIndex(value);
    setHasValidDerivationIndex(!Number.isNaN(value));
  };

  const onSubmit = () => {
    triggerHaptic(HapticSurface.NavigationButton);
    setShowProcessModal(true);
  };

  const onSuccess = (wallet: FrontendWallet) => {
    setShowProcessModal(false);
    navigation.navigate("ViewingKeyCallout", {
      walletCreationType: WalletCreationType.Import,
      wallet,
    });
  };

  const onFail = () => {
    setShowProcessModal(false);
  };

  const refSecondEntry = useRef<TextInput | null>(null);

  const onTapQrCode = () => {
    triggerHaptic(HapticSurface.NavigationButton);
    setShowScanQRCodeModal(true);
  };

  const onDismissQRCodeModal = (qrCodeMnemonic?: string) => {
    if (isDefined(qrCodeMnemonic)) {
      updateMnemonic(qrCodeMnemonic);
    }
    setShowScanQRCodeModal(false);
  };

  const walletCreationDateIsSelected = isDefined(walletCreationTimestamp);

  const getCreationDateDescription = () => {
    return walletCreationDateIsSelected
      ? walletCreationDate.toLocaleDateString(AppSettingsService.locale, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "Tap to select (optional)";
  };

  return (
    <>
      <ScanQRCodeModal
        show={showScanQRCodeModal}
        onDismiss={onDismissQRCodeModal}
        mockResponse_DevOnly={MOCKED_MNEMONIC}
      />
      {createPinModal}
      <AppHeader
        title="Import Wallet"
        headerLeft={<HeaderBackButton />}
        headerRight={
          <HeaderTextButton
            text="Import"
            onPress={onSubmit}
            disabled={!hasValidEntries}
          />
        }
        isModal={false}
      />
      <View style={styles.wrapper}>
        <ProcessNewWalletModal
          show={showProcessModal}
          mnemonic={mnemonic.trim()}
          derivationIndex={
            derivationIndex.length > 0 ? Number(derivationIndex) : undefined
          }
          originalCreationTimestamp={walletCreationTimestamp}
          walletName={walletName.trim()}
          onSuccessClose={onSuccess}
          onFailClose={onFail}
          defaultProcessingText="Importing wallet..."
          successText="Imported successfully"
          isViewOnlyWallet={false}
        />
        <View style={styles.inputsWrapper}>
          <TextEntry
            viewStyles={[
              styles.walletNameInput,
              walletName && walletName.length && !hasValidEntries
                ? styles.walletInputError
                : undefined,
            ]}
            label="Wallet name"
            value={walletName}
            onChangeText={updateWalletName}
            maxLength={SharedConstants.MAX_LENGTH_WALLET_NAME}
            placeholder="Enter text"
            returnKeyType="next"
            blurOnSubmit={false}
            autoFocus
            onSubmitEditing={() => {
              refSecondEntry.current?.focus();
            }}
          />
          <View style={styles.horizontalLine} />
          <TextEntry
            viewStyles={[styles.bottomInput]}
            label="Seed phrase"
            value={mnemonic}
            onChangeText={updateMnemonic}
            autoCapitalize="none"
            multiline
            placeholder="Enter 12- or 24-word phrase"
            reference={refSecondEntry}
            iconButtons={[{ icon: "qrcode-scan", onTap: onTapQrCode }]}
          />
        </View>
        {showAdvancedOptions && (
          <>
            <View style={styles.advanceOptionsContainer}>
              <TextEntry
                viewStyles={[
                  styles.derivationContainer,
                  derivationIndex.length > 0 && !hasValidDerivationIndex
                    ? styles.walletInputError
                    : undefined,
                ]}
                label="Derivation index"
                value={derivationIndex}
                onChangeText={updateDerivationIndex}
                autoCapitalize="none"
                placeholder="Enter number (optional)"
                keyboardType="numeric"
                maxLength={3}
              />
              <Text style={styles.walletCreationDateLabel}>
                When was this wallet first created?
              </Text>
              <SelectableListItem
                onTap={() => setShowWalletCreationDateSelector(true)}
                title="Original creation date"
                rightText=""
                rightIconSource="calendar"
                titleStyle={styles.walletCreationDateTitle}
                descriptionStyle={[
                  styles.walletCreationDateDescription,
                  walletCreationDateIsSelected &&
                    styles.walletCreationDateDescriptionSelected,
                ]}
                description={getCreationDateDescription()}
                containerStyle={styles.walletCreationDateContainer}
              />
              <DatePicker
                modal
                mode="date"
                date={walletCreationDate}
                open={showWalletCreationDateSelector}
                onConfirm={(date) => {
                  setShowWalletCreationDateSelector(false);
                  setWalletCreationDate(date);
                  setWalletCreationTimestamp(date?.getTime() / 1000);
                }}
                onCancel={() => {
                  setShowWalletCreationDateSelector(false);
                }}
              />
            </View>
            {walletCreationDateIsSelected && (
              <InfoCallout
                type={CalloutType.Warning}
                style={styles.warningCallout}
                text="WARNING: Your wallet will skip any transactions before this date."
              />
            )}
          </>
        )}
        {!showAdvancedOptions && (
          <Text
            style={styles.showAdvancedOptions}
            onPress={() => setShowAdvancedOptions(true)}
          >
            Show advanced options
          </Text>
        )}
      </View>
      <FooterButtonAndroid
        buttonAction={onSubmit}
        buttonTitle="Import"
        disabled={!hasValidEntries}
      />
    </>
  );
};
