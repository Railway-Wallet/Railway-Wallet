import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import Spinner from "react-native-spinkit";
import { styleguide } from "@react-shared";

export type Props = {
  size: number;
  style?: StyleProp<ViewStyle>;
};

export const SpinnerCubes: React.FC<Props> = ({ size, style }) => {
  return (
    <Spinner
      size={size}
      style={style}
      type="WanderingCubes"
      color={styleguide.colors.lighterLabelSecondary}
    />
  );
};
