import { isDefined } from "@railgun-community/shared-models";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TransactionResponse } from "ethers";
import { ButtonIconOnly } from "@components/buttons/ButtonIconOnly/ButtonIconOnly";
import { InfoCallout } from "@components/callouts/InfoCallout/InfoCallout";
import { AppHeader } from "@components/headers/AppHeader/AppHeader";
import { HeaderBackButton } from "@components/headers/headerSideComponents/HeaderBackButton/HeaderBackButton";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { WalletsStackParamList } from "@models/navigation-models";
import Clipboard from "@react-native-clipboard/clipboard";
import {
  CommonActions,
  NavigationProp,
  RouteProp,
} from "@react-navigation/native";
import {
  AppSettingsService,
  CalloutType,
  compareTokens,
  CookbookFarmRecipeType,
  getNetworkFrontendConfig,
  getTokenDisplayHeader,
  getTokenDisplayNameShort,
  MINTABLE_TEST_TOKEN_ROPSTEN,
  refreshRailgunBalances,
  SavedTransaction,
  showImmediateToast,
  styleguide,
  ToastType,
  useAddedTokenSearch,
  useAppDispatch,
  useBalancePriceRefresh,
  useFilteredTokenTransactions,
  usePOIRequiredForCurrentNetwork,
  useReduxSelector,
  WalletTokenService,
} from "@react-shared";
import {
  ErrorDetailsModal,
  ErrorDetailsModalProps,
} from "@screens/modals/ErrorDetailsModal/ErrorDetailsModal";
import {
  callActionSheet,
  OptionWithAction,
} from "@services/util/action-sheet-options-service";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { isAndroid } from "@services/util/platform-os-service";
import { ERC20Card } from "./ERC20Card/ERC20Card";
import { TransactionList } from "./TransactionList/TransactionList";
import { styles } from "./styles";

type Props = {
  navigation: NavigationProp<WalletsStackParamList, "TokenInfo">;
  route: RouteProp<{ params: WalletsStackParamList["TokenInfo"] }, "params">;
};

export const ERC20Info: React.FC<Props> = ({ navigation, route }) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");
  const { networkPrices } = useReduxSelector("networkPrices");

  const { token, isRailgun, balanceBucketFilter } = route.params;

  const dispatch = useAppDispatch();

  const { showActionSheetWithOptions } = useActionSheet();
  const [showAddTokenButton, setShowAddTokenButton] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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
  const { poiRequired } = usePOIRequiredForCurrentNetwork();

  const pricesForNetwork =
    networkPrices.forNetwork[network.current.name]?.forCurrency[
      AppSettingsService.currency.code
    ];
  const tokenPrice = isDefined(pricesForNetwork)
    ? pricesForNetwork[token.address.toLowerCase()]
    : undefined;
  const showPriceUnknown =
    !(network.current.isTestnet ?? false) && !isDefined(tokenPrice);

  const { tokenTransactions } = useFilteredTokenTransactions(token, isRailgun);

  const { tokens } = useAddedTokenSearch();

  useEffect(() => {
    let isTokenAddedToWallet = false;
    for (const addedToken of tokens) {
      const match = compareTokens(addedToken, token);
      if (match) {
        isTokenAddedToWallet = true;
        break;
      }
    }

    setShowAddTokenButton(!isTokenAddedToWallet);
  }, [tokens, token]);

  const onActionCreateWallet = () => {
    triggerHaptic(HapticSurface.NavigationButton);

    navigation.dispatch(
      CommonActions.navigate("NewWallet", { screen: "CreateWallet" })
    );
  };

  const onActionImportWallet = () => {
    triggerHaptic(HapticSurface.NavigationButton);

    navigation.dispatch(
      CommonActions.navigate("NewWallet", { screen: "ImportWallet" })
    );
  };

  const onActionUnshieldERC20s = () => {
    triggerHaptic(HapticSurface.NavigationButton);
    navigation.dispatch(
      CommonActions.navigate("Token", {
        screen: "UnshieldERC20s",
        params: { token },
      })
    );
  };

  const onActionShieldTokens = () => {
    triggerHaptic(HapticSurface.NavigationButton);
    navigation.dispatch(
      CommonActions.navigate("Token", {
        screen: "ShieldToken",
        params: { token },
      })
    );
  };

  const onActionSwapTokens = () => {
    triggerHaptic(HapticSurface.NavigationButton);
    navigation.dispatch(
      CommonActions.navigate("dApps", {
        screen: "Swap",
        params: { navigationToken: token, isRailgun },
      })
    );
  };

  const onActionFarmERC20s = (isRedeem: boolean) => {
    triggerHaptic(HapticSurface.NavigationButton);
    navigation.dispatch(
      CommonActions.navigate("dApps", {
        screen: "FarmVaultInitial",
        params: {
          currentToken: token,
          cookbookFarmRecipeType: isRedeem
            ? CookbookFarmRecipeType.Redeem
            : CookbookFarmRecipeType.Deposit,
        },
      })
    );
  };

  const onActionSendERC20s = () => {
    triggerHaptic(HapticSurface.NavigationButton);
    navigation.dispatch(
      CommonActions.navigate("Token", {
        screen: "SendERC20s",
        params: {
          isRailgun: isRailgun,
          token: token,
        },
      })
    );
  };

  const onActionReceiveTokens = () => {
    triggerHaptic(HapticSurface.NavigationButton);
    navigation.dispatch(
      CommonActions.navigate("Token", {
        screen: "ReceiveToken",
        params: {
          isRailgun: isRailgun,
        },
      })
    );
  };

  const onActionMintTokens = () => {
    triggerHaptic(HapticSurface.NavigationButton);
    navigation.dispatch(
      CommonActions.navigate("Token", {
        screen: "MintTokensConfirm",
        params: {
          tokenAmount: {
            token: MINTABLE_TEST_TOKEN_ROPSTEN,
            amount: 10n ** 21n,
          },
        },
      })
    );
  };

  const onTapOptions = () => {
    triggerHaptic(HapticSurface.NavigationButton);

    const options: OptionWithAction[] = [
      {
        name: "Remove token",
        action: removeToken,
        isDestructive: true,
      },
    ];
    if (!(token.isBaseToken ?? false)) {
      options.unshift({
        name: `Copy ${getTokenDisplayNameShort(
          token,
          wallets.available,
          network.current.name
        )} contract address`,
        action: copyAddress,
      });
    }
    if (showAddTokenButton) {
      options.unshift({
        name: "Add token to wallet",
        action: addToken,
      });
    }
    callActionSheet(showActionSheetWithOptions, "Token options", options);
  };

  const addToken = () => {
    navigation.dispatch(
      CommonActions.navigate("AddTokens", {
        screen: "AddTokensScreen",
        params: {
          initialTokenAddress: token.address,
        },
      })
    );
  };

  const copyAddress = () => {
    triggerHaptic(HapticSurface.ClipboardCopy);
    Clipboard.setString(token.address);
    dispatch(
      showImmediateToast({
        message: `${getTokenDisplayNameShort(
          token,
          wallets.available,
          network.current.name
        )} contract address copied. Paste elsewhere to share.`,
        type: ToastType.Copy,
      })
    );
  };

  const removeToken = () => {
    if (!wallets.active) {
      Alert.alert(
        "Add wallet",
        "Please create or import a wallet to customize your tokens."
      );
      return;
    }
    if (
      !(token.isAddressOnly ?? false) &&
      (token.disableWalletRemoval ?? false)
    ) {
      Alert.alert(
        "Cannot remove token",
        `${token.symbol} is required for this wallet.`
      );
      return;
    }

    triggerHaptic(HapticSurface.DangerButton);
    Alert.alert(
      "Remove this token?",
      "Any balance will be stored. You may add this token back at any time.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove token",
          onPress: finishRemoveToken,
          style: "destructive",
        },
      ]
    );
  };
  const finishRemoveToken = async () => {
    if (!wallets.active) {
      return;
    }

    const walletTokenService = new WalletTokenService(dispatch);
    await walletTokenService.removeTokenFromWallet(
      wallets.active,
      token,
      network.current
    );

    navigation.goBack();
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await pullPrices();
    await pullBalances();
    setRefreshing(false);
  }, [pullBalances, pullPrices]);

  const priceUnknownCallout = () => {
    const frontendConfig = getNetworkFrontendConfig(network.current.name);
    const borderColor = isRailgun ? undefined : frontendConfig.backgroundColor;
    const gradientColors = isRailgun
      ? undefined
      : frontendConfig.gradientColors;

    return (
      <InfoCallout
        type={CalloutType.Help}
        text="Could not find price for this token."
        borderColor={borderColor}
        gradientColors={gradientColors}
      />
    );
  };

  const onCancelTransaction = (
    transaction: SavedTransaction,
    txResponse: TransactionResponse
  ) => {
    navigation.dispatch(
      CommonActions.navigate("Token", {
        screen: "CancelTransactionConfirm",
        params: {
          transaction,
          txResponse,
        },
      })
    );
  };

  return (
    <>
      <AppHeader
        title={getTokenDisplayHeader(
          token,
          wallets.available,
          network.current.name
        )}
        backgroundColor={styleguide.colors.headerBackground}
        isModal={false}
        headerLeft={<HeaderBackButton />}
        headerRight={
          <ButtonIconOnly
            icon={isAndroid() ? "dots-vertical" : "dots-horizontal"}
            onTap={onTapOptions}
            size={24}
            color={styleguide.colors.white}
          />
        }
      />
      <View style={styles.wrapper}>
        <SafeAreaView style={styles.wrapper} edges={["right", "left"]}>
          <ScrollView
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={styleguide.colors.white}
              />
            }
          >
            {showPriceUnknown && priceUnknownCallout()}
            <View style={styles.cardWrapper}>
              <ERC20Card
                token={token}
                tokenPrice={tokenPrice}
                isRailgun={isRailgun}
                balanceBucketFilter={balanceBucketFilter}
                onActionCreateWallet={onActionCreateWallet}
                onActionImportWallet={onActionImportWallet}
                onActionUnshieldERC20s={onActionUnshieldERC20s}
                onActionShieldTokens={onActionShieldTokens}
                onActionSendERC20s={onActionSendERC20s}
                onActionSwapTokens={onActionSwapTokens}
                onActionFarmERC20s={onActionFarmERC20s}
                onActionReceiveTokens={onActionReceiveTokens}
                onActionMintTokens={onActionMintTokens}
              />
            </View>
            <View style={styles.transactionsWrapper}>
              <Text style={styles.transactionsHeaderText}>Transactions</Text>
              <TransactionList
                transactionsMissingTimestamp={[]}
                resyncTransactions={async () => {}}
                transactions={tokenTransactions}
                filteredToken={token}
                onCancelTransaction={onCancelTransaction}
                poiRequired={poiRequired}
              />
            </View>
          </ScrollView>
          {isDefined(errorModal) && <ErrorDetailsModal {...errorModal} />}
        </SafeAreaView>
      </View>
    </>
  );
};
