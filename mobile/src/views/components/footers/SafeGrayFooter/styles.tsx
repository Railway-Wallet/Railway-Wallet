import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  footer: {
    shadowColor: styleguide.colors.black,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    elevation: 3,
    backgroundColor: styleguide.colors.gray6(),
  },
});
