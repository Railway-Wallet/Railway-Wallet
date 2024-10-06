import React, { ReactNode } from "react";
import { FlatList, Text, View } from "react-native";
import { TokenListRow } from "@components/list/TokenListRow/TokenListRow";
import {
  compareTokens,
  createERC20TokenFromSearchableERC20,
  ERC20Token,
  SearchableERC20,
} from "@react-shared";
import { styles } from "./styles";

type Props = {
  searchedTokens: Optional<SearchableERC20[]>;
  currentTokens: ERC20Token[];
  selectedTokens: SearchableERC20[];
  defaultTokens: SearchableERC20[];
  onSelectToken: (token: SearchableERC20, isSelected: boolean) => void;
};

export const AddTokenList: React.FC<Props> = ({
  searchedTokens,
  currentTokens,
  selectedTokens,
  defaultTokens,
  onSelectToken,
}) => {
  const alreadyAddedRightView = () => {
    return (
      <View style={styles.addedContainer}>
        <Text style={styles.addedText}>Added</Text>
      </View>
    );
  };

  const renderSearchedToken = ({ item }: { item: SearchableERC20 }) => {
    let disabled = false;
    let rightView: Optional<() => ReactNode>;
    const ERC20Token = createERC20TokenFromSearchableERC20(item);
    if (currentTokens.find((t) => compareTokens(t, ERC20Token))) {
      disabled = true;
      rightView = alreadyAddedRightView;
    }

    const selected = selectedTokens.some((t) => compareTokens(t, ERC20Token));
    const token = createERC20TokenFromSearchableERC20(item);

    return (
      <TokenListRow
        token={token}
        description={token.symbol}
        onSelect={() => {
          onSelectToken(item, selected);
        }}
        rightView={rightView}
        disabled={disabled}
        selected={selected}
        defaultNoBorder
      />
    );
  };

  let showTokens: SearchableERC20[];
  let tokenHeaderText: string;

  if (searchedTokens) {
    showTokens = searchedTokens;
    tokenHeaderText = "Search results";
  } else if (selectedTokens.length) {
    showTokens = selectedTokens;
    tokenHeaderText = "Tap to deselect";
  } else {
    showTokens = defaultTokens;
    tokenHeaderText = "Popular";
  }

  return (
    <>
      <Text style={styles.listHeader}>{tokenHeaderText}</Text>
      <FlatList
        style={styles.tokenList}
        contentContainerStyle={styles.tokenListContentContainer}
        data={showTokens}
        keyExtractor={(_item: SearchableERC20, index: number) => String(index)}
        renderItem={renderSearchedToken}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
    </>
  );
};
