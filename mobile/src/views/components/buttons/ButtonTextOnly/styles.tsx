import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  button: {
    backgroundColor: styleguide.colors.gray6(0.5),
    height: 44,
    borderColor: styleguide.colors.buttonBorder,
    borderWidth: 1,
  },
  contentStyle: {
    height: 44,
    paddingHorizontal: 8,
  },
  label: {
    ...styleguide.typography.button,
    color: styleguide.colors.white,
  },
  labelDisabled: {
    color: styleguide.colors.textSecondary,
  },
});
