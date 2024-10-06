import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  input: {
    ...styleguide.typography.heading2,
    borderColor: styleguide.colors.white,
    minWidth: 160,
    borderBottomWidth: 1,
    flexShrink: 1,
    flexGrow: 1,
    textAlign: "center",
    fontSize: 28,
    color: styleguide.colors.text(),
    marginHorizontal: 12,
  },
});
