import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: styleguide.colors.gray(),
  },
  content: {
    padding: 16,
  },
  sectionHeader: {
    ...styleguide.typography.caption,
    color: styleguide.colors.text(),
    marginTop: 32,
    marginLeft: 8,
  },
  sliderContainer: {
    margin: 8,
    marginTop: 24,
    paddingLeft: 8,
    paddingRight: 8,
  },
  slippageDisclaimer: {
    ...styleguide.typography.paragraphSmall,
    color: styleguide.colors.labelSecondary,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  footerContent: {
    paddingHorizontal: 32,
    paddingBottom: 32,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveButton: {
    width: "100%",
  },
});
