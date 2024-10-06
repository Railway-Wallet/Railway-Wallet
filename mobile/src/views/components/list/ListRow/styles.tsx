import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  rowWrapper: {
    marginTop: 8,
    backgroundColor: styleguide.colors.gray6_50,
    borderRadius: 4,
    borderWidth: 1,
  },
  selectedWrapper: {
    backgroundColor: styleguide.colors.gray6(0.8),
    borderColor: styleguide.colors.txGreen(),
  },
  disabledWrapper: {
    opacity: 0.64,
  },
  errorBorder: {
    borderColor: styleguide.colors.txRed(),
  },
  titleStyle: {
    color: styleguide.colors.text(),
    ...styleguide.typography.heading4,
    lineHeight: 18,
  },
  descriptionStyle: {
    marginTop: 4,
    color: styleguide.colors.textSecondary,
    ...styleguide.typography.label,
  },
});
