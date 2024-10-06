import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: styleguide.colors.gray5(),
  },
  listWrapper: {
    padding: 16,
  },
  listHeader: {
    ...styleguide.typography.label,
    color: styleguide.colors.labelSecondary,
    marginTop: 12,
    marginBottom: 6,
  },
  rightText: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-end",
  },
  rightTitle: {
    color: styleguide.colors.text(),
    ...styleguide.typography.heading4,
  },
  rightDescription: {
    color: styleguide.colors.textSecondary,
    ...styleguide.typography.label,
  },
});
