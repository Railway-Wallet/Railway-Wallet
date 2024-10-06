import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";
import { isAndroid } from "@services/util/platform-os-service";

export const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 8,
    paddingLeft: 16,
    paddingRight: 0,
    paddingBottom: isAndroid() ? 0 : 12,
    width: "100%",
  },
  topWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  icons: {
    marginRight: 4,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  label: {
    color: styleguide.colors.labelSecondary,
    ...styleguide.typography.paragraph,
  },
  labelIcon: {
    marginTop: 0,
    paddingLeft: 10,
  },
  textInput: {
    ...styleguide.typography.paragraph,
    color: styleguide.colors.text(),
    lineHeight: isAndroid() ? 24 : 0,
    marginRight: 16,
    marginTop: isAndroid() ? 0 : 2,
    marginLeft: isAndroid() ? -4 : 0,
  },
  textInputWithIcon: {
    marginTop: 0,
  },
  textInputTopPadding: {
    paddingTop: 2,
  },
});
