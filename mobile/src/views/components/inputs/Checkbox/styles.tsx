import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    backgroundColor: styleguide.colors.gray6(),
    borderWidth: 2,
    borderColor: styleguide.colors.gray5(),
    borderRadius: 2,
    height: 24,
    width: 24,
    alignContent: "center",
    justifyContent: "center",
  },
  label: {
    marginLeft: 12,
    ...styleguide.typography.labelSmall,
    color: styleguide.colors.white,
  },
  iconContainer: {
    marginLeft: 1,
  },
});
