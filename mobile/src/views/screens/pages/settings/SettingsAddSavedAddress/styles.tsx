import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: styleguide.colors.screenBackground,
  },
  errorText: {
    color: styleguide.colors.error(),
    ...styleguide.typography.paragraph,
  },
  placeholderText: {
    margin: 16,
    marginBottom: 0,
    color: styleguide.colors.text(),
    ...styleguide.typography.paragraph,
  },
  inputsWrapper: {
    marginTop: 40,
    backgroundColor: styleguide.colors.gray6_50,
  },
  bottomInput: {
    borderColor: styleguide.colors.inputBorder,
    borderBottomWidth: 1,
  },
  nameInput: {
    borderColor: styleguide.colors.inputBorder,
    borderTopWidth: 1,
  },
  horizontalLine: {
    height: 1,
    width: "100%",
    marginLeft: 16,
    backgroundColor: styleguide.colors.inputBorder,
  },
  errorInput: {
    borderBottomColor: styleguide.colors.error(),
  },
});
