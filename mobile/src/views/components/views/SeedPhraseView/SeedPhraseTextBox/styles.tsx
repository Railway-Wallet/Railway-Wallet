import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  box: {
    borderRadius: 4,
    borderColor: styleguide.colors.textSecondary,
    backgroundColor: styleguide.colors.gray6_50,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4,
  },
  text: {
    color: styleguide.colors.text(),
    ...styleguide.typography.paragraph,
  },
  blur: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 4,
  },
});
