import { isDefined } from "@railgun-community/shared-models";
import React from "react";
import { Text } from "react-native";
import {
  ERC20Token,
  SearchableERC20,
  usePendingBalancePriceLabel,
} from "@react-shared";
import { styles } from "./styles";

type Props = {
  onPress: () => void;
  token?: ERC20Token | SearchableERC20;
};

export const POIPendingBalanceCallout: React.FC<Props> = ({
  onPress,
  token,
}) => {
  const { pendingBalancePriceLabel } = usePendingBalancePriceLabel(true, token);
  const label = pendingBalancePriceLabel ?? "N/A";
  const title = isDefined(token) ? "Pending balance: " : "Pending balances: ";

  return (
    <Text
      numberOfLines={1}
      adjustsFontSizeToFit
      style={styles.balanceText}
      onPress={onPress}
    >
      {"*"}
      {title}
      <Text style={styles.balanceCTA}>{label}</Text>
    </Text>
  );
};
