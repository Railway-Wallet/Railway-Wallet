import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: styleguide.colors.black,
  },

  swirlBackground: {
    left: 0,
    top: 36,
  },
  textWrapper: {
    flexDirection: "column",
    justifyContent: "center",
    padding: 24,
    top: "30%",
  },
  errorText: {
    ...styleguide.typography.paragraph,
    color: styleguide.colors.text(),
    marginBottom: 32,
  },
  errorShowMore: {
    color: styleguide.colors.textSecondary,
  },
  loadingText: {
    ...styleguide.typography.caption,
    color: styleguide.colors.text(),
    textAlign: "center",
    paddingHorizontal: 16,
  },
  buttonContainer: {
    marginBottom: 16,
  },
  footerText: {
    position: "absolute",
    color: styleguide.colors.labelSecondary,
    ...styleguide.typography.caption,
    bottom: 46,
    alignSelf: "center",
  },
});
