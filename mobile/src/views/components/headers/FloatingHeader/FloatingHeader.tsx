import React from "react";
import { View } from "react-native";
import { AppHeader, AppHeaderProps } from "../AppHeader/AppHeader";
import { styles } from "./styles";

type FloatingHeaderProps = AppHeaderProps & {
  opacity: number;
};

export const FloatingHeader: React.FC<FloatingHeaderProps> = ({
  opacity,
  ...props
}) => {
  const isActive = opacity > 0.1;

  return (
    <View
      style={{
        ...styles.container,
        opacity,
      }}
      pointerEvents={isActive ? "auto" : "none"}
      testID="FloatingHeader-RootView"
    >
      <AppHeader {...props} />
    </View>
  );
};
