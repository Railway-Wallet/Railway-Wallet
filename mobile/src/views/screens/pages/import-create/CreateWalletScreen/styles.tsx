import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: styleguide.colors.screenBackground,
  },
  logosWrapper: {
    marginTop: 40,
  },
  bottomText: {
    ...styleguide.typography.paragraph,
    color: styleguide.colors.text(),
  },
  inputsWrapper: {
    marginTop: 40,
    backgroundColor: styleguide.colors.gray6_50,
  },
  walletNameInput: {
    borderColor: styleguide.colors.inputBorder,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  walletInputError: {
    borderBottomColor: styleguide.colors.error(),
  },
});
