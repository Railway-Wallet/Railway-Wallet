import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: styleguide.colors.black,
  },
  scrollView: {
    height: "100%",
    backgroundColor: styleguide.colors.black,
  },
  titleRow: {
    alignContent: "flex-start",
    marginTop: 12,
  },
});
