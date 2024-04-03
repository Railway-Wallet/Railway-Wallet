import {
  isDefined,
  RailgunWalletBalanceBucket,
} from '@railgun-community/shared-models';
import React from 'react';
import { TokenIcon } from '@components/Image/TokenIcon';
import { Text } from '@components/Text/Text';
import {
  AppSettingsService,
  ERC20Token,
  formatNumberToLocaleWithMinDecimals,
  getTokenDisplayNameShort,
  useERC20DecimalBalances,
  useReduxSelector,
} from '@react-shared';
import styles from './ERC20CardBalance.module.scss';

type Props = {
  isRailgun: boolean;
  token: ERC20Token;
  tokenPrice: Optional<number>;
  balanceBucketFilter: RailgunWalletBalanceBucket[];
};

export const ERC20CardBalance: React.FC<Props> = ({
  token,
  tokenPrice,
  isRailgun,
  balanceBucketFilter,
}) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');

  const { erc20Balance, erc20BalanceCurrency } = useERC20DecimalBalances(
    token,
    isRailgun,
    balanceBucketFilter,
  );

  const appCurrency = AppSettingsService.currency;

  return (
    <>
      <Text
        className={styles.balanceCurrencyContainer}
        fontWeight={800}
        fontSize={64}
      >
        <span className={styles.currencySymbol}>{appCurrency.symbol}</span>
        {isDefined(erc20BalanceCurrency)
          ? formatNumberToLocaleWithMinDecimals(erc20BalanceCurrency, 2)
          : 'N/A'}
      </Text>
      <div className={styles.balanceContainer}>
        <TokenIcon token={token} className={styles.tokenIcon} />
        <Text className={styles.balanceText}>
          {formatNumberToLocaleWithMinDecimals(erc20Balance, 20)}{' '}
          {getTokenDisplayNameShort(
            token,
            wallets.available,
            network.current.name,
          )}
        </Text>
      </div>
      <div className={styles.priceContainer}>
        {isDefined(tokenPrice) ? (
          <Text className={styles.priceText}>
            {`${appCurrency.symbol}${formatNumberToLocaleWithMinDecimals(
              tokenPrice,
              6,
            )} per token`}
          </Text>
        ) : null}
      </div>
    </>
  );
};
