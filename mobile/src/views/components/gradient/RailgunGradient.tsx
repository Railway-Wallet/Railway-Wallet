import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { styleguide } from "@react-shared";

export type GradientStyle = {
  colors: string[];
  start: {
    x: number;
    y: number;
  };
  end: {
    x: number;
    y: number;
  };
  locations: number[];
  useAngle: boolean;
  angle: number;
  angleCenter: {
    x: number;
    y: number;
  };
};

type Props = {
  style: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  gradient?: GradientStyle;
};

export const RailgunGradient: React.FC<Props> = ({
  style,
  children,
  gradient = styleguide.colors.gradients.railgun,
}) => {
  return (
    <LinearGradient
      style={style}
      colors={gradient.colors}
      start={gradient.start}
      end={gradient.end}
      locations={gradient.locations}
      useAngle={gradient.useAngle}
      angleCenter={gradient.angleCenter}
      angle={gradient.angle}
    >
      {children}
    </LinearGradient>
  );
};
