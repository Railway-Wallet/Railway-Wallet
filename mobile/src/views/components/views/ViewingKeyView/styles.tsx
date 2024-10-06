import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  textBoxWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 24,
    marginHorizontal: 26,
  },
  showViewingKeyText: {
    ...styleguide.typography.actionText,
    color: styleguide.colors.labelSecondary,
    marginTop: 12,
    marginBottom: 20,
    textAlign: "center",
  },
  bottomButtons: {
    marginTop: 5,
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  button: {
    justifyContent: "center",
    backgroundColor: styleguide.colors.gray(),
    borderColor: styleguide.colors.buttonBorder,
    borderWidth: 1,
    marginLeft: 8,
  },
  text: {
    color: styleguide.colors.text(),
    ...styleguide.typography.paragraphSmall,
    fontSize: 14,
  },
});
