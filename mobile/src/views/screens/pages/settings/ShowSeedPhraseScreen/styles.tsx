import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: styleguide.colors.black,
    paddingTop: 42,
  },
  textNoticeWrapper: {
    paddingHorizontal: 32,
    paddingVertical: 24,
    alignSelf: "center",
  },
  textNotice: {
    marginBottom: 16,
    ...styleguide.typography.caption,
    color: styleguide.colors.labelSecondary,
    textAlign: "center",
  },
});
