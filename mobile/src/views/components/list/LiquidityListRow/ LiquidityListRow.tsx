import { RailgunWalletBalanceBucket } from "@railgun-community/shared-models";
import React from "react";
import { Image, Text, View } from "react-native";
import {
  ERC20Token,
  getTokenDisplayNameShort,
  imageForToken,
  styleguide,
  useGetTokenBalanceDescription,
  useReduxSelector,
} from "@react-shared";
import { ListRow } from "../ListRow/ListRow";
import { styles } from "./styles";

type LiquidityListRowTokens = {
  tokenA: ERC20Token;
  tokenB: ERC20Token;
};

type Props = {
  tokens: LiquidityListRowTokens;
  defaultNoBorder?: boolean;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  balanceBucketFilter: RailgunWalletBalanceBucket[];
};

export const LiquidityListRow: React.FC<Props> = ({
  tokens,
  defaultNoBorder,
  selected,
  disabled,
  onSelect,
  balanceBucketFilter,
}) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");
  const { tokenA, tokenB } = tokens;
  const { getTokenBalanceDescription } =
    useGetTokenBalanceDescription(balanceBucketFilter);

  const title = (
    <Text style={styles.titleStyles}>
      {`${getTokenDisplayNameShort(
        tokenA,
        wallets.available,
        network.current.name
      )}-${getTokenDisplayNameShort(
        tokenB,
        wallets.available,
        network.current.name
      )}`}
    </Text>
  );

  const description = `${getTokenBalanceDescription(
    tokenA
  )} • ${getTokenBalanceDescription(tokenB)}`;

  const leftView = () => {
    const iconTokenA = imageForToken(tokenA);
    const iconTokenB = imageForToken(tokenB);

    return (
      <View style={styles.leftViewContainer}>
        <View style={styles.iconContainerLeft}>
          <Image source={iconTokenA} style={styles.tokenIcon} />
        </View>
        <View style={styles.iconContainerRight}>
          <Image source={iconTokenB} style={styles.tokenIcon} />
        </View>
      </View>
    );
  };

  return (
    <ListRow
      title={title}
      description={description}
      descriptionStyle={styles.descriptionStyle}
      defaultNoBorder={defaultNoBorder}
      selected={selected}
      disabled={disabled}
      leftView={leftView}
      backgroundColor={styleguide.colors.gray6()}
      onSelect={onSelect}
    />
  );
};
