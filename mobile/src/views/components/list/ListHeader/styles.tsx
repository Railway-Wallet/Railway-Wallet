import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  headerWrapper: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 36,
    marginBottom: 12,
  },
  headerTextWrapper: {
    paddingLeft: 8,
    flexDirection: "row",
  },
  headerText: {
    textTransform: "uppercase",
    color: styleguide.colors.text(),
    ...styleguide.typography.label,
  },
  headerIcon: {
    paddingLeft: 12,
    paddingTop: 2,
  },
});
