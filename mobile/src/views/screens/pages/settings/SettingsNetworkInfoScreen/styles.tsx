import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: styleguide.colors.black,
  },
  itemRow: {
    marginTop: 24,
    marginBottom: 8,
  },
  items: {
    marginTop: 12,
    borderColor: styleguide.colors.textSecondary,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    backgroundColor: styleguide.colors.gray6_50,
  },
  extraItemsTopPadding: {
    paddingTop: 2,
  },
  hr: {
    backgroundColor: styleguide.colors.textSecondary,
    height: 1,
    width: "100%",
    marginLeft: 16,
  },
  placeholderText: {
    margin: 16,
    color: styleguide.colors.labelSecondary,
    ...styleguide.typography.paragraph,
  },
  listRightView: {
    flexDirection: "column",
    marginVertical: 10,
    maxWidth: 140,
  },
  listRightViewText: {
    color: styleguide.colors.labelSecondary,
    ...styleguide.typography.paragraph,
    textAlign: "right",
  },
  listRightViewSubtext: {
    color: styleguide.colors.textSecondary,
    ...styleguide.typography.caption,
    textAlign: "right",
  },
  listItemCenter: {
    maxWidth: "100%",
  },
  listItemTitle: {
    color: styleguide.colors.labelSecondary,
  },
});
