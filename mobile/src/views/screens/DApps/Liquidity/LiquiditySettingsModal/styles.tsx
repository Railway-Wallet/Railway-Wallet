import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: styleguide.colors.gray(),
  },
  footerContent: {
    paddingHorizontal: 32,
    paddingBottom: 32,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveButton: {
    width: "100%",
  },
});
