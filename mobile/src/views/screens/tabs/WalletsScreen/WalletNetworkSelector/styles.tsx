import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const standardStyles = StyleSheet.create({
  buttonWrapper: {
    marginRight: 16,
    borderRadius: 4,
    marginTop: 24,
    justifyContent: "center",
    alignItems: "center",
    maxWidth: 120,
  },
  buttonIcon: {
    fontSize: 24,
  },
  buttonText: {
    ...styleguide.typography.caption,
    textTransform: "none",
  },
  buttonContent: {
    flexDirection: "row-reverse",
    height: 48,
  },
  buttonStyle: {
    backgroundColor: styleguide.colors.gray6_50,
    borderColor: styleguide.colors.buttonBorder,
    borderWidth: 1,
  },
});

export const navBarStyles = StyleSheet.create({
  buttonWrapper: {
    ...standardStyles.buttonWrapper,
    marginTop: 0,
  },
  buttonIcon: {
    fontSize: 16,
  },
  buttonText: {
    ...standardStyles.buttonText,
    lineHeight: 14,
  },
  buttonContent: {
    ...standardStyles.buttonContent,
    height: 32,
  },
  buttonStyle: {
    borderColor: styleguide.colors.buttonBorder,
    borderWidth: 1,
  },
});
