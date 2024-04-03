import {
  isDefined,
  RelayerConnectionStatus,
} from '@railgun-community/shared-models';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { TokenListRow } from '@components/list/TokenListRow/TokenListRow';
import {
  ERC20Token,
  relayerSupportsERC20Token,
  useReduxSelector,
  useRelayerConnectionStatus,
} from '@react-shared';
import { styles } from './styles';

type Props = {
  useRelayAdaptForRelayerFee: boolean;
  token: ERC20Token;
  description: string;
  onSelect: () => void;
  renderRightBalance: (token: ERC20Token) => React.ReactNode;
  relayerFeeRefreshButtonCount: number;
};

export const SelectRelayerFeeTokenListRow: React.FC<Props> = ({
  useRelayAdaptForRelayerFee,
  token,
  description,
  onSelect,
  renderRightBalance,
  relayerFeeRefreshButtonCount,
}) => {
  const { network } = useReduxSelector('network');

  const { relayerConnectionStatus } = useRelayerConnectionStatus();

  const [disabled, setDisabled] = useState<boolean>(false);

  const isSupportedForRelayerFees = useCallback(
    async (token: ERC20Token) => {
      return relayerSupportsERC20Token(
        network.current.chain,
        token.address,
        useRelayAdaptForRelayerFee,
      );
    },
    [network, useRelayAdaptForRelayerFee],
  );

  const isDisabled = useCallback(
    async (token: ERC20Token) => {
      const isSupported = await isSupportedForRelayerFees(token);
      return !isSupported;
    },
    [isSupportedForRelayerFees],
  );

  useEffect(() => {
    const checkIsDisabled = async () => {
      if (!isDefined(isDisabled)) {
        return;
      }
      const disabled = await isDisabled(token);
      setDisabled(disabled);
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    checkIsDisabled();
  }, [token, isDisabled, setDisabled, relayerFeeRefreshButtonCount]);

  const renderRightView = () => {
    if (disabled) {
      const noRelayersFound =
        !isDefined(relayerConnectionStatus) ||
        relayerConnectionStatus === RelayerConnectionStatus.Searching;
      const disabledText = noRelayersFound
        ? 'No public relayers available'
        : 'Not accepted';
      return (
        <View style={styles.rightBalances}>
          <Text style={styles.errorStyle}>{disabledText}</Text>
        </View>
      );
    }
    return renderRightBalance(token);
  };

  return (
    <TokenListRow
      token={token}
      description={description}
      onSelect={onSelect}
      disabled={disabled}
      rightView={() => renderRightView()}
    />
  );
};
