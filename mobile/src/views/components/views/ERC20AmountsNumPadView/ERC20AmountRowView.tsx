import { isDefined } from "@railgun-community/shared-models";
import React from "react";
import { Text, View } from "react-native";
import { TokenListRow } from "@components/list/TokenListRow/TokenListRow";
import {
  AppSettingsService,
  ERC20Amount,
  formatNumberToLocaleWithMinDecimals,
  formatUnitFromHexStringToLocale,
  getDecimalBalanceCurrency,
  getTokenDisplayNameShort,
  localDecimalSymbol,
  styleguide,
  tokenAddressForPrices,
  tokenPriceUndefinedLabel,
  useReduxSelector,
} from "@react-shared";
import { Icon } from "@views/components/icons/Icon";
import { styles } from "./styles";

type Props = {
  tokenAmount: ERC20Amount;
  onSelectTokenAmount?: () => void;
  isCalculated?: boolean;
  errorText?: string;
  error?: boolean;
};

export const DECIMAL_SYMBOL = localDecimalSymbol();

export const ERC20AmountRowView: React.FC<Props> = ({
  tokenAmount,
  onSelectTokenAmount,
  isCalculated,
  errorText,
  error,
}) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");
  const { networkPrices } = useReduxSelector("networkPrices");
  const currency = AppSettingsService.currency;

  const token = tokenAmount.token;
  const tokenPrices =
    networkPrices.forNetwork[network.current.name]?.forCurrency[currency.code];
  const tokenAddressPrice = tokenAddressForPrices(token);
  const tokenPrice = tokenPrices?.[tokenAddressPrice];

  const tokenPriceText = (): string => {
    if (isDefined(tokenPrice)) {
      const decimalBalanceCurrency = getDecimalBalanceCurrency(
        BigInt(tokenAmount.amountString),
        tokenPrice,
        tokenAmount.token.decimals
      );
      if (decimalBalanceCurrency > 0 && decimalBalanceCurrency < 0.01) {
        return "<" + formatNumberToLocaleWithMinDecimals(0.01, 2);
      } else {
        return formatNumberToLocaleWithMinDecimals(decimalBalanceCurrency, 2);
      }
    }
    return tokenPriceUndefinedLabel(network.current);
  };

  const rightView = () => {
    return (
      <View style={styles.tokenListBalances}>
        <Text
          style={styles.tokenListBalance}
          adjustsFontSizeToFit
          numberOfLines={1}
        >
          {formatUnitFromHexStringToLocale(
            tokenAmount.amountString,
            tokenAmount.token.decimals
          )}
        </Text>
        <Text
          adjustsFontSizeToFit
          numberOfLines={1}
          style={styles.descriptionStyle}
        >
          {isDefined(tokenPrices) && (
            <Text style={styles.currencyStyle}>{currency.symbol}</Text>
          )}
          {tokenPriceText()}
        </Text>
      </View>
    );
  };

  const showError = (isDefined(error) && error) || isDefined(errorText);

  return (
    <View>
      <TokenListRow
        token={token}
        description={getTokenDisplayNameShort(
          token,
          wallets.available,
          network.current.name
        )}
        onSelect={onSelectTokenAmount}
        rightView={rightView}
        error={showError}
        disabled={isCalculated ?? false}
      />
      {isDefined(isCalculated) && (
        <View style={styles.calculatedContainer}>
          <Icon
            source={"calculator"}
            size={22}
            color={styleguide.colors.labelSecondary}
          />
        </View>
      )}
      {isDefined(errorText) && (
        <Text style={styles.errorText}>{errorText}</Text>
      )}
    </View>
  );
};
