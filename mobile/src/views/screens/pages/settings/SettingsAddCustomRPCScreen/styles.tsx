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
  rpcInput: {
    borderColor: styleguide.colors.inputBorder,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  rpcInputError: {
    borderBottomColor: styleguide.colors.error(),
  },
});
