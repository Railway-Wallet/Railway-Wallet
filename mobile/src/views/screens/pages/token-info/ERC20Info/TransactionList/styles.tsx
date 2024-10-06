import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  transactionList: {},
  placeholder: {
    margin: 4,
    marginTop: 0,
  },
  placeholderText: {
    ...styleguide.typography.paragraphSmall,
    color: styleguide.colors.labelSecondary,
  },
});
