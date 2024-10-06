import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: styleguide.colors.black,
  },
  itemRow: {
    marginTop: 24,
    marginBottom: 16,
  },
  items: {
    marginTop: 12,
    borderColor: styleguide.colors.textSecondary,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  hr: {
    backgroundColor: styleguide.colors.textSecondary,
    height: 1,
    width: "100%",
    marginLeft: 16,
  },
  placeholderText: {
    margin: 16,
    color: styleguide.colors.text(),
    ...styleguide.typography.paragraph,
  },
  bold: {
    fontWeight: "bold",
  },
  androidBottomPadding: {
    height: 56,
  },
  walletItemContainer: {
    backgroundColor: styleguide.colors.gray6_50,
  },
});
