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
  listItemCenter: {
    maxWidth: "100%",
  },
  extraItemsTopPadding: {
    paddingTop: 2,
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
  continueButton: {
    marginTop: 16,
    marginHorizontal: 8,
  },
  sectionHeader: {
    color: styleguide.colors.text(),
    ...styleguide.typography.paragraph,
    marginHorizontal: 16,
    marginTop: 16,
  },
  listItemTitle: {
    color: styleguide.colors.labelSecondary,
  },
});
