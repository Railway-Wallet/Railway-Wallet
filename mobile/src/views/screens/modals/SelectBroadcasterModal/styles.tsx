import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: styleguide.colors.black,
  },
  placeholder: {
    ...styleguide.typography.label,
    color: styleguide.colors.text(),
    marginVertical: 16,
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: styleguide.colors.gray3(),
  },
  footerText: {
    marginVertical: 16,
    textAlign: "center",
    color: styleguide.colors.text(),
  },
});
