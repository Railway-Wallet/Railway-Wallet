import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: styleguide.colors.black,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  itemList: {
    flex: 1,
  },
  itemListContentContainer: {
    paddingTop: 4,
    paddingBottom: 30,
  },
  noTxItem: {
    textAlign: "center",
    paddingHorizontal: 16,
    paddingVertical: 32,
    color: styleguide.colors.labelSecondary,
    ...styleguide.typography.paragraph,
  },
});
5;
