import React from "react";
import { ViewStyle } from "react-native";
import { Button } from "react-native-paper";
import { Icon } from "@views/components/icons/Icon";
import { styles } from "./styles";

type Props = {
  icon: string;
  onTap: () => void;
  size: number;
  color: string;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  disabled?: boolean;
};

export const ButtonIconOnly: React.FC<Props> = ({
  icon,
  onTap,
  size,
  color,
  style,
  contentStyle,
  disabled,
}) => {
  return (
    <Button
      onPress={onTap}
      style={[styles.button, style]}
      contentStyle={contentStyle}
      compact
      disabled={disabled}
    >
      <Icon source={icon} size={size} color={color} />
    </Button>
  );
};
