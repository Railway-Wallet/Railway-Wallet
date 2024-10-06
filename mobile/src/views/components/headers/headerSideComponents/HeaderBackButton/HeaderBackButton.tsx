import { isDefined } from "@railgun-community/shared-models";
import React from "react";
import { HeaderBackButton as NativeHeaderBackButton } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { styleguide } from "@react-shared";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { isAndroid } from "@services/util/platform-os-service";
import { styles } from "./styles";

interface HeaderBackButtonProps {
  label?: string;
  customAction?: (() => void) | undefined;
  showOnAndroid?: boolean;
}

export const HeaderBackButton: React.FC<HeaderBackButtonProps> = ({
  label,
  customAction,
  showOnAndroid = false,
}) => {
  const navigation = useNavigation();

  if (isAndroid() && !showOnAndroid) {
    return null;
  }

  const onPress = () => {
    triggerHaptic(HapticSurface.BackButton);
    customAction ? customAction() : navigation.goBack();
  };

  return (
    <NativeHeaderBackButton
      tintColor={styleguide.colors.text()}
      style={styles.backButtonStyle}
      onPress={onPress}
      label={label}
      labelVisible={isDefined(label)}
      labelStyle={styles.label}
      testID="HeaderBackButton-NativeHeaderBackButton"
    />
  );
};
