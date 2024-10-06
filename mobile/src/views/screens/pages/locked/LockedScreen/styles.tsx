import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: styleguide.colors.gray(),
    padding: 16,
    paddingTop: 84,
    alignItems: "center",
  },
  swirlBackground: {
    left: -10,
    top: "46%",
  },
  unlockButton: {
    margin: 48,
    width: "100%",
    position: "absolute",
    bottom: 24,
  },
});
