import { Dimensions } from "react-native";

export const isSmallScreen = (): boolean => {
  return Dimensions.get("screen").height < 844;
};

export const isTightWidth = (): boolean => {
  return Dimensions.get("screen").width < 376;
};
