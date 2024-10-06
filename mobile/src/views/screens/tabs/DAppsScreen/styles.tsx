import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: styleguide.colors.black,
  },
  scrollView: {
    height: "100%",
  },
  titleRow: {
    alignContent: "flex-start",
    marginTop: 12,
  },
  errorTextWrapper: {
    marginTop: 24,
    padding: 16,
  },
  errorText: {
    ...styleguide.typography.caption,
    color: styleguide.colors.textSecondary,
  },
  listHeaderStyle: {
    marginBottom: 16,
  },
  tokenListContentContainer: {
    paddingBottom: 30,
  },
  placeholder: {
    margin: 4,
    marginTop: 0,
  },
  placeholderText: {
    ...styleguide.typography.paragraphSmall,
    color: styleguide.colors.labelSecondary,
  },
});
