import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: styleguide.colors.gray5(),
  },
  footerContent: {
    paddingTop: 16,
    paddingHorizontal: 32,
    paddingBottom: 36,
    alignItems: "center",
  },
  footerText: {
    ...styleguide.typography.caption,
    color: styleguide.colors.text(),
    textAlign: "center",
    marginBottom: 8,
  },
  footerTextButton: {
    ...styleguide.typography.caption,
    color: styleguide.colors.text(),
    marginBottom: 8,
    textDecorationLine: "underline",
  },
});
