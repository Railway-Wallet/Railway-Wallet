import {
  BroadcasterConnectionStatus,
  isDefined,
} from "@railgun-community/shared-models";
import React, { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { TokenListRow } from "@components/list/TokenListRow/TokenListRow";
import {
  broadcasterSupportsERC20Token,
  ERC20Token,
  useBroadcasterConnectionStatus,
  useReduxSelector,
} from "@react-shared";
import { styles } from "./styles";

type Props = {
  useRelayAdaptForBroadcasterFee: boolean;
  token: ERC20Token;
  description: string;
  onSelect: () => void;
  renderRightBalance: (token: ERC20Token) => React.ReactNode;
  broadcasterFeeRefreshButtonCount: number;
};

export const SelectBroadcasterFeeTokenListRow: React.FC<Props> = ({
  useRelayAdaptForBroadcasterFee,
  token,
  description,
  onSelect,
  renderRightBalance,
  broadcasterFeeRefreshButtonCount,
}) => {
  const { network } = useReduxSelector("network");

  const { broadcasterConnectionStatus } = useBroadcasterConnectionStatus();

  const [disabled, setDisabled] = useState<boolean>(false);

  const isSupportedForBroadcasterFees = useCallback(
    async (token: ERC20Token) => {
      return broadcasterSupportsERC20Token(
        network.current.chain,
        token.address,
        useRelayAdaptForBroadcasterFee
      );
    },
    [network, useRelayAdaptForBroadcasterFee]
  );

  const isDisabled = useCallback(
    async (token: ERC20Token) => {
      const isSupported = await isSupportedForBroadcasterFees(token);
      return !isSupported;
    },
    [isSupportedForBroadcasterFees]
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
  }, [token, isDisabled, setDisabled, broadcasterFeeRefreshButtonCount]);

  const renderRightView = () => {
    if (disabled) {
      const noBroadcastersFound =
        !isDefined(broadcasterConnectionStatus) ||
        broadcasterConnectionStatus === BroadcasterConnectionStatus.Searching;
      const disabledText = noBroadcastersFound
        ? "No public broadcasters available"
        : "Not accepted";
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
