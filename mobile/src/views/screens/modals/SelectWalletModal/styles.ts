import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: styleguide.colors.gray5(),
    padding: 16,
  },
  footer: {
    width: "100%",
  },
  footerContent: {
    paddingHorizontal: 32,
    paddingBottom: 32,
    paddingVertical: 12,
    alignItems: "center",
  },
  footerText: {
    ...styleguide.typography.caption,
    color: styleguide.colors.white,
    textAlign: "center",
  },
  footerTextButtonWrapper: {
    marginTop: 4,
    display: "flex",
    justifyContent: "center",
  },
  footerTextButton: {},
});
