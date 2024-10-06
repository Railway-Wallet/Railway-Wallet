import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  rowWrapper: {
    backgroundColor: styleguide.colors.gray6(),
    borderColor: styleguide.colors.inputBorder,
    paddingVertical: 4,
  },
  showTopBorder: {
    borderTopWidth: 1,
  },
  showBottomBorder: {
    borderBottomWidth: 1,
  },
  listItem: {
    paddingVertical: 6,
  },
  rightView: {
    width: "100%",
    alignItems: "flex-end",
  },
  titleIcon: {
    paddingTop: 1,
    paddingLeft: 6,
  },
  titleStyle: {
    color: styleguide.colors.text(),
    ...styleguide.typography.paragraph,
  },
  leftDescriptionStyle: {
    color: styleguide.colors.textSecondary,
    ...styleguide.typography.caption,
  },
  rightWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  rightTextWrapper: {
    alignItems: "flex-end",
    paddingRight: 12,
    maxWidth: 200,
  },
  rightText: {
    color: styleguide.colors.labelSecondary,
    ...styleguide.typography.paragraph,
    textAlign: "right",
    lineHeight: 20,
  },
  rightSubtext: {
    color: styleguide.colors.textSecondary,
    ...styleguide.typography.caption,
    textAlign: "right",
    marginTop: 4,
  },
  headerTextWrapper: {
    flexDirection: "row",
  },
  headerIcon: {
    paddingLeft: 10,
    paddingTop: 5,
  },
});
