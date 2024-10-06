import { isDefined } from "@railgun-community/shared-models";
import React from "react";
import { Text, View } from "react-native";
import { TokenListRow } from "@components/list/TokenListRow/TokenListRow";
import { LoadingSwirl } from "@components/loading/LoadingSwirl/LoadingSwirl";
import {
  AppSettingsService,
  CURRENCY_ARS,
  CURRENCY_AUD,
  CURRENCY_CAD,
  ERC20TokenBalance,
  formatNumberToLocaleWithMinDecimals,
  getDecimalBalance,
  getTokenDisplayNameShort,
  tokenPriceUndefinedLabel,
  truncateStr,
  useReduxSelector,
} from "@react-shared";
import { isAndroid } from "@services/util/platform-os-service";
import { isSmallScreen } from "@services/util/screen-dimensions-service";
import { styles } from "./styles";

type Props = {
  tokenBalance: ERC20TokenBalance;
  onSelect: () => void;
  hasPendingBalance: boolean;
};

export const ERC20TokenListRow: React.FC<Props> = ({
  tokenBalance,
  onSelect,
  hasPendingBalance,
}) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");
  const { discreetMode } = useReduxSelector("discreetMode");

  const { token, balance, balanceCurrency, priceCurrency } = tokenBalance;
  const appCurrency = AppSettingsService.currency;

  const formatBalanceCurrency = () => {
    if (!isDefined(balanceCurrency)) {
      return tokenPriceUndefinedLabel(network.current);
    }
    if (balanceCurrency > 0 && balanceCurrency < 0.01) {
      return (
        <>
          <Text style={styles.titleCurrencyStyle}>{appCurrency.symbol}</Text>
          {"<" + formatNumberToLocaleWithMinDecimals(0.01, 2)}
        </>
      );
    }

    return (
      <>
        <Text style={styles.titleCurrencyStyle}>{appCurrency.symbol}</Text>
        {formatNumberToLocaleWithMinDecimals(balanceCurrency, 2)}
      </>
    );
  };

  const discreetBalanceCurrency = (
    <>
      <Text style={styles.titleCurrencyStyle}>{appCurrency.symbol}</Text>
      {"***"}
    </>
  );

  const rightBalances = () => {
    const hasBalance = isDefined(balance);

    if (!hasBalance) {
      return <LoadingSwirl />;
    }

    const balanceDecimal = getDecimalBalance(balance, token.decimals);
    const adjustsFontSizeToFit = isAndroid() ? false : true;

    const balanceText = hasBalance
      ? balanceDecimal > 0 && balanceDecimal < 0.0001
        ? "<" + formatNumberToLocaleWithMinDecimals(0.0001, 4)
        : formatNumberToLocaleWithMinDecimals(balanceDecimal, 4)
      : undefined;

    const balanceCurrency = formatBalanceCurrency();

    return (
      <View style={styles.rightBalances}>
        <Text
          style={styles.titleStyle}
          numberOfLines={1}
          adjustsFontSizeToFit={adjustsFontSizeToFit}
        >
          {discreetMode.enabled ? discreetBalanceCurrency : balanceCurrency}
          {hasPendingBalance ? "*" : ""}
        </Text>
        <Text
          style={styles.descriptionStyle}
          numberOfLines={1}
          adjustsFontSizeToFit={adjustsFontSizeToFit}
        >
          {discreetMode.enabled ? "***" : truncateStr(balanceText, 12)}
        </Text>
      </View>
    );
  };

  const tokenDisplayName = getTokenDisplayNameShort(
    token,
    wallets.available,
    network.current.name
  );

  const shouldBeMultilineDescription =
    isSmallScreen() &&
    isAndroid() &&
    (appCurrency.symbol === CURRENCY_CAD.symbol ||
      appCurrency.symbol === CURRENCY_ARS.symbol ||
      appCurrency.symbol === CURRENCY_AUD.symbol);

  const singleLineDescription = isDefined(priceCurrency)
    ? `${tokenDisplayName} • ${
        appCurrency.symbol
      }${formatNumberToLocaleWithMinDecimals(priceCurrency, 5)}`
    : `${tokenDisplayName}${tokenPriceUndefinedLabel(
        network.current,
        "• N/A"
      )}`;

  const multilineDescription = (
    <Text style={styles.leftDescription} numberOfLines={2}>
      {tokenDisplayName}
      <Text style={styles.secondLineLeftDescription}>
        {isDefined(priceCurrency)
          ? `\n${appCurrency.symbol}${formatNumberToLocaleWithMinDecimals(
              priceCurrency,
              5
            )}`
          : `${tokenPriceUndefinedLabel(network.current, "N/A")}`}
      </Text>
    </Text>
  );

  return (
    <TokenListRow
      token={token}
      description={
        shouldBeMultilineDescription
          ? multilineDescription
          : singleLineDescription
      }
      rightView={rightBalances}
      onSelect={onSelect}
      disabled={false}
    />
  );
};
