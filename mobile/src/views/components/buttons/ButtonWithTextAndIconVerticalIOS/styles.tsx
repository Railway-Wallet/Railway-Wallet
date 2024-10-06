import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const HEIGHT_BUTTON_TEXT_ICON_VERTICAL = 48;

export const styles = StyleSheet.create({
  buttonView: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: styleguide.colors.buttonBorder,
    backgroundColor: styleguide.colors.gray6(0.5),
    height: HEIGHT_BUTTON_TEXT_ICON_VERTICAL,
  },
  buttonContent: {
    height: HEIGHT_BUTTON_TEXT_ICON_VERTICAL,
  },
  textIconWrapper: {
    alignItems: "center",
  },
  buttonText: {
    ...styleguide.typography.label,
    color: styleguide.colors.text(),
    alignSelf: "center",
  },
});
