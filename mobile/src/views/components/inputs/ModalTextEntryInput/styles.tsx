import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  inputsWrapper: {
    backgroundColor: styleguide.colors.gray6_50,
  },
  topBorder: {
    borderColor: styleguide.colors.inputBorder,
    borderTopWidth: 1,
  },
  bottomBorder: {
    borderColor: styleguide.colors.inputBorder,
    borderBottomWidth: 1,
  },
  inputInvalid: {
    borderColor: styleguide.colors.txRed(),
  },
});
