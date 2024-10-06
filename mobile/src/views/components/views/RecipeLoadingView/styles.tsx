import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  recipeLoadingViewContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    width: "100%",
  },
  errorShowMore: {
    color: styleguide.colors.textSecondary,
  },
  loadingTitle: {
    ...styleguide.typography.caption,
    textAlign: "center",
    color: styleguide.colors.text(),
    marginVertical: 24,
    marginHorizontal: 16,
  },

  errorTitle: {
    ...styleguide.typography.heading4,
    color: styleguide.colors.text(),
    marginTop: 48,
    marginBottom: 24,
    marginHorizontal: 16,
  },

  errorMessage: {
    color: styleguide.colors.danger,
    textAlign: "center",
  },

  errorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    height: "100%",
    marginHorizontal: 28,
  },

  textAndImageContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
});
