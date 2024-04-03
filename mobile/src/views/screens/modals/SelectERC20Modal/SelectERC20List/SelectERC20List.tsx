import { isDefined } from '@railgun-community/shared-models';
import React from 'react';
import { FlatList, Text, View } from 'react-native';
import { TokenListRow } from '@components/list/TokenListRow/TokenListRow';
import {
  calculateTokenBalance,
  ERC20BalancesSerialized,
  ERC20Token,
  formatNumberToLocaleWithMinDecimals,
  FrontendWallet,
  getDecimalBalance,
  getTokenDisplayNameShort,
  SelectTokenPurpose,
  truncateStr,
  useReduxSelector,
} from '@react-shared';
import { SelectRelayerFeeTokenListRow } from './SelectRelayerFeeTokenListRow';
import { styles } from './styles';

type Props = {
  addedTokens: ERC20Token[];
  ERC20BalancesSerialized: ERC20BalancesSerialized;
  isRailgun: boolean;
  wallet: Optional<FrontendWallet>;
  onSelect: (token: ERC20Token) => void;
  purpose: SelectTokenPurpose;
  useRelayAdaptForRelayerFee: boolean;
  relayerFeeRefreshButtonCount: number;
};

export const SelectERC20List: React.FC<Props> = ({
  addedTokens,
  ERC20BalancesSerialized,
  wallet,
  isRailgun,
  onSelect,
  purpose,
  useRelayAdaptForRelayerFee,
  relayerFeeRefreshButtonCount,
}) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');

  const renderRightBalance = (token: ERC20Token) => {
    const tokenBalance = calculateTokenBalance(
      wallet,
      token,
      ERC20BalancesSerialized,
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
      <View style={styles.rightBalances}>
        <Text style={styles.titleStyle}>{truncateStr(balanceText, 12)}</Text>
      </View>
    );
  };

  const renderToken = (token: ERC20Token) => {
    const description = getTokenDisplayNameShort(
      token,
      wallets.available,
      network.current.name,
    );

    if (purpose === SelectTokenPurpose.RelayerFee) {
      return (
        <SelectRelayerFeeTokenListRow
          token={token}
          description={description}
          onSelect={() => onSelect(token)}
          renderRightBalance={() => renderRightBalance(token)}
          useRelayAdaptForRelayerFee={useRelayAdaptForRelayerFee}
          relayerFeeRefreshButtonCount={relayerFeeRefreshButtonCount}
        />
      );
    }

    return (
      <TokenListRow
        token={token}
        description={description}
        onSelect={() => onSelect(token)}
        rightView={() => renderRightBalance(token)}
        disabled={false}
      />
    );
  };

  return (
    <>
      {!addedTokens.length && (
        <Text style={styles.placeholder}>
          No tokens available for this transaction.
        </Text>
      )}
      <FlatList
        style={styles.tokenList}
        contentContainerStyle={styles.tokenListContentContainer}
        data={addedTokens}
        keyExtractor={(_item: ERC20Token, index: number) => String(index)}
        renderItem={info => renderToken(info.item)}
      />
    </>
  );
};
