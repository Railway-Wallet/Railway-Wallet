import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  buttonView: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: styleguide.colors.inputBorder,
    backgroundColor: styleguide.colors.gray6_50,
    height: 48,
  },
  buttonContent: {
    height: 46,
  },
  buttonText: {
    textTransform: "none",
    ...styleguide.typography.caption,
  },
  disabledButtonText: {
    color: styleguide.colors.textSecondary,
  },
});
