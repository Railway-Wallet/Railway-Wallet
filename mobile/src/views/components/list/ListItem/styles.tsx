import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  listItemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 8,
    marginVertical: 6,
  },
  leftViewContainer: {
    marginRight: 8,
    justifyContent: "center",
  },
  centerAndRightViewContainer: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
  },
  centerViewContainer: {
    flexShrink: 1,
    maxWidth: "75%",
    minWidth: "40%",
    paddingLeft: 8,
  },
  rightViewContainer: {
    justifyContent: "center",
    flexShrink: 1,
    marginLeft: 8,
  },
  defaultTitleStyle: {
    color: styleguide.colors.text(),
    ...styleguide.typography.heading4,
    lineHeight: 18,
  },
  defaultDescriptionStyle: {
    marginTop: 4,
    color: styleguide.colors.textSecondary,
    ...styleguide.typography.caption,
  },
});
