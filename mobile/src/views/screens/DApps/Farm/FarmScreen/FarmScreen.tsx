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
  CookbookFarmRecipeType,
  ERC20Token,
  formatNumberToLocaleWithMinDecimals,
  getDecimalBalance,
  getSupportedNetworks,
  getTokenDisplayName,
  getVaultsAndAssetsUrls,
  IconShielded,
  logDevError,
  NetworkService,
  refreshRailgunBalances,
  styleguide,
  truncateStr,
  useAppDispatch,
  useBalancePriceRefresh,
  useERC20BalancesSerialized,
  useReduxSelector,
  useVaultFetch,
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
import { TokenListRow } from "@views/components/list/TokenListRow/TokenListRow";
import { WalletNetworkSelector } from "@views/screens/tabs/WalletsScreen/WalletNetworkSelector/WalletNetworkSelector";
import { styles } from "./styles";

type Props = {
  navigation: NavigationProp<DAppsStackParamList, "FarmScreen">;
};

type Action = {
  label: string;
  value: CookbookFarmRecipeType;
};

const DEPOSIT_LABEL = "Farmable assets";
const REDEEM_LABEL = "Assets to redeem";

export const FarmScreen: React.FC<Props> = ({ navigation }) => {
  const { vaults } = useReduxSelector("vaults");
  const { wallets } = useReduxSelector("wallets");
  const { network } = useReduxSelector("network");
  const dispatch = useAppDispatch();
  const { showActionSheetWithOptions } = useActionSheet();
  const { isLoading, refreshVaultData } = useVaultFetch();
  const [errorModal, setErrorModal] =
    useState<Optional<ErrorDetailsModalProps>>(undefined);
  const { pullPrices, pullBalances } = useBalancePriceRefresh(
    refreshRailgunBalances,
    (error: Error) =>
      setErrorModal({
        show: true,
        error,
        onDismiss: () => setErrorModal(undefined),
      })
  );

  const [filteredTokens, setFilteredTokens] = useState<ERC20Token[]>([]);
  const [showLoadingNetworkPublicName, setShowLoadingNetworkPublicName] =
    useState<Optional<string>>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedAction, setSelectedAction] = useState<Action>({
    label: DEPOSIT_LABEL,
    value: CookbookFarmRecipeType.Deposit,
  });

  const scrollViewRef = useRef<ScrollView | null>(null);
  const activeWallet = wallets.active;
  const networkName = network.current.name;
  const useRailgunBalances = true;
  const networkVaultData = vaults.forNetwork[networkName];
  const actions = [
    { label: DEPOSIT_LABEL, value: CookbookFarmRecipeType.Deposit },
    { label: REDEEM_LABEL, value: CookbookFarmRecipeType.Redeem },
  ];

  const balanceBucketFilter = [RailgunWalletBalanceBucket.Spendable];
  const { tokenBalancesSerialized } = useERC20BalancesSerialized(
    useRailgunBalances,
    balanceBucketFilter
  );
  const { availableDepositTokens, availableRedeemTokens } =
    useWalletTokenVaultsFilter(activeWallet, networkName);

  useEffect(() => {
    if (!isLoading) {
      let availableTokens: ERC20Token[] = [];
      switch (selectedAction.value as CookbookFarmRecipeType) {
        case CookbookFarmRecipeType.Deposit:
          availableTokens = availableDepositTokens;
          break;
        case CookbookFarmRecipeType.Redeem:
          availableTokens = availableRedeemTokens;
          break;
      }
      setFilteredTokens(availableTokens);
    }
  }, [
    availableDepositTokens,
    availableRedeemTokens,
    isLoading,
    selectedAction.value,
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
      const error = new Error(
        "Connection error while loading network. Please try again.",
        { cause }
      );
      logDevError(error);
      setShowLoadingNetworkPublicName(undefined);
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

  const refreshBalancesAndVaults = async () => {
    if (isRefreshing) {
      return;
    }
    setIsRefreshing(true);

    const skipCache = true;
    await refreshVaultData(network.current.name, skipCache);

    await pullBalances();
    setIsRefreshing(false);
  };

  const onSelectERC20 = (token: ERC20Token) => {
    triggerHaptic(HapticSurface.NavigationButton);

    navigation.navigate("FarmVaultInitial", {
      currentToken: token,
      cookbookFarmRecipeType: selectedAction.value,
    });
  };

  const bestAPYForToken = (tokenAddress: string): Optional<number> => {
    switch (selectedAction.value as CookbookFarmRecipeType) {
      case CookbookFarmRecipeType.Deposit:
        return networkVaultData?.depositVaultsForToken[
          tokenAddress.toLowerCase()
        ]?.bestApy;
      case CookbookFarmRecipeType.Redeem:
        return networkVaultData?.redeemVaultForToken[tokenAddress.toLowerCase()]
          ?.apy;
    }
  };

  const getBestAPYPercentage = (tokenAddress: string): string => {
    const bestAPY = bestAPYForToken(tokenAddress);
    if (!isDefined(bestAPY)) {
      return "N/A";
    }
    return formatNumberToLocaleWithMinDecimals(bestAPY * 100, 2);
  };

  const rightBalances = (token: ERC20Token) => {
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
          {getBestAPYPercentage(token.address)}% APY
        </Text>
        <Text style={styles.descriptionStyle} numberOfLines={1}>
          {truncateStr(balanceText, 12)}
        </Text>
      </View>
    );
  };

  const renderToken = (token: ERC20Token, index: number) => {
    return (
      <TokenListRow
        disabled={false}
        key={index}
        token={token}
        description={getTokenDisplayName(
          token,
          wallets.available,
          network.current.name
        )}
        onSelect={() => onSelectERC20(token)}
        rightView={() => rightBalances(token)}
      />
    );
  };

  const openUrl = async (url: string) => {
    triggerHaptic(HapticSurface.SelectItem);
    await openInAppBrowserLink(url, dispatch);
  };

  const hasTokens = filteredTokens.length > 0;

  const farmActionAdjectiveText =
    selectedAction.value === CookbookFarmRecipeType.Deposit
      ? "farmable"
      : "redeemable";

  return (
    <>
      <AppHeader
        title="Farm"
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
              onRefresh={refreshBalancesAndVaults}
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
            {isLoading ? (
              <View style={styles.spinnerContainer}>
                <SpinnerCubes size={32} />
              </View>
            ) : hasTokens ? (
              <View>{filteredTokens.map(renderToken)}</View>
            ) : (
              <Text style={styles.placeholderText}>
                No {farmActionAdjectiveText} assets found in your private
                balance.
              </Text>
            )}
            <View style={styles.farmSourcesWrapper}>
              <View style={styles.horizontalLine} />
              <Text style={styles.farmSourcesListText}>
                For a full list of {farmActionAdjectiveText} tokens, visit these
                sources:
              </Text>
              <View style={styles.farmSourcesListWrapper}>
                {getVaultsAndAssetsUrls().map(
                  ({ vaultDisplayName, assetsUrl }, index) => (
                    <ButtonTextOnly
                      key={index}
                      title={vaultDisplayName}
                      onTap={() => openUrl(assetsUrl)}
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
