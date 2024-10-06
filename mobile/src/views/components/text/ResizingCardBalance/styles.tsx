import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";
import { CARD_PADDING } from "@screens/tabs/WalletsScreen/WalletCardSlides/WalletCardSlide/styles";

export const styles = StyleSheet.create({
  balanceText: {
    textAlign: "center",
    marginTop: 48,
    marginHorizontal: CARD_PADDING,
    paddingHorizontal: 16,
    color: styleguide.colors.text(),
    ...styleguide.typography.heading1,
  },
  balanceNoWallet: {
    color: styleguide.colors.labelSecondary,
  },
  balanceCurrency: {
    color: styleguide.colors.labelSecondary,
    ...styleguide.typography.heading2,
  },
  balanceCurrencyNoWallet: {
    color: styleguide.colors.lighterLabelSecondary,
  },
});
