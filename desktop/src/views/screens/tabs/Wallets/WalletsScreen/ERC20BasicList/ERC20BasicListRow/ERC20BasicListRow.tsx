import { isDefined } from '@railgun-community/shared-models';
import React from 'react';
import { Spinner } from '@components/loading/Spinner/Spinner';
import { Text } from '@components/Text/Text';
import { ERC20ListRow } from '@components/TokenListRow/ERC20ListRow/ERC20ListRow';
import {
  AppSettingsService,
  ERC20TokenBalance,
  formatNumberToLocaleWithMinDecimals,
  getDecimalBalance,
  getTokenDisplayNameShort,
  tokenPriceUndefinedLabel,
  truncateStr,
  useReduxSelector,
} from '@react-shared';
import styles from './ERC20BasicListRow.module.scss';

type Props = {
  tokenBalance: ERC20TokenBalance;
  hideBalance?: boolean;
  onSelect: () => void;
  hasPendingBalance: boolean;
};

export const ERC20BasicListRow: React.FC<Props> = ({
  tokenBalance,
  hideBalance = false,
  hasPendingBalance,
  onSelect,
}) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const { discreetMode } = useReduxSelector('discreetMode');

  const { token, balance, balanceCurrency, priceCurrency } = tokenBalance;
  const appCurrency = AppSettingsService.currency;

  const formatBalanceCurrency = () => {
    if (!isDefined(balanceCurrency)) {
      const undefinedLabel = tokenPriceUndefinedLabel(network.current);
      return undefinedLabel;
    }
    if (balanceCurrency > 0 && balanceCurrency < 0.01) {
      return (
        <>
          <span className={styles.titleCurrencyStyle}>
            {appCurrency.symbol}
          </span>
          {'<' + formatNumberToLocaleWithMinDecimals(0.01, 2)}
        </>
      );
    }

    return (
      <>
        <span className={styles.titleCurrencyStyle}>{appCurrency.symbol}</span>
        {formatNumberToLocaleWithMinDecimals(balanceCurrency, 2)}
      </>
    );
  };

  const discreetBalanceCurrency = (
    <>
      <span className={styles.titleCurrencyStyle}>{appCurrency.symbol}</span>
      {'***'}
    </>
  );

  const rightBalances = () => {
    const hasBalance = isDefined(balance);

    if (!hasBalance || hideBalance) {
      return (
        <div className={styles.spinnerContainer}>
          <Spinner size={22} />
        </div>
      );
    }

    const balanceDecimal = getDecimalBalance(balance, token.decimals);

    const balanceText = hasBalance
      ? balanceDecimal > 0 && balanceDecimal < 0.0001
        ? '<' + formatNumberToLocaleWithMinDecimals(0.0001, 4)
        : formatNumberToLocaleWithMinDecimals(balanceDecimal, 4)
      : undefined;

    const balanceCurrency = formatBalanceCurrency();

    return (
      <div className={styles.rightBalances}>
        {balanceCurrency === '' ? (
          <Spinner size={22} />
        ) : (
          <Text className={styles.titleStyle}>
            {discreetMode.enabled ? discreetBalanceCurrency : balanceCurrency}
            {hasPendingBalance ? '*' : ''}
          </Text>
        )}
        <Text className={styles.descriptionStyle}>
          {discreetMode.enabled ? '***' : truncateStr(balanceText, 12)}
        </Text>
      </div>
    );
  };

  const description = isDefined(priceCurrency)
    ? `${getTokenDisplayNameShort(
        token,
        wallets.available,
        network.current.name,
      )} • ${appCurrency.symbol}${formatNumberToLocaleWithMinDecimals(
        priceCurrency,
        5,
      )}`
    : `${getTokenDisplayNameShort(
        token,
        wallets.available,
        network.current.name,
      )} • ${tokenPriceUndefinedLabel(network.current, 'N/A')}`;

  return (
    <ERC20ListRow
      token={token}
      description={description}
      descriptionClassName={styles.descriptionStyle}
      rightView={rightBalances}
      onSelect={onSelect}
    />
  );
};
