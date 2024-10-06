import React from "react";
import { Text, TouchableHighlight, View } from "react-native";
import { BlurView } from "@react-native-community/blur";
import { isAndroid } from "@services/util/platform-os-service";
import { styles } from "./styles";

type Props = {
  text: string;
  onTap?: () => void;
  blur?: boolean;
};

export const SeedPhraseTextBox: React.FC<Props> = ({
  text,
  onTap,
  blur = false,
}) => {
  return (
    <TouchableHighlight onPress={onTap}>
      <View style={styles.box}>
        <Text style={styles.text}>{text}</Text>
        {blur && !isAndroid() && (
          <BlurView style={styles.blur} blurAmount={6} />
        )}
      </View>
    </TouchableHighlight>
  );
};
