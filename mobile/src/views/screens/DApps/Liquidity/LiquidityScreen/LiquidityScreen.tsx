import {
  isDefined,
  Network,
  RailgunWalletBalanceBucket,
} from "@railgun-community/shared-models";
import React, { useEffect, useRef, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { Button } from "react-native-paper";
import { ButtonTextOnly } from "@components/buttons/ButtonTextOnly/ButtonTextOnly";
import { AppHeader } from "@components/headers/AppHeader/AppHeader";
import { HeaderBackButton } from "@components/headers/headerSideComponents/HeaderBackButton/HeaderBackButton";
import { FullScreenSpinner } from "@components/loading/FullScreenSpinner/FullScreenSpinner";
import { LoadingSwirl } from "@components/loading/LoadingSwirl/LoadingSwirl";
import { SpinnerCubes } from "@components/loading/SpinnerCubes/SpinnerCubes";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { DAppsStackParamList } from "@models/navigation-models";
import { NavigationProp } from "@react-navigation/native";
import {
  CookbookLiquidityRecipeType,
  ERC20Token,
  formatNumberToLocaleWithMinDecimals,
  FrontendLiquidityPair,
  getDecimalBalance,
  getLiquiditySourcesAndAssetsUrls,
  getSupportedNetworks,
  getTokenDisplayName,
  IconShielded,
  logDevError,
  NetworkService,
  refreshRailgunBalances,
  styleguide,
  truncateStr,
  useAppDispatch,
  useBalancePriceRefresh,
  useERC20BalancesSerialized,
  useLiquidityFetch,
  useLiquidityPairsForWalletFilter,
  useLiquidityPairsSort,
  useLiquidityTokensSort,
  useReduxSelector,
  useWalletTokenVaultsFilter,
} from "@react-shared";
import {
  ErrorDetailsModal,
  ErrorDetailsModalProps,
} from "@screens/modals/ErrorDetailsModal/ErrorDetailsModal";
import { callActionSheet } from "@services/util/action-sheet-options-service";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { openInAppBrowserLink } from "@services/util/in-app-browser-service";
import { Icon } from "@views/components/icons/Icon";
import { LiquidityListRow } from "@views/components/list/LiquidityListRow/ LiquidityListRow";
import { TokenListRow } from "@views/components/list/TokenListRow/TokenListRow";
import { WalletNetworkSelector } from "@views/screens/tabs/WalletsScreen/WalletNetworkSelector/WalletNetworkSelector";
import { styles } from "./styles";

type Props = {
  navigation: NavigationProp<DAppsStackParamList, "LiquidityScreen">;
};

type Action = {
  label: string;
  value: CookbookLiquidityRecipeType;
};

const REMOVE_LIQUIDITY_LABEL = "Remove liquidity";
const ADD_LIQUIDITY_LABEL = "Add liquidity";

export const LiquidityScreen: React.FC<Props> = ({ navigation }) => {
  const scrollViewRef = useRef<ScrollView | null>(null);
  const { wallets } = useReduxSelector("wallets");
  const { network } = useReduxSelector("network");
  const activeWallet = wallets.active;
  const networkName = network.current.name;
  const isRailgun = true;

  const [showLoadingNetworkPublicName, setShowLoadingNetworkPublicName] =
    useState<Optional<string>>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedAction, setSelectedAction] = useState<Action>({
    label: ADD_LIQUIDITY_LABEL,
    value: CookbookLiquidityRecipeType.AddLiquidity,
  });
  const [filteredPoolsForAddLiquidity, setFilteredPoolsForAddLiquidity] =
    useState<FrontendLiquidityPair[]>([]);
  const [
    filteredERC20TokensForRemoveLiquidity,
    setFilteredERC20TokensForRemoveLiquidity,
  ] = useState<ERC20Token[]>([]);
  const [errorModal, setErrorModal] =
    useState<Optional<ErrorDetailsModalProps>>(undefined);

  const dispatch = useAppDispatch();
  const { showActionSheetWithOptions } = useActionSheet();
  const { refreshLiquidityData, isLoading } = useLiquidityFetch();
  const balanceBucketFilter = [RailgunWalletBalanceBucket.Spendable];
  const { tokenBalancesSerialized } = useERC20BalancesSerialized(
    isRailgun,
    balanceBucketFilter
  );
  const { addedLiquidityTokens, supportedLiquidityPairs } =
    useLiquidityPairsForWalletFilter(activeWallet, networkName, isRailgun);
  const { sortedLiquidityPairs } = useLiquidityPairsSort(
    supportedLiquidityPairs,
    isRailgun
  );
  const { sortedLiquidityTokens } = useLiquidityTokensSort(
    addedLiquidityTokens,
    isRailgun
  );
  useWalletTokenVaultsFilter(activeWallet, networkName);
  const { pullPrices, pullBalances } = useBalancePriceRefresh(
    refreshRailgunBalances,
    (error: Error) =>
      setErrorModal({
        show: true,
        error,
        onDismiss: () => setErrorModal(undefined),
      })
  );

  const actions = [
    {
      label: ADD_LIQUIDITY_LABEL,
      value: CookbookLiquidityRecipeType.AddLiquidity,
    },
    {
      label: REMOVE_LIQUIDITY_LABEL,
      value: CookbookLiquidityRecipeType.RemoveLiquidity,
    },
  ];

  useEffect(() => {
    if (!isLoading) {
      switch (selectedAction.value) {
        case CookbookLiquidityRecipeType.AddLiquidity:
          setFilteredPoolsForAddLiquidity(sortedLiquidityPairs);
          break;

        case CookbookLiquidityRecipeType.RemoveLiquidity:
          setFilteredERC20TokensForRemoveLiquidity(sortedLiquidityTokens);
          break;
      }
    }
  }, [
    sortedLiquidityTokens,
    isLoading,
    selectedAction.value,
    sortedLiquidityPairs,
    supportedLiquidityPairs,
  ]);

  const onSelectFarmAction = () => {
    triggerHaptic(HapticSurface.NavigationButton);
    const buttons = actions.map((a) => {
      return {
        name: a.label,
        action: () => setSelectedAction(a),
      };
    });

    callActionSheet(showActionSheetWithOptions, "Filter assets", buttons);
  };

  const onSelectNetwork = async (newNetwork: Network) => {
    if (network.current.name === newNetwork.name) {
      return;
    }

    setShowLoadingNetworkPublicName(newNetwork.publicName);
    try {
      const networkService = new NetworkService(dispatch);
      const shouldFallbackOnError = true;
      await networkService.tryChangeNetwork(
        network.current.name,
        newNetwork.name,
        shouldFallbackOnError,
        pullPrices,
        pullBalances
      );

      triggerHaptic(HapticSurface.EditSuccess);

      scrollViewRef.current?.scrollTo({ x: 0, animated: false });
      setShowLoadingNetworkPublicName(undefined);
    } catch (cause) {
      setShowLoadingNetworkPublicName(undefined);
      const error = new Error(
        "Connection error while loading network. Please try again.",
        { cause }
      );
      logDevError(error);
      setErrorModal({
        show: true,
        error,
        onDismiss: () => setErrorModal(undefined),
      });
    }
  };

  const onTapNetworkSelector = () => {
    triggerHaptic(HapticSurface.NavigationButton);
    const networks = getSupportedNetworks();
    const buttons = networks.map((n) => {
      return {
        name:
          n.isDevOnlyNetwork === true ? `[DEV] ${n.publicName}` : n.publicName,
        action: () => onSelectNetwork(n),
      };
    });

    callActionSheet(showActionSheetWithOptions, "Select network", buttons);
  };

  const refreshBalancesAndPools = async () => {
    if (isRefreshing) {
      return;
    }
    setIsRefreshing(true);
    await refreshLiquidityData(
      network.current.name,
      wallets?.active?.addedTokens[network.current.name] ?? []
    );

    await pullBalances();
    setIsRefreshing(false);
  };

  const onSelectRemoveLiquidityERC20 = (token: ERC20Token) => {
    triggerHaptic(HapticSurface.NavigationButton);

    navigation.navigate("RemoveLiquidityInitial", {
      tokenAddress: token.address,
    });
  };

  const rightBalancesRemoveLiquidityERC20 = (token: ERC20Token) => {
    const balance = tokenBalancesSerialized[token.address.toLowerCase()];
    const hasBalance = isDefined(balance);

    if (!hasBalance || !balance) {
      return <LoadingSwirl />;
    }

    const balanceDecimal = getDecimalBalance(BigInt(balance), token.decimals);
    const balanceText = hasBalance
      ? balanceDecimal > 0 && balanceDecimal < 0.0001
        ? "<" + formatNumberToLocaleWithMinDecimals(0.0001, 4)
        : formatNumberToLocaleWithMinDecimals(balanceDecimal, 4)
      : undefined;

    return (
      <View style={styles.rightBalances}>
        <Text style={styles.titleStyle} numberOfLines={1}>
          {truncateStr(balanceText, 12)}
        </Text>
      </View>
    );
  };

  const openUrl = async (url: string) => {
    triggerHaptic(HapticSurface.SelectItem);
    await openInAppBrowserLink(url, dispatch);
  };

  const renderRemoveLiquidityERC20 = (token: ERC20Token, index: number) => {
    const tokenName = getTokenDisplayName(
      token,
      wallets.available,
      networkName
    );
    return (
      <TokenListRow
        disabled={false}
        key={index}
        token={token}
        description={tokenName}
        onSelect={() => onSelectRemoveLiquidityERC20(token)}
        rightView={() => rightBalancesRemoveLiquidityERC20(token)}
      />
    );
  };

  const onSelectAddLiquidityPool = (pool: FrontendLiquidityPair) => {
    triggerHaptic(HapticSurface.NavigationButton);

    navigation.navigate("AddLiquidityInitial", {
      pool,
    });
  };

  const renderAddLiquidityPool = (
    pool: FrontendLiquidityPair,
    index: number
  ) => {
    const { tokenA, tokenB } = pool;
    return (
      <LiquidityListRow
        key={index}
        tokens={{ tokenA, tokenB }}
        onSelect={() => onSelectAddLiquidityPool(pool)}
        balanceBucketFilter={balanceBucketFilter}
      />
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.spinnerContainer}>
          <SpinnerCubes size={32} />
        </View>
      );
    }
    if (
      filteredPoolsForAddLiquidity.length > 0 &&
      selectedAction.value === CookbookLiquidityRecipeType.AddLiquidity
    ) {
      return (
        <View>{filteredPoolsForAddLiquidity.map(renderAddLiquidityPool)}</View>
      );
    }
    if (
      filteredERC20TokensForRemoveLiquidity.length > 0 &&
      selectedAction.value === CookbookLiquidityRecipeType.RemoveLiquidity
    ) {
      return (
        <View>
          {filteredERC20TokensForRemoveLiquidity.map(
            renderRemoveLiquidityERC20
          )}
        </View>
      );
    }
    return (
      <Text style={styles.placeholderText}>
        No liquidity pairs found in your private balance.
      </Text>
    );
  };

  return (
    <>
      <AppHeader
        title="Liquidity"
        headerLeft={<HeaderBackButton />}
        headerRight={
          <WalletNetworkSelector onTap={onTapNetworkSelector} isNavBar />
        }
      />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refreshBalancesAndPools}
              tintColor={styleguide.colors.white}
            />
          }
          ref={scrollViewRef}
        >
          <View style={styles.contentWrapper}>
            <View style={styles.listHeader}>
              <View style={styles.listHeaderTextWrapper}>
                <Text style={styles.listHeaderText}>Shielded</Text>
                <View style={styles.listHeaderIcon}>
                  <Icon
                    source={IconShielded()}
                    size={16}
                    color={styleguide.colors.gray7()}
                  />
                </View>
              </View>
              <View style={styles.buttonWrapper}>
                <Button
                  onPress={onSelectFarmAction}
                  icon="chevron-right"
                  textColor={styleguide.colors.text()}
                  style={styles.buttonStyle}
                  contentStyle={styles.buttonContent}
                >
                  <Text style={styles.buttonText}>{selectedAction.label}</Text>
                </Button>
              </View>
            </View>
            {renderContent()}
            <View style={styles.farmSourcesWrapper}>
              <View style={styles.horizontalLine} />
              <Text style={styles.farmSourcesListText}>
                For a full list of liquidity pairs, visit these sources:
              </Text>
              <View style={styles.farmSourcesListWrapper}>
                {getLiquiditySourcesAndAssetsUrls(networkName).map(
                  ({ liquiditySource, url }) => (
                    <ButtonTextOnly
                      key={liquiditySource}
                      title={liquiditySource}
                      onTap={() => openUrl(url)}
                      viewStyle={styles.farmSourceButton}
                      labelStyle={styles.farmSourcesListButtonText}
                    />
                  )
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
      <FullScreenSpinner
        show={isDefined(showLoadingNetworkPublicName)}
        text={
          isDefined(showLoadingNetworkPublicName)
            ? `Loading ${showLoadingNetworkPublicName} and scanning new transactions`
            : ""
        }
      />
      {isDefined(errorModal) && <ErrorDetailsModal {...errorModal} />}
    </>
  );
};
