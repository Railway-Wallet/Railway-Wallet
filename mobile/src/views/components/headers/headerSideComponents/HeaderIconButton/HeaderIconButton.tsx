import React from "react";
import { View } from "react-native";
import { ButtonIconOnly } from "@components/buttons/ButtonIconOnly/ButtonIconOnly";
import { styleguide } from "@react-shared";
import { isAndroid } from "@services/util/platform-os-service";
import { styles } from "./styles";

interface HeaderIconButtonProps {
  icon: string;
  disabled?: boolean;
  onPress: () => void;
}

export const HeaderIconButton: React.FC<HeaderIconButtonProps> = ({
  icon,
  disabled,
  onPress,
}) => {
  if (isAndroid()) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ButtonIconOnly
        onTap={onPress}
        icon={icon}
        size={24}
        color={styleguide.colors.white}
        disabled={disabled}
      />
    </View>
  );
};
