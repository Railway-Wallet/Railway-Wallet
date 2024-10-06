import React from "react";
import { Image, ImageStyle } from "react-native";
import { ImageSwirl } from "@react-shared";
import { styles } from "./styles";

type Props = {
  style?: ImageStyle;
};

export const SwirlBackground: React.FC<Props> = ({ style }) => {
  return <Image source={ImageSwirl()} style={[styles.swirl, style]} />;
};
