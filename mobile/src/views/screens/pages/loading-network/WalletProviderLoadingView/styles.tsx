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
  errorShowMore: {
    marginTop: 12,
    color: styleguide.colors.textSecondary,
  },
  errorText: {
    ...styleguide.typography.paragraph,
    color: styleguide.colors.text(),
    marginBottom: 32,
  },
  loadingText: {
    ...styleguide.typography.caption,
    color: styleguide.colors.text(),
    textAlign: "center",
    paddingHorizontal: 16,
  },
  disclaimerText: {
    ...styleguide.typography.caption,
    color: styleguide.colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 16,
    marginTop: 12,
  },
  progressBarWrapper: {
    marginTop: 24,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  progressBar: {},
  retryContainer: {
    marginBottom: 16,
  },
  button: {
    marginLeft: 8,
    marginRight: 8,
  },
});
