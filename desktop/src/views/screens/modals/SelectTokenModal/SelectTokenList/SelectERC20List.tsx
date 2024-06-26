import {
  BroadcasterConnectionStatus,
  isDefined,
} from '@railgun-community/shared-models';
import React, { useCallback, useEffect, useState } from 'react';
import { Text } from '@components/Text/Text';
import { ERC20ListRow } from '@components/TokenListRow/ERC20ListRow/ERC20ListRow';
import {
  broadcasterSupportsERC20Token,
  calculateTokenBalance,
  ERC20BalancesSerialized,
  ERC20Token,
  formatNumberToLocaleWithMinDecimals,
  FrontendWallet,
  getDecimalBalance,
  getTokenDisplayName,
  SelectTokenPurpose,
  truncateStr,
  useBroadcasterConnectionStatus,
  useReduxSelector,
} from '@react-shared';
import styles from './SelectTokenList.module.scss';

type Props = {
  addedTokens: ERC20Token[];
  erc20BalancesSerialized: ERC20BalancesSerialized;
  isRailgun: boolean;
  wallet: Optional<FrontendWallet>;
  onSelect: (token: ERC20Token) => void;
  purpose: SelectTokenPurpose;
  useRelayAdaptForBroadcasterFee: boolean;
};

export const SelectERC20List: React.FC<Props> = ({
  addedTokens,
  erc20BalancesSerialized,
  wallet,
  isRailgun,
  onSelect,
  purpose,
  useRelayAdaptForBroadcasterFee,
}) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');

  const { broadcasterConnectionStatus } = useBroadcasterConnectionStatus();
  const [disabledRecord, setDisabledRecord] = useState<Record<string, boolean>>(
    {},
  );

  const isSupportedForBroadcasterFees = useCallback(
    async (token: ERC20Token) => {
      return broadcasterSupportsERC20Token(
        network.current.chain,
        token.address,
        useRelayAdaptForBroadcasterFee,
      );
    },
    [network, useRelayAdaptForBroadcasterFee],
  );

  useEffect(() => {
    const checkIsSupported = async () => {
      if (purpose !== SelectTokenPurpose.BroadcasterFee) {
        setDisabledRecord({});
        return;
      }
      const record: Record<string, boolean> = {};
      const results = await Promise.all(
        addedTokens.map(async token => {
          const isSupported = await isSupportedForBroadcasterFees(token);
          return [token.address, isSupported] as const;
        }),
      );
      for (const [address, isSupported] of results) {
        record[address] = !isSupported;
      }
      setDisabledRecord(record);
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    checkIsSupported();
  }, [addedTokens, purpose, setDisabledRecord, isSupportedForBroadcasterFees]);

  const isDisabled = (token: ERC20Token) => {
    return disabledRecord[token.address] ?? false;
  };

  const renderRightBalance = (token: ERC20Token) => {
    const tokenBalance = calculateTokenBalance(
      wallet,
      token,
      erc20BalancesSerialized,
      isRailgun,
    );

    const hasBalance = isDefined(tokenBalance);
    if (!hasBalance) {
      return;
    }

    const balanceDecimal = getDecimalBalance(tokenBalance, token.decimals);
    const balanceText = hasBalance
      ? balanceDecimal > 0 && balanceDecimal < 0.0001
        ? '<' + formatNumberToLocaleWithMinDecimals(0.0001, 4)
        : formatNumberToLocaleWithMinDecimals(balanceDecimal, 4)
      : undefined;

    return (
      <div className={styles.rightBalances}>
        <Text className={styles.titleStyle}>
          {truncateStr(balanceText, 12)}
        </Text>
      </div>
    );
  };

  const renderRightView = (token: ERC20Token) => {
    if (isDisabled(token)) {
      const noBroadcastersFound =
        !isDefined(broadcasterConnectionStatus) ||
        broadcasterConnectionStatus === BroadcasterConnectionStatus.Searching;
      const disabledText = noBroadcastersFound
        ? 'No public broadcaster available'
        : 'Not accepted';

      return (
        <div className={styles.rightBalances}>
          <Text className={styles.errorStyle}>{disabledText}</Text>
        </div>
      );
    }
    return renderRightBalance(token);
  };

  const renderToken = (token: ERC20Token, index: number) => {
    return (
      <ERC20ListRow
        key={index}
        token={token}
        description={getTokenDisplayName(
          token,
          wallets.available,
          network.current.name,
        )}
        descriptionClassName={styles.descriptionStyle}
        onSelect={
          isDisabled(token)
            ? undefined
            : () => {
                onSelect(token);
              }
        }
        disabled={isDisabled(token)}
        rightView={() => renderRightView(token)}
      />
    );
  };

  return (
    <>
      {!addedTokens.length && (
        <Text className={styles.placeholder}>
          No tokens available for this transaction.
        </Text>
      )}
      {addedTokens.map(renderToken)}
    </>
  );
};
