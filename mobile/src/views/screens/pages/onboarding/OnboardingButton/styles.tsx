import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 4,
    backgroundColor: styleguide.colors.gray(),
    borderColor: styleguide.colors.buttonBorder,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  textStyle: {
    position: "absolute",
    ...styleguide.typography.button,
    color: styleguide.colors.white,
  },
  imageStyle: {
    height: 24,
    position: "absolute",
  },
});
