import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  rowWrapper: {
    borderRadius: 4,
    backgroundColor: styleguide.colors.gray6_50,
  },
  listItem: {
    paddingVertical: 4,
  },
  titleIcon: {
    paddingTop: 1,
    paddingLeft: 8,
  },
  titleContainerStyle: {
    flexDirection: "row",
  },
  titleStyle: {
    color: styleguide.colors.text(),
    ...styleguide.typography.paragraph,
  },
  dangerStyle: {
    color: styleguide.colors.danger,
  },
  descriptionStyle: {
    color: styleguide.colors.labelSecondary,
    ...styleguide.typography.caption,
    paddingRight: 16,
  },
  rightIconWrapper: {
    alignSelf: "center",
  },
});
