import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    paddingBottom: 96,
  },
  infoCallout: {},
  warningInfoCallout: {
    marginTop: 8,
  },
  networkFeeWrapper: {
    marginTop: 12,
  },
  advancedOptionsWrapper: {
    marginTop: 16,
  },
  textFieldWrapper: {
    marginTop: 8,
  },
  bottomButtonWrapper: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  bottomButtonDivider: {
    height: 8,
  },
  bottomButtonProofExpirationText: {
    ...styleguide.typography.label,
    color: styleguide.colors.text(),
    alignSelf: "center",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  bottomBroadcasterName: {
    ...styleguide.typography.label,
    color: styleguide.colors.text(),
    alignSelf: "center",
    textAlign: "center",
  },
  broadcasterOverrideContainer: {
    marginBottom: 12,
  },
  errorText: {
    ...styleguide.typography.label,
    color: styleguide.colors.error(),
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 24,
    alignSelf: "center",
    textAlign: "left",
    flexWrap: "wrap",
  },
  errorShowMore: {
    color: styleguide.colors.textSecondary,
  },
  gasEstimateRetryButton: {
    ...styleguide.typography.caption,
    color: styleguide.colors.textSecondary,
    marginLeft: 24,
    marginRight: 24,
    marginTop: 12,
    marginBottom: 4,
    textAlign: "center",
  },
  broadcasterFeeWarning: {
    ...styleguide.typography.caption,
    color: styleguide.colors.error(),
    paddingLeft: 6,
    paddingTop: 6,
    fontSize: 15,
  },
  advancedOptionsButtonWrapper: {
    display: "flex",
    width: "100%",
    alignItems: "flex-end",
  },
  advancedOptionsButton: {
    ...styleguide.typography.caption,
    color: styleguide.colors.lighterLabelSecondary,
    marginTop: 12,
    marginRight: 8,
  },
  textEntryField: {
    backgroundColor: styleguide.colors.gray(),
    borderColor: styleguide.colors.inputBorder,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  gasEstimateProgressBarWrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 10,
    paddingBottom: 6,
  },
  gasEstimateProgressBar: {},
  gasEstimateProgressLabel: {
    color: styleguide.colors.textSecondary,
    ...styleguide.typography.label,
    marginBottom: 12,
    width: "100%",
    textAlign: "right",
  },
  settingsItem: {
    borderColor: styleguide.colors.textSecondary,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    backgroundColor: styleguide.colors.gray6_50,
  },
  disclaimerText: {
    ...styleguide.typography.labelSmall,
    color: styleguide.colors.labelSecondary,
    alignSelf: "flex-end",
    marginTop: 12,
  },
  selectSignerTypeButton: {
    marginTop: 18,
  },
});
