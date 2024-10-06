import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    shadowColor: styleguide.colors.black,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    elevation: 3,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  optionalFooterBackground: {
    backgroundColor: styleguide.colors.gray5(0.8),
  },
});
