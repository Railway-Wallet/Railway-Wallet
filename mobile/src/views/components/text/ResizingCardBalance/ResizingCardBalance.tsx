import { isDefined } from "@railgun-community/shared-models";
import React from "react";
import { Text } from "react-native";
import {
  AppSettingsService,
  formatNumberToLocaleWithMinDecimals,
  useReduxSelector,
} from "@react-shared";
import { styles } from "./styles";

type Props = {
  hasWallet: boolean;
  totalBalanceCurrency?: number;
};

export const ResizingCardBalance: React.FC<Props> = ({
  hasWallet,
  totalBalanceCurrency,
}) => {
  const { discreetMode } = useReduxSelector("discreetMode");
  let totalBalancePriceLabel = "N/A";
  if (isDefined(totalBalanceCurrency)) {
    if (totalBalanceCurrency > 0 && totalBalanceCurrency < 0.01) {
      totalBalancePriceLabel = formatNumberToLocaleWithMinDecimals(0, 2);
    } else {
      totalBalancePriceLabel = formatNumberToLocaleWithMinDecimals(
        totalBalanceCurrency,
        2
      );
    }
  }
  if (discreetMode.enabled) {
    totalBalancePriceLabel = "***";
  }

  return (
    <>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[styles.balanceText, !hasWallet ? styles.balanceNoWallet : null]}
      >
        {isDefined(totalBalanceCurrency) && (
          <Text
            style={[
              styles.balanceCurrency,
              !hasWallet ? styles.balanceCurrencyNoWallet : null,
            ]}
          >
            {AppSettingsService.currency.symbol}
          </Text>
        )}
        {totalBalancePriceLabel}
      </Text>
    </>
  );
};
