import React, { useState } from "react";
import { Modal, View } from "react-native";
import { WideButtonTextOnly } from "@components/buttons/WideButtonTextOnly/WideButtonTextOnly";
import { SafeGrayFooter } from "@components/footers/SafeGrayFooter/SafeGrayFooter";
import { AppHeader } from "@components/headers/AppHeader/AppHeader";
import { HeaderBackButton } from "@components/headers/headerSideComponents/HeaderBackButton/HeaderBackButton";
import { styleguide } from "@react-shared";
import { SlippageSelector } from "@views/components/selectors/SlippageSelector/SlippageSelector";
import { styles } from "./styles";

export type SwapSettings = {
  slippagePercentage: number;
};

type Props = {
  show: boolean;
  isRailgun: boolean;
  currentSettings: SwapSettings;
  onDismiss: (settings?: SwapSettings) => void;
};

export const SwapSettingsModal: React.FC<Props> = ({
  show,
  isRailgun,
  currentSettings,
  onDismiss,
}) => {
  const [slippagePercentage, setSlippagePercentage] = useState(
    currentSettings.slippagePercentage
  );

  const saveSettings = () => {
    onDismiss({
      slippagePercentage,
    });
  };

  const slippageDisclaimer = isRailgun
    ? "Warning: Low slippage buffers may cause your swap to fail. We recommend 3-5% for private swaps, which increases the likelihood of success. Private transactions incur gas fees and RAILGUN shielding/unshielding fees, even if the underlying swap fails."
    : "Warning: Low slippage may cause your swap to fail. We recommend 0.5-1.0% for public swaps, which increases the likelihood of success.";

  return (
    <Modal animationType="slide" presentationStyle="formSheet" visible={show}>
      <AppHeader
        title="Swap settings"
        headerStatusBarHeight={16}
        backgroundColor={styleguide.colors.gray5()}
        headerLeft={<HeaderBackButton customAction={onDismiss} />}
        isModal={true}
      />
      <View style={styles.wrapper}>
        <SlippageSelector
          slippagePercentage={slippagePercentage}
          slippageDisclaimer={slippageDisclaimer}
          setSlippagePercentage={setSlippagePercentage}
        />
      </View>
      <SafeGrayFooter>
        <View style={styles.footerContent}>
          <WideButtonTextOnly
            title="Save settings"
            onPress={saveSettings}
            additionalStyles={styles.saveButton}
          />
        </View>
      </SafeGrayFooter>
    </Modal>
  );
};
