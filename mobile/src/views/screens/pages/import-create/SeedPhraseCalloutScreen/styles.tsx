import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: styleguide.colors.black,
    paddingTop: 42,
  },
  textBoxWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 24,
    marginHorizontal: 16,
  },
  bottomButtons: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  bottomButton: {
    width: "100%",
  },
  bottomButtonLabel: {
    ...styleguide.typography.label,
    textTransform: "none",
  },
  textNoticeWrapper: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignSelf: "center",
  },
  textNotice: {
    marginBottom: 16,
    ...styleguide.typography.caption,
    color: styleguide.colors.labelSecondary,
    textAlign: "center",
  },
});
