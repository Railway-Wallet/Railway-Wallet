import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: styleguide.colors.screenBackground,
  },
  inputsWrapper: {
    marginTop: 40,
    backgroundColor: styleguide.colors.gray6_50,
  },
  bottomInput: {
    borderColor: styleguide.colors.inputBorder,
    borderBottomWidth: 1,
  },
  walletNameInput: {
    paddingBottom: 12,
    borderColor: styleguide.colors.inputBorder,
    borderTopWidth: 1,
  },
  horizontalLine: {
    height: 1,
    width: "100%",
    marginLeft: 16,
    backgroundColor: styleguide.colors.inputBorder,
  },
  walletInputError: {
    borderBottomColor: styleguide.colors.error(),
  },
  showAdvancedOptions: {
    ...styleguide.typography.actionText,
    color: styleguide.colors.labelSecondary,
    marginTop: 20,
    textAlign: "center",
  },
});
