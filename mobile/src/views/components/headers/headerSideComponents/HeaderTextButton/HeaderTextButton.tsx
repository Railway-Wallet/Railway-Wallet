import React from "react";
import { Button, View } from "react-native";
import { isAndroid } from "@services/util/platform-os-service";
import { styles } from "./styles";

interface HeaderTextButtonProps {
  text: string;
  disabled?: boolean;
  onPress: () => void;
  tintColor?: string;
}

export const HeaderTextButton: React.FC<HeaderTextButtonProps> = ({
  text,
  disabled,
  onPress,
  tintColor,
}) => {
  if (isAndroid()) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Button
        title={text}
        onPress={onPress}
        disabled={disabled}
        color={tintColor}
      />
    </View>
  );
};
