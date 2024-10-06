import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  footerView: {
    marginBottom: 10,
    gap: 5,
    borderBottomWidth: 1,
    borderBottomColor: styleguide.colors.buttonBorder,
    paddingBottom: 10,
  },
  submitButtonText: {
    ...styleguide.typography.label,
    textTransform: "none",
  },
});
