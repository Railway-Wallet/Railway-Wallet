import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const CARD_PADDING = 16;

export const styles = StyleSheet.create({
  cardWrapper: {
    position: "relative",
    backgroundColor: styleguide.colors.gray5(),
    borderColor: styleguide.colors.gray4(),
    borderRadius: 4,
    borderWidth: 1,
  },
  imageDotsBackground: {
    paddingTop: 12,
  },
  backgroundOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    width: "100%",
    backgroundColor: "#00000033",
  },
});
