import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
  },
  text: {
    color: styleguide.colors.text(),
    ...styleguide.typography.label,
    textTransform: "uppercase",
  },
});
