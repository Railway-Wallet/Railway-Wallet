import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  animationContainer: {
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    width: 80,
    height: 30,
    backgroundColor: styleguide.colors.gray(),
    position: "absolute",
    borderColor: styleguide.colors.gray4(),
    borderWidth: 1,
  },
  pointer: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: styleguide.colors.gray4(),
    transform: [{ rotate: "180deg" }],
    top: 24,
    left: 12,
    position: "absolute",
  },
  text: {
    ...styleguide.typography.caption,
    color: styleguide.colors.text(),
  },
});
