import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  toastContainer: {
    width: "100%",
  },
  toastOuterContent: {
    margin: 8,
  },
  border: {
    padding: 2,
    borderRadius: 4,
  },
  toastContent: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: styleguide.colors.gray6_50,
  },
  textIconWrapper: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  textSubtextWrapper: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
    marginHorizontal: 16,
  },
  messageText: {
    color: styleguide.colors.text(),
    ...styleguide.typography.paragraph,
    lineHeight: undefined,
  },
  subtext: {
    color: styleguide.colors.labelSecondary,
    ...styleguide.typography.caption,
    marginTop: 4,
  },
});
