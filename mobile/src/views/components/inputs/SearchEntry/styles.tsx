import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  searchbar: {
    marginTop: 24,
    backgroundColor: styleguide.colors.gray6_50,
    marginHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  searchbarInput: {
    color: styleguide.colors.white,
    ...styleguide.typography.paragraph,
    lineHeight: 18,
    alignSelf: "center",
  },
});
