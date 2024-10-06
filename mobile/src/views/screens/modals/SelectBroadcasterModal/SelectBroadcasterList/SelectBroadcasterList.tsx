import {
  isDefined,
  SelectedBroadcaster,
} from "@railgun-community/shared-models";
import React from "react";
import { FlatList, Text, View } from "react-native";
import { formatUnits } from "ethers";
import {
  AppSettingsService,
  IconPublic,
  renderBroadcasterReliability,
  styleguide,
  useReduxSelector,
} from "@react-shared";
import { Icon } from "@views/components/icons/Icon";
import { ListRow } from "@views/components/list/ListRow/ListRow";
import { styles } from "./styles";

type Props = {
  selectedBroadcaster: Optional<SelectedBroadcaster>;
  allBroadcasters: Optional<SelectedBroadcaster[]>;
  decimals: Optional<number>;
  feeTokenName: Optional<string>;
  onSelect: (broadcaster: Optional<SelectedBroadcaster>) => void;
  onSelectRandom: () => void;
};

export const SelectBroadcasterList: React.FC<Props> = ({
  selectedBroadcaster,
  allBroadcasters,
  decimals,
  feeTokenName,
  onSelect,
  onSelectRandom,
}) => {
  const { network } = useReduxSelector("network");
  const { networkPrices } = useReduxSelector("networkPrices");
  const tokenPrices =
    networkPrices.forNetwork[network.current.name]?.forCurrency[
      AppSettingsService.currency.code
    ];

  const renderBroadcaster = ({
    item,
    index,
  }: {
    item: SelectedBroadcaster;
    index: number;
  }) => {
    const broadcaster = item;
    const selected =
      broadcaster.railgunAddress === selectedBroadcaster?.railgunAddress;

    const { wrappedSymbol } = network.current.baseToken;

    const feeBigInt = BigInt(broadcaster.tokenFee.feePerUnitGas);
    const reliability = broadcaster.tokenFee.reliability;
    const formattedFee = formatUnits(feeBigInt, decimals);
    const parsedFee = parseFloat(formattedFee);
    const parsedDecimals = parsedFee > 1 ? 4 : 8;
    const formattedParsedFee = parsedFee.toFixed(parsedDecimals);
    const reliabilityTag = `${renderBroadcasterReliability(reliability)}`;
    const reliabilityDescription = isDefined(reliability)
      ? reliability
      : "New broadcaster";

    if (isDefined(tokenPrices)) {
      const currentTokenPrice = tokenPrices[broadcaster.tokenAddress];
      if (isDefined(currentTokenPrice)) {
        const baseTokenPrice =
          tokenPrices[network.current.baseToken.wrappedAddress];
        if (isDefined(baseTokenPrice)) {
          const feeTokenRatio =
            (currentTokenPrice * parseFloat(formattedParsedFee)) /
            baseTokenPrice;
          if (feeTokenRatio < 0.6 || feeTokenRatio > 2.1) {
            return <></>;
          }
        }
      }
    }

    const leftView = () => (
      <View style={styles.iconContainer}>
        <Text>{reliabilityTag}</Text>
      </View>
    );

    return (
      <ListRow
        key={index}
        title={
          <Text
            style={styles.titleStyle}
          >{`Fee Ratio\n(${formattedParsedFee} ${feeTokenName} : 1 ${wrappedSymbol.slice(
            1
          )})`}</Text>
        }
        description={
          <Text
            style={styles.descriptionTextStyle}
          >{`Reliability: ${reliabilityDescription}`}</Text>
        }
        selected={selected}
        leftView={leftView}
        onSelect={() => onSelect(broadcaster)}
      />
    );
  };

  const renderRandomBroadcasterRow = () => {
    const leftView = () => (
      <View style={styles.iconContainer}>
        <Icon
          source={IconPublic()}
          size={22}
          color={styleguide.colors.lighterLabelSecondary}
        />
      </View>
    );

    return (
      <ListRow
        title={<Text style={styles.titleStyle}>{"Random Broadcaster"}</Text>}
        description={
          <Text style={styles.descriptionTextStyle}>
            {"Auto-select random Public Broadcaster"}
          </Text>
        }
        leftView={leftView}
        onSelect={onSelectRandom}
      />
    );
  };

  const noBroadcasters = !allBroadcasters || allBroadcasters.length === 0;

  return (
    <FlatList
      contentContainerStyle={styles.contentContainer}
      data={allBroadcasters}
      renderItem={renderBroadcaster}
      keyExtractor={(item) => item.railgunAddress}
      ListHeaderComponent={
        noBroadcasters ? undefined : renderRandomBroadcasterRow
      }
      ListEmptyComponent={
        noBroadcasters ? (
          <Text style={styles.placeholder}>
            No public broadcasters found for fee token.
          </Text>
        ) : undefined
      }
    />
  );
};
