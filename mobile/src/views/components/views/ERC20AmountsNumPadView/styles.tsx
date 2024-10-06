import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";
import { isSmallScreen } from "@services/util/screen-dimensions-service";

const useSmall = isSmallScreen();

export const styles = StyleSheet.create({
  wrapper: {},
  tokenListWrapper: {
    marginTop: 24,
  },
  calculatedTokenListWrapper: {
    marginTop: 18,
  },
  tokenListBalances: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-end",
  },
  tokenListBalance: {
    marginTop: -2,
    color: styleguide.colors.text(),
    ...styleguide.typography.heading3,
  },
  currencyStyle: {
    color: styleguide.colors.labelSecondary,
    ...styleguide.typography.label,
    letterSpacing: 3,
  },
  descriptionStyle: {
    marginTop: 2,
    color: styleguide.colors.labelSecondary,
    ...styleguide.typography.label,
  },
  newTokenButton: {
    marginTop: 24,
    backgroundColor: styleguide.colors.gray6_50,
    borderColor: styleguide.colors.inputBorder,
  },
  bottomButtons: {
    marginTop: useSmall ? 8 : 26,
    flexDirection: "row",
    justifyContent: "center",
  },
  bottomButton: {
    marginHorizontal: 24,
  },
  bottomButtonLabel: {
    ...styleguide.typography.label,
    textTransform: "none",
  },
  approveButton: {
    marginHorizontal: 16,
  },
  calculatedContainer: {
    position: "absolute",
    top: -8,
    left: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 50,
    borderColor: styleguide.colors.gray5(),
    borderWidth: 2,
    borderStyle: "solid",
    backgroundColor: styleguide.colors.gray6(),
    height: 32,
    width: 32,
  },
  errorText: {
    ...styleguide.typography.label,
    marginTop: 12,
    color: styleguide.colors.error(),
    marginLeft: 24,
  },
  tokenBalanceWithFeesText: {
    ...styleguide.typography.caption,
    color: styleguide.colors.labelSecondary,
  },
  checkboxContainer: {
    gap: 12,
    marginHorizontal: 12,
    marginTop: 24,
  },
  disclaimerContainer: {
    marginLeft: 12,
  },
});
