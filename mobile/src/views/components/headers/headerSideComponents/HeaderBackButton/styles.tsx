import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  backButtonStyle: {
    marginLeft: 10,
  },
  label: {
    ...styleguide.typography.actionText,
  },
});
