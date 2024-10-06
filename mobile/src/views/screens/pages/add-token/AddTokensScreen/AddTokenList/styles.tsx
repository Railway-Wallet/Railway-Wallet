import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  listHeader: {
    ...styleguide.typography.label,
    color: styleguide.colors.labelSecondary,
    marginTop: 24,
    marginHorizontal: 18,
  },
  tokenListContentContainer: {
    paddingBottom: 30,
  },
  tokenList: {
    marginTop: 4,
    marginHorizontal: 16,
  },
  addedContainer: {
    justifyContent: "center",
    alignItems: "flex-end",
    marginRight: 8,
  },
  addedText: {
    color: styleguide.colors.white,
    ...styleguide.typography.caption,
  },
});
