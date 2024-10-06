import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  headerStyle: {
    backgroundColor: styleguide.colors.black,
    shadowColor: "transparent",
  },
  hoveredTitle: {
    color: styleguide.colors.textSecondary,
  },
  title: {
    ...styleguide.typography.heading4,
    color: styleguide.colors.text(),
    textAlign: "center",
  },
  description: {},
  headerButtonPadding: {
    paddingHorizontal: 8,
  },
});
