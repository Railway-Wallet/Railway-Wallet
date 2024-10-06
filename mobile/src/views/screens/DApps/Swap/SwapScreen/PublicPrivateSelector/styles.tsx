import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  buttonWrapper: {
    marginRight: 16,
    borderRadius: 4,
    marginTop: 0,
    justifyContent: "center",
    alignItems: "center",
    maxWidth: 120,
  },
  buttonText: {
    ...styleguide.typography.caption,
    textTransform: "none",
    lineHeight: 14,
  },
  buttonContent: {
    height: 32,
    width: "100%",
  },
  buttonStyle: {
    backgroundColor: styleguide.colors.black,
    borderColor: styleguide.colors.buttonBorder,
    borderWidth: 1,
  },
  gradientBorder: {
    padding: 1,
    borderRadius: 4,
  },
});
