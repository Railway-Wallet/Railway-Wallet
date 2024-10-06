import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: styleguide.colors.gray5(),
  },
  footerContent: {
    paddingTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 8,
    alignItems: "center",
  },
  selectedTokens: {
    color: styleguide.colors.white,
    textAlign: "center",
    ...styleguide.typography.label,
  },
  saveButton: {
    marginTop: 16,
    width: "100%",
  },
  customTokenButton: {
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: styleguide.colors.gray(),
    width: "100%",
  },
});
