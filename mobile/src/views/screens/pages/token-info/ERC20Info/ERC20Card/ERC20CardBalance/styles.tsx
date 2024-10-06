import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";
import { CARD_PADDING } from "@screens/pages/import-create/NewWalletSuccess/NewWalletCard/styles";

export const styles = StyleSheet.create({
  wrapper: {
    marginTop: 16,
  },
  balanceWrapper: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "baseline",
    paddingHorizontal: 16,
  },
  tokenIcon: {
    width: 24,
    height: 24,
    alignSelf: "center",
    borderRadius: 15,
  },
  balanceText: {
    ...styleguide.typography.label,
    textAlign: "center",
    marginHorizontal: CARD_PADDING,
    color: styleguide.colors.text(),
    alignSelf: "center",
  },
  priceWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "baseline",
    paddingHorizontal: 16,
  },
  priceText: {
    ...styleguide.typography.labelSmall,
    color: styleguide.colors.lighterLabelSecondary,
  },
});
