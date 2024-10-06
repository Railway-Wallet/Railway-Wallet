import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  processingWrapper: {
    flex: 1,
    backgroundColor: styleguide.colors.screenBackground,
  },
  successWrapper: {
    flex: 1,
    backgroundColor: "green",
  },
  failWrapper: {
    flex: 1,
    backgroundColor: "red",
  },
});
