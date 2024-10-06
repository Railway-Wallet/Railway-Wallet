import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  reviewSection: {
    borderRadius: 4,
    backgroundColor: styleguide.colors.gray6(),
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 4,
    margin: 12,
    marginTop: 20,
    borderColor: styleguide.colors.gray4(),
    borderWidth: 1,
  },
  walletNameIconWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    marginLeft: 2,
  },
  walletNameText: {
    ...styleguide.typography.caption,
    color: styleguide.colors.labelSecondary,
    marginLeft: 8,
  },
  tokenRowWithFee: {
    marginBottom: 4,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  tokenRow: {
    marginBottom: 14,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  tokenText: {
    ...styleguide.typography.heading3,
    paddingLeft: 12,
    paddingRight: 20,
    letterSpacing: -0.2,
  },
  cancelTransactionText: {
    ...styleguide.typography.caption,
    color: styleguide.colors.text(),
  },
  cancelOriginalFeeText: {
    marginTop: 12,
    ...styleguide.typography.caption,
    color: styleguide.colors.text(),
  },
  cancelTransactionID: {
    color: styleguide.colors.labelSecondary,
    marginTop: 4,
  },
  includedFeeRow: {
    paddingLeft: 40,
    flexDirection: "row",
    alignItems: "center",
  },
  includedFeeText: {
    ...styleguide.typography.labelSmall,
    paddingRight: 20,
  },
  swapPriceUpdatedContainer: {
    paddingLeft: 40,
    paddingRight: 20,
    paddingBottom: 12,
  },
  swapPriceUpdatedButton: {
    ...styleguide.typography.caption,
    color: styleguide.colors.error(),
  },
  setSwapDestinationAddressButton: {
    ...styleguide.typography.caption,
    color: styleguide.colors.text(),
    marginBottom: 12,
  },
  includedFeeTokenAmount: {
    color: styleguide.colors.textSecondary,
  },
  tokenAmount: {
    color: styleguide.colors.text(),
  },
  tokenSymbol: {
    ...styleguide.typography.heading4,
    color: styleguide.colors.labelSecondary,
  },
  erc20AmountsWrapper: {
    marginVertical: 4,
  },
  arrowIconWrapper: {
    marginTop: 4,
    marginBottom: 20,
  },
  recipeFeeWrapper: {
    marginBottom: 14,
  },
  vaultTextWrapper: {
    paddingLeft: 40,
    marginBottom: 16,
  },
  vaultExchangeRateText: {
    ...styleguide.typography.labelSmall,
    color: styleguide.colors.labelSecondary,
  },
  vaultApyText: {
    ...styleguide.typography.labelSmall,
    color: styleguide.colors.textSecondary,
  },
  recipeFeeTextWrapper: {
    paddingLeft: 40,
    ...styleguide.typography.caption,
    color: styleguide.colors.textSecondary,
    marginBottom: 2,
  },
  sectionItemTitle: {
    ...styleguide.typography.caption,
    color: styleguide.colors.labelSecondary,
    marginTop: 6,
  },
  recipeFeeAmount: {
    ...styleguide.typography.caption,
    color: styleguide.colors.textSecondary,
  },
  slippageSelectorTitle: {
    ...styleguide.typography.caption,
    color: styleguide.colors.text(),
  },
  tokenIcon: {
    width: 32,
    height: 32,
    alignSelf: "center",
    borderRadius: 15,
  },
});
