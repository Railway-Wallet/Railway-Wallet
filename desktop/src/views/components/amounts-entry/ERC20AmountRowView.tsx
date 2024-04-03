import { isDefined } from '@railgun-community/shared-models';
import React, { useState } from 'react';
import { Text } from '@components/Text/Text';
import { ERC20ListRow } from '@components/TokenListRow/ERC20ListRow/ERC20ListRow';
import {
  AppSettingsService,
  ERC20Amount,
  formatNumberToLocaleWithMinDecimals,
  formatUnitFromHexStringToLocale,
  getDecimalBalanceCurrency,
  getTokenDisplayName,
  localDecimalSymbol,
  styleguide,
  tokenAddressForPrices,
  tokenPriceUndefinedLabel,
  useReduxSelector,
} from '@react-shared';
import { IconType, renderIcon } from '@services/util/icon-service';
import { ErrorDetailsModal } from '@views/screens/modals/ErrorDetailsModal/ErrorDetailsModal';
import styles from './AmountsEntry.module.scss';

type Props = {
  tokenAmount: ERC20Amount;
  index?: number;
  onSelectERC20Amount?: () => void;
  isCalculated?: boolean;
  error?: Error;
};

export const DECIMAL_SYMBOL = localDecimalSymbol();

export const ERC20AmountRowView: React.FC<Props> = ({
  tokenAmount,
  index,
  isCalculated,
  error,
  onSelectERC20Amount,
}) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const { networkPrices } = useReduxSelector('networkPrices');

  const [errorDetailsOpen, setErrorDetailsOpen] = useState(false);

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
        tokenAmount.token.decimals,
      );
      if (decimalBalanceCurrency > 0 && decimalBalanceCurrency < 0.01) {
        return '<' + formatNumberToLocaleWithMinDecimals(0.01, 2);
      } else {
        return formatNumberToLocaleWithMinDecimals(decimalBalanceCurrency, 2);
      }
    }
    return tokenPriceUndefinedLabel(network.current);
  };

  const showErrorDetails = () => {
    setErrorDetailsOpen(true);
  };
  const hideErrorDetails = () => {
    setErrorDetailsOpen(false);
  };

  return (
    <>
      <div className={styles.amountRowContainer}>
        <ERC20ListRow
          key={index}
          token={token}
          error={isDefined(error)}
          disabled={isCalculated}
          description={getTokenDisplayName(
            token,
            wallets.available,
            network.current.name,
          )}
          descriptionClassName={styles.descriptionStyle}
          onSelect={onSelectERC20Amount}
          rightView={() => {
            return (
              <div className={styles.tokenListBalances}>
                <Text className={styles.tokenListBalance}>
                  {formatUnitFromHexStringToLocale(
                    tokenAmount.amountString,
                    tokenAmount.token.decimals,
                  )}
                </Text>
                <Text className={styles.descriptionStyle}>
                  {isDefined(tokenPrices) && (
                    <span className={styles.currencyStyle}>
                      {currency.symbol}
                    </span>
                  )}
                  {tokenPriceText()}
                </Text>
              </div>
            );
          }}
        />
        {isDefined(isCalculated) && (
          <div className={styles.calculatedIconContainer}>
            {renderIcon(
              IconType.Calculator,
              22,
              styleguide.colors.buttonBorder,
            )}
          </div>
        )}
        {isDefined(error) && (
          <Text className={styles.errorText}>
            {error.message}{' '}
            <Text className={styles.errorShowMore} onClick={showErrorDetails}>
              (show more)
            </Text>
          </Text>
        )}
      </div>
      {isDefined(error) && errorDetailsOpen && (
        <ErrorDetailsModal error={error} onDismiss={hideErrorDetails} />
      )}
    </>
  );
};
