import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";
import { CARD_PADDING } from "../WalletCardSlide/styles";

export const styles = StyleSheet.create({
  slideName: {
    position: "absolute",
    width: "100%",
    top: 24,
    textAlign: "center",
    textTransform: "uppercase",
    paddingHorizontal: CARD_PADDING,
    color: styleguide.colors.text(0.84),
    ...styleguide.typography.label,
  },
});
