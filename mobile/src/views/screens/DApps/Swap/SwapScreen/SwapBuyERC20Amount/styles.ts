import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";
import { isAndroid } from "@services/util/platform-os-service";

export const styles = StyleSheet.create({
  wrapper: {},
  sectionHeaderTitle: {
    ...styleguide.typography.heading4,
  },
  sectionHeaderRightText: {
    ...styleguide.typography.labelSmall,
    color: styleguide.colors.lighterLabelSecondary,
    marginTop: 16,
    paddingRight: 8,
    textAlign: "right",
    height: 16,
  },
  selectTokenButton: {
    marginLeft: 8,
    minWidth: 128,
  },
  bottomButtonLabel: {
    ...styleguide.typography.label,
    textTransform: "none",
  },
  inputInsetButton: {
    justifyContent: "center",
    height: 32,
  },
  feeDisclaimerContainer: {
    paddingTop: 16,
    paddingLeft: 12,
    paddingRight: 12,
  },
  feeDisclaimer: {
    ...styleguide.typography.caption,
    lineHeight: 15,
    color: styleguide.colors.textSecondary,
    fontSize: 13,
  },
  buttonTextOnlyContent: {
    height: isAndroid() ? 48 : 48,
    paddingHorizontal: 4,
    width: 48,
    borderRadius: 4,
    borderColor: styleguide.colors.buttonBorder,
    borderWidth: 1,
    backgroundColor: styleguide.colors.gray6(0.5),
  },
});
