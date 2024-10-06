import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  balanceText: {
    textAlign: "center",
    marginTop: 16,
    paddingHorizontal: 16,
    color: styleguide.colors.labelSecondary,
    ...styleguide.typography.label,
  },
  balanceCTA: {
    textDecorationLine: "underline",
  },
});
