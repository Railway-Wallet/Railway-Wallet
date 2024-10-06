import { isDefined } from "@railgun-community/shared-models";
import React from "react";
import { Modal, View } from "react-native";
import { AppHeader } from "@components/headers/AppHeader/AppHeader";
import { HeaderTextButton } from "@components/headers/headerSideComponents/HeaderTextButton/HeaderTextButton";
import { QRCodeCardView } from "@components/views/QRCodeCardView/QRCodeCardView";
import { CalloutType, styleguide } from "@react-shared";
import { styles } from "./styles";

type Props = {
  show: boolean;
  mnemonic: Optional<string>;
  onDismiss: () => void;
};

export const ShowSeedPhraseQRCodeModal: React.FC<Props> = ({
  show,
  mnemonic,
  onDismiss,
}) => {
  if (!isDefined(mnemonic)) {
    return null;
  }

  return (
    <Modal
      animationType="slide"
      presentationStyle="formSheet"
      visible={show}
      onRequestClose={onDismiss}
    >
      <View style={styles.wrapper}>
        <AppHeader
          title="QR Code Seed Phrase"
          headerStatusBarHeight={16}
          backgroundColor={styleguide.colors.gray5()}
          headerLeft={<HeaderTextButton text="Done" onPress={onDismiss} />}
          isModal={true}
        />
        <QRCodeCardView
          title="Scannable Seed Phrase"
          infoCalloutText="This QR Code contains your seed phrase, which can be used to access your wallet and control your funds. Keep it secret. Keep it safe."
          infoCalloutType={CalloutType.Warning}
          addressOrMnemonic={mnemonic}
          infoCalloutBorderColor={styleguide.colors.danger}
          infoCalloutGradientColors={
            styleguide.colors.gradients.redCallout.colors
          }
        />
      </View>
    </Modal>
  );
};
