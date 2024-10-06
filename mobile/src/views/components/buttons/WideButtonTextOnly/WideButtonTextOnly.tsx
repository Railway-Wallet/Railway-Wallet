import React from "react";
import { Text, ViewStyle } from "react-native";
import { Button } from "react-native-paper";
import { styleguide } from "@react-shared";
import { styles } from "./styles";

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  additionalStyles?: ViewStyle;
};

export const WideButtonTextOnly: React.FC<Props> = ({
  title,
  onPress,
  disabled = false,
  additionalStyles,
}) => {
  return (
    <Button
      onPress={onPress}
      style={[styles.buttonView, additionalStyles]}
      textColor={styleguide.colors.white}
      contentStyle={styles.buttonContent}
      disabled={disabled}
    >
      <Text
        style={[
          styles.buttonText,
          disabled ? styles.disabledButtonText : undefined,
        ]}
        testID="WideButtonTextOnly-Text-Title"
      >
        {title}
      </Text>
    </Button>
  );
};
