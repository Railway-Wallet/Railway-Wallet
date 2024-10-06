import React from "react";
import { Text, View, ViewStyle } from "react-native";
import { Button } from "react-native-paper";
import { styleguide } from "@react-shared";
import { isAndroid } from "@services/util/platform-os-service";
import { Icon } from "@views/components/icons/Icon";
import { styles } from "./styles";

type Props = {
  icon: string;
  title: string;
  onPress: () => void;
  additionalStyles?: ViewStyle;
};

export const ButtonWithTextAndIconVerticalIOS: React.FC<Props> = ({
  icon,
  title,
  onPress,
  additionalStyles = [],
}) => {
  if (isAndroid()) {
    return null;
  }

  return (
    <Button
      onPress={onPress}
      style={[styles.buttonView, additionalStyles]}
      textColor={styleguide.colors.white}
      contentStyle={styles.buttonContent}
    >
      <View style={styles.textIconWrapper}>
        <Text
          style={styles.buttonText}
          testID="ButtonWithTextAndIconVerticalIOS-Text-Title"
        >
          {title}
        </Text>
        <Icon source={icon} size={20} color={styleguide.colors.white} />
      </View>
    </Button>
  );
};
