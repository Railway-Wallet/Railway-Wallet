import {
  isDefined,
  WalletCreationType,
} from "@railgun-community/shared-models";
import React, { useRef, useState } from "react";
import { TextInput, View } from "react-native";
import { FooterButtonAndroid } from "@components/footers/FooterButtonAndroid/FooterButtonAndroid";
import { AppHeader } from "@components/headers/AppHeader/AppHeader";
import { HeaderBackButton } from "@components/headers/headerSideComponents/HeaderBackButton/HeaderBackButton";
import { HeaderTextButton } from "@components/headers/headerSideComponents/HeaderTextButton/HeaderTextButton";
import { TextEntry } from "@components/inputs/TextEntry/TextEntry";
import { useSetPinWarning } from "@hooks/alerts/useSetPinWarning";
import { NewWalletStackParamList } from "@models/navigation-models";
import { NavigationProp } from "@react-navigation/native";
import {
  FrontendWallet,
  SharedConstants,
  validateWalletName,
} from "@react-shared";
import { ProcessNewWalletModal } from "@screens/modals/ProcessNewWalletModal/ProcessNewWalletModal";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { styles } from "./styles";

interface AddViewOnlyWalletScreenProps {
  navigation: NavigationProp<NewWalletStackParamList, "AddViewOnlyWallet">;
}

export const AddViewOnlyWalletScreen: React.FC<
  AddViewOnlyWalletScreenProps
> = ({ navigation }) => {
  const [walletName, setWalletName] = useState("");
  const [shareablePrivateKey, setShareablePrivateKey] = useState("");
  const [hasValidEntries, setHasValidEntries] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);

  const { createPinModal } = useSetPinWarning();

  const validateEntries = () => {
    setHasValidEntries(
      validateWalletName(walletName) && isDefined(shareablePrivateKey)
    );
  };

  const updateWalletName = (value: string) => {
    setWalletName(value);
    validateEntries();
  };

  const updateShareablePrivateKey = (value: string) => {
    setShareablePrivateKey(value.toLowerCase());
    validateEntries();
  };

  const onSubmit = () => {
    triggerHaptic(HapticSurface.NavigationButton);
    setShowProcessModal(true);
  };

  const onSuccess = (wallet: FrontendWallet) => {
    setShowProcessModal(false);
    navigation.navigate("NewWalletSuccess", {
      walletCreationType: WalletCreationType.AddViewOnly,
      wallet,
    });
  };

  const onFail = () => {
    setShowProcessModal(false);
  };

  const refSecondEntry = useRef<TextInput | null>(null);

  return (
    <>
      {createPinModal}
      <AppHeader
        title="Add View-Only Wallet"
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
          walletName={walletName.trim()}
          onSuccessClose={onSuccess}
          onFailClose={onFail}
          defaultProcessingText="Adding view-only wallet..."
          successText="Added successfully"
          isViewOnlyWallet={true}
          shareableViewingKey={shareablePrivateKey}
        />
        <View style={styles.inputsWrapper}>
          <TextEntry
            viewStyles={[
              styles.walletNameInput,
              walletName && walletName !== "" && !hasValidEntries
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
            label="View-only private key"
            value={shareablePrivateKey}
            onChangeText={updateShareablePrivateKey}
            autoCapitalize="none"
            multiline
            placeholder="Enter key"
            reference={refSecondEntry}
          />
        </View>
      </View>
      <FooterButtonAndroid
        buttonAction={onSubmit}
        buttonTitle="Import"
        disabled={!hasValidEntries}
      />
    </>
  );
};
