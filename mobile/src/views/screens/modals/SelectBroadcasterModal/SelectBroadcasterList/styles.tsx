import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  contentContainer: {
    paddingBottom: 16,
  },
  titleStyle: {
    ...styleguide.typography.heading4,
    color: styleguide.colors.text(),
  },
  descriptionTextStyle: {
    marginTop: 6,
    ...styleguide.typography.labelSmall,
    color: styleguide.colors.labelSecondary,
  },
  placeholder: {
    ...styleguide.typography.label,
    color: styleguide.colors.text(),
    textAlign: "center",
    margin: 18,
  },
  iconContainer: {
    paddingLeft: 8,
  },
});
