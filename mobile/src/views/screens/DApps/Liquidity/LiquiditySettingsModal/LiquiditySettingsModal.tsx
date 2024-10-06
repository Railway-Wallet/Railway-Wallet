import React, { Dispatch, SetStateAction, useState } from "react";
import { Modal, View } from "react-native";
import { WideButtonTextOnly } from "@components/buttons/WideButtonTextOnly/WideButtonTextOnly";
import { SafeGrayFooter } from "@components/footers/SafeGrayFooter/SafeGrayFooter";
import { AppHeader } from "@components/headers/AppHeader/AppHeader";
import { HeaderBackButton } from "@components/headers/headerSideComponents/HeaderBackButton/HeaderBackButton";
import { styleguide } from "@react-shared";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { SlippageSelector } from "@views/components/selectors/SlippageSelector/SlippageSelector";
import { styles } from "./styles";

type Props = {
  show: boolean;
  initialSlippagePercentage: number;
  setFinalSlippagePercentage: (
    slippage: number
  ) => void | Dispatch<SetStateAction<number>>;
  onClose: () => void;
};

export const LiquiditySettingsModal: React.FC<Props> = ({
  show,
  initialSlippagePercentage,
  setFinalSlippagePercentage,
  onClose,
}) => {
  const [slippagePercentage, setSlippagePercentage] = useState(
    initialSlippagePercentage
  );

  const saveSettings = () => {
    setFinalSlippagePercentage(slippagePercentage);
    triggerHaptic(HapticSurface.EditSuccess);
    onClose();
  };

  const slippageDisclaimer =
    "Warning: Low slippage buffers may cause this action to fail. We recommend 3-5% which increases the likelihood of success. Private transactions incur gas fees and RAILGUN shielding/unshielding fees, even if the underlying action fails.";

  return (
    <Modal animationType="slide" presentationStyle="formSheet" visible={show}>
      <AppHeader
        title="Liquidity settings"
        headerStatusBarHeight={16}
        backgroundColor={styleguide.colors.gray5()}
        headerLeft={<HeaderBackButton customAction={onClose} />}
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
