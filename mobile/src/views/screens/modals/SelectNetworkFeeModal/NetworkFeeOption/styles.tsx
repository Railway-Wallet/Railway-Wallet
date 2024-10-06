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
    backgroundColor: styleguide.colors.gray5(),
    borderColor: styleguide.colors.txGreen(),
  },
  disabledWrapper: {
    opacity: 0.3,
  },
  listItem: {
    height: 68,
  },
  titleStyle: {
    color: styleguide.colors.text(),
    ...styleguide.typography.heading3,
  },
  descriptionStyle: {
    color: styleguide.colors.textSecondary,
    ...styleguide.typography.label,
  },
  tokenIcon: {
    width: 30,
    height: 30,
    alignSelf: "center",
    marginHorizontal: 12,
    borderRadius: 15,
  },
});
