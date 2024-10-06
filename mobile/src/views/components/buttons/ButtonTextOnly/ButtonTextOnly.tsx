import React from "react";
import { Text, TextStyle, ViewStyle } from "react-native";
import { Button } from "react-native-paper";
import { styles } from "./styles";

type Props = {
  onTap?: () => void;
  disabled?: boolean;
  title: string;
  viewStyle?: ViewStyle;
  contentStyle?: ViewStyle;
  labelStyle?: TextStyle;
  testID?: string;
};

export const ButtonTextOnly: React.FC<Props> = ({
  onTap,
  disabled = false,
  title,
  viewStyle,
  contentStyle,
  labelStyle,
  testID,
}) => {
  return (
    <Button
      onPress={onTap}
      style={[styles.button, viewStyle]}
      contentStyle={[styles.contentStyle, contentStyle]}
      compact
      disabled={disabled}
      labelStyle={[
        styles.label,
        labelStyle,
        disabled ? styles.labelDisabled : undefined,
      ]}
      testID={testID}
    >
      <Text testID="ButtonTextOnly-Text-Title">{title}</Text>
    </Button>
  );
};
