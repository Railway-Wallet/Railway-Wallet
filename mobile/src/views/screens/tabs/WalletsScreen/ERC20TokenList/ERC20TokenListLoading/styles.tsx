import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 10,
    marginBottom: 15,
    justifyContent: "center",
  },
  spinner: {},
  text: {
    ...styleguide.typography.paragraphSmall,
    fontSize: 14,
    color: styleguide.colors.labelSecondary,
    marginLeft: 10,
  },
});
