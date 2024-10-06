import React, { useState } from "react";
import { Text } from "react-native";
import { styles } from "./styles";

type Props = {
  title: string;
  onPress?: () => void;
};

export const TabHeaderText: React.FC<Props> = ({ title, onPress }) => {
  const [hoverTitle, setHoverTitle] = useState(false);

  return (
    <Text
      style={Object.assign({}, styles.text, hoverTitle ? styles.hovered : {})}
      onPress={onPress}
      onPressIn={() => setHoverTitle(true)}
      onPressOut={() => setHoverTitle(false)}
    >
      {title}
    </Text>
  );
};
