import React from "react";
import { StyleProp, Text, ViewStyle } from "react-native";
import { Button } from "react-native-paper";
import { styleguide } from "@react-shared";
import { styles } from "./styles";

type Props = {
  icon: string;
  title: string;
  onPress: () => void;
  overrideHeight?: number;
  additionalStyles?: Optional<StyleProp<ViewStyle>>;
  disabled?: boolean;
};

export const ButtonWithTextAndIcon: React.FC<Props> = ({
  icon,
  title,
  onPress,
  overrideHeight,
  additionalStyles = [],
  disabled = false,
}) => {
  const height: number = overrideHeight ?? 48;

  return (
    <Button
      onPress={onPress}
      icon={icon}
      style={[styles.buttonView, { height }, additionalStyles]}
      textColor={styleguide.colors.white}
      contentStyle={[styles.buttonContent, { height: height - 2 }]}
      labelStyle={[
        styles.buttonIcon,
        disabled ? styles.disabledButtonIcon : undefined,
      ]}
      disabled={disabled}
    >
      <Text
        style={[
          styles.buttonText,
          disabled ? styles.disabledButtonText : undefined,
        ]}
        testID="ButtonWithTextAndIcon-Text-Title"
      >
        {title}
      </Text>
    </Button>
  );
};
