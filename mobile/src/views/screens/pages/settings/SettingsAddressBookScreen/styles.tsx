import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: styleguide.colors.black,
    paddingTop: 24,
  },
  items: {
    marginTop: 12,
    borderColor: styleguide.colors.textSecondary,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    backgroundColor: styleguide.colors.gray6_50,
  },
  placeholderText: {
    margin: 16,
    color: styleguide.colors.text(),
    ...styleguide.typography.paragraph,
  },
  hr: {
    backgroundColor: styleguide.colors.textSecondary,
    height: 1,
    width: "100%",
    marginLeft: 16,
  },
});
