import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  text: {
    color: styleguide.colors.text(),
    ...styleguide.typography.heading1,
    marginHorizontal: 16,
    marginTop: 16,
  },
  hovered: {
    color: styleguide.colors.textSecondary,
  },
});
