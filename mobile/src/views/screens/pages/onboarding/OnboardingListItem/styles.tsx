import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  itemContainer: {
    flex: 1,
    alignItems: "center",
    padding: 24,
  },
  text: {
    marginTop: 24,
    textAlign: "center",
    flex: 1,
    width: "100%",
    ...styleguide.typography.paragraph,
    color: styleguide.colors.white,
    lineHeight: 24,
  },
  firstText: {
    ...styleguide.typography.heading3,
    lineHeight: 28,
  },
  image: {
    width: "100%",
  },
});
