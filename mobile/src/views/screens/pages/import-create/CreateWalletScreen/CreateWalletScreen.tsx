import React, { useState } from "react";
import { View } from "react-native";
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

interface CreateWalletScreenProps {
  navigation: NavigationProp<NewWalletStackParamList, "CreateWallet">;
}

export const CreateWalletScreen: React.FC<CreateWalletScreenProps> = ({
  navigation,
}) => {
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [hasValidEntries, setHasValidEntries] = useState(false);
  const [walletName, setWalletName] = useState("");

  const { createPinModal } = useSetPinWarning();

  const onSubmit = () => {
    triggerHaptic(HapticSurface.NavigationButton);
    setShowProcessModal(true);
  };

  const onSuccess = (wallet: FrontendWallet) => {
    setShowProcessModal(false);
    navigation.navigate("SeedPhraseCallout", {
      wallet,
    });
  };

  const onFail = () => {
    setShowProcessModal(false);
  };

  const validateEntries = (value: string) => {
    setHasValidEntries(validateWalletName(value));
  };

  const updateWalletName = (value: string) => {
    setWalletName(value);
    validateEntries(value);
  };

  return (
    <>
      {createPinModal}
      <AppHeader
        title="New Wallet"
        headerLeft={<HeaderBackButton />}
        headerRight={
          <HeaderTextButton
            text="Create"
            onPress={onSubmit}
            disabled={!hasValidEntries}
          />
        }
        isModal={false}
      />
      <View style={styles.wrapper}>
        <ProcessNewWalletModal
          show={showProcessModal}
          walletName={walletName}
          onSuccessClose={onSuccess}
          onFailClose={onFail}
          defaultProcessingText="Generating new wallet..."
          successText="Created successfully"
          isViewOnlyWallet={false}
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
            autoFocus
          />
        </View>
      </View>
      <FooterButtonAndroid
        buttonAction={onSubmit}
        buttonTitle="Create"
        disabled={!hasValidEntries}
      />
    </>
  );
};
