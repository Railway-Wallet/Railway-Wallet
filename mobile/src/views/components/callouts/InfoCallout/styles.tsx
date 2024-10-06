import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  infoAlertWrapper: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  border: {
    padding: 1,
    borderRadius: 4,
  },
  content: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-start",
    backgroundColor: "black",
    borderRadius: 4,
    alignItems: "center",
  },
  icon: {
    color: styleguide.colors.text(),
  },
  text: {
    color: styleguide.colors.text(),
    ...styleguide.typography.caption,
    paddingHorizontal: 16,
  },
  textUnexpanded: {
    color: styleguide.colors.labelSecondary,
  },
  ctaButton: {
    ...styleguide.typography.caption,
    color: styleguide.colors.text(),
    textDecorationLine: "underline",
  },
  expandableBorderView: {
    display: "flex",
    flexDirection: "row",
    width: "100%",
  },
});
