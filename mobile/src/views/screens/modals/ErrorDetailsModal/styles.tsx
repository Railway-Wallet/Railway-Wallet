import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: styleguide.colors.black,
    padding: 16,
    paddingTop: 64,
  },
  versionsText: {
    ...styleguide.typography.label,
    color: styleguide.colors.text(),
    marginBottom: 20,
  },
  errorMessage: {
    ...styleguide.typography.labelSmall,
    color: styleguide.colors.text(),
    textAlign: "left",
    width: "100%",
  },
  causedBy: {
    ...styleguide.typography.labelSmall,
    color: styleguide.colors.textSecondary,
    textAlign: "left",
    width: "100%",
    marginBottom: 8,
  },
  errorContainer: {
    backgroundColor: styleguide.colors.gray5(),
    borderRadius: 4,
    marginBottom: 16,
    padding: 16,
    gap: 12,
    alignItems: "flex-end",
  },
});
