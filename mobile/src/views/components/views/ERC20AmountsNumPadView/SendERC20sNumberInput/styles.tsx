import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";
import { isAndroid } from "@services/util/platform-os-service";

export const styles = StyleSheet.create({
  wrapper: {
    marginTop: 24,
    marginHorizontal: 4,
  },
  titleWrapper: {
    borderColor: styleguide.colors.textSecondary,
    borderBottomWidth: 1,
    marginHorizontal: 12,
    flexShrink: 1,
    flexGrow: 1,
  },
  focusedBorder: {
    borderColor: styleguide.colors.white,
  },
  title: {
    ...styleguide.typography.heading2,
    color: styleguide.colors.text(),
    alignSelf: "center",
    textAlign: "center",
  },
  placeholderTitle: {
    color: styleguide.colors.textSecondary,
  },
  placeholderTitleFocused: {
    color: styleguide.colors.labelSecondary,
  },
  balanceTextWrapper: {
    paddingHorizontal: 12,
    minHeight: 24,
  },
  balanceText: {
    ...styleguide.typography.labelSmall,
    color: styleguide.colors.lighterLabelSecondary,
    alignSelf: "center",
    textAlign: "center",
    paddingTop: 10,
    width: "100%",
  },
  errorTextWrapper: {
    marginTop: 6,
    paddingHorizontal: 12,
    height: 26,
  },
  errorText: {
    ...styleguide.typography.label,
    color: styleguide.colors.error(),
    alignSelf: "center",
    textAlign: "center",
    paddingTop: 2,
    width: "100%",
  },
  errorTitleBorder: {
    borderColor: styleguide.colors.error(),
  },
  errorShowMore: {
    color: styleguide.colors.textSecondary,
  },
  buttonTextOnlyContent: {
    height: isAndroid() ? 48 : 48,
  },
});
