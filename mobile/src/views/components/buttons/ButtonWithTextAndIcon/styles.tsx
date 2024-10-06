import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  buttonView: {
    borderRadius: 4,
    borderColor: styleguide.colors.buttonBorder,
    borderWidth: 1,
    backgroundColor: styleguide.colors.gray6(0.5),
    height: 48,
    minWidth: 108,
  },
  buttonContent: {
    height: 46,
    flexDirection: "row-reverse",
  },
  buttonIcon: {
    fontSize: 20,
  },
  buttonText: {
    textTransform: "none",
    ...styleguide.typography.caption,
  },
  disabledButtonText: {
    color: styleguide.colors.textSecondary,
  },
  disabledButtonIcon: {
    color: styleguide.colors.textSecondary,
  },
});
