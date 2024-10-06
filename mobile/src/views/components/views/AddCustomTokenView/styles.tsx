import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: styleguide.colors.gray5(),
  },
  spacer: {
    height: 24,
    width: "100%",
  },
  horizontalLine: {
    height: 1,
    width: "100%",
    marginLeft: 16,
    backgroundColor: styleguide.colors.inputBorder,
  },
  submitButton: {
    marginHorizontal: 16,
  },
  errorTextWrapper: {
    marginHorizontal: 16,
  },
  errorShowMore: {
    color: styleguide.colors.textSecondary,
  },
  errorText: {
    ...styleguide.typography.label,
    color: styleguide.colors.error(),
    alignSelf: "center",
    textAlign: "center",
  },
});
