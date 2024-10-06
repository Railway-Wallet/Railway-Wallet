import { isDefined } from "@railgun-community/shared-models";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { ButtonWithTextAndIcon } from "@components/buttons/ButtonWithTextAndIcon/ButtonWithTextAndIcon";
import { WideButtonTextOnly } from "@components/buttons/WideButtonTextOnly/WideButtonTextOnly";
import { SafeGrayFooter } from "@components/footers/SafeGrayFooter/SafeGrayFooter";
import { AppHeader } from "@components/headers/AppHeader/AppHeader";
import { HeaderTextButton } from "@components/headers/headerSideComponents/HeaderTextButton/HeaderTextButton";
import { SearchEntry } from "@components/inputs/SearchEntry/SearchEntry";
import { AddTokenStackParamList } from "@models/navigation-models";
import { NavigationProp, RouteProp } from "@react-navigation/native";
import {
  compareTokens,
  DEFAULT_SEARCH_TOKENS_FOR_NETWORK,
  getWalletTransactionHistory,
  RailgunTransactionHistorySync,
  SearchableERC20,
  searchableERC20s,
  styleguide,
  useAppDispatch,
  useReduxSelector,
  WalletTokenService,
} from "@react-shared";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { AddTokenList } from "./AddTokenList/AddTokenList";
import { styles } from "./styles";

type Props = {
  navigation: NavigationProp<AddTokenStackParamList, "AddTokensScreen">;
  route: RouteProp<
    { params: AddTokenStackParamList["AddTokensScreen"] },
    "params"
  >;
};

const NO_TOKENS_TEXT = "No tokens selected.";

export const AddTokensScreen: React.FC<Props> = ({ route, navigation }) => {
  const { params } = route;
  const dispatch = useAppDispatch();

  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");

  const [selectedTokens, setSelectedTokens] = useState<SearchableERC20[]>([]);
  const [selectedTokensText, setSelectedTokensText] =
    useState<string>(NO_TOKENS_TEXT);
  const [searchedTokens, setSearchedTokens] =
    useState<Optional<SearchableERC20[]>>(undefined);
  const [queryString, setQueryString] = useState("");
  const [addingTokens, setAddingTokens] = useState(false);

  useEffect(() => {
    if (
      params?.customToken &&
      !selectedTokens.some((t) => compareTokens(t, params.customToken))
    ) {
      const isSelected = false;
      onSelectToken(params.customToken, isSelected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.customToken]);

  useEffect(() => {
    if (isDefined(params?.initialTokenAddress)) {
      navigation.navigate("AddCustomTokenScreen", {
        initialTokenAddress: params?.initialTokenAddress,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateQueryString = (value: string) => {
    setQueryString(value);
    const searchTokens: Optional<SearchableERC20[]> =
      value === "" ? undefined : searchableERC20s(value, network.current.name);
    setSearchedTokens(searchTokens);
  };

  const updateSelectedTokenText = (tokenList: SearchableERC20[]) => {
    const tokenSymbols = tokenList.map((t) => t.symbol);
    const selectedTokenText = tokenSymbols.length
      ? `${tokenSymbols.join(", ")} selected.`
      : NO_TOKENS_TEXT;
    setSelectedTokensText(selectedTokenText);
  };

  const onSelectToken = (token: SearchableERC20, isSelected: boolean) => {
    const newTokenList = isSelected
      ? selectedTokens.filter((t) => t.address !== token.address)
      : [...selectedTokens, token];

    triggerHaptic(HapticSurface.SelectItem);
    setSelectedTokens(newTokenList);
    updateSelectedTokenText(newTokenList);
  };

  const saveSelection = async () => {
    const walletTokenService = new WalletTokenService(dispatch);
    const activeWallet = wallets.active;
    if (activeWallet) {
      setAddingTokens(true);
      await walletTokenService.addERC20TokensToWallet(
        activeWallet,
        selectedTokens,
        network.current
      );
      triggerHaptic(HapticSurface.EditSuccess);
      setAddingTokens(false);
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    RailgunTransactionHistorySync.safeSyncTransactionHistory(
      dispatch,
      network.current,
      getWalletTransactionHistory
    );

    navigation.goBack();
  };

  const onPressCustomToken = () => {
    triggerHaptic(HapticSurface.NavigationButton);
    navigation.navigate("AddCustomTokenScreen");
  };

  return (
    <>
      <AppHeader
        title="Add tokens"
        isModal={true}
        backgroundColor={styleguide.colors.gray5()}
        headerStatusBarHeight={16}
        headerLeft={
          <HeaderTextButton
            text="Cancel"
            onPress={() => {
              navigation.goBack();
            }}
          />
        }
      />
      <View style={styles.wrapper}>
        <SearchEntry value={queryString} onUpdateQuery={updateQueryString} />
        <AddTokenList
          searchedTokens={searchedTokens}
          currentTokens={
            wallets.active?.addedTokens[network.current.name] || []
          }
          defaultTokens={
            DEFAULT_SEARCH_TOKENS_FOR_NETWORK[network.current.name]
          }
          selectedTokens={selectedTokens}
          onSelectToken={onSelectToken}
        />
        <SafeGrayFooter>
          <View style={styles.footerContent}>
            <Text style={styles.selectedTokens}>{selectedTokensText}</Text>
            <WideButtonTextOnly
              title="Save selected tokens"
              onPress={saveSelection}
              disabled={addingTokens || selectedTokens.length === 0}
              additionalStyles={styles.saveButton}
            />
            <ButtonWithTextAndIcon
              icon="plus"
              title="Custom token"
              onPress={onPressCustomToken}
              additionalStyles={styles.customTokenButton}
            />
          </View>
        </SafeGrayFooter>
      </View>
    </>
  );
};
