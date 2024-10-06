import {
  isDefined,
  Network,
  RailgunWalletBalanceBucket,
  TXIDVersion,
} from "@railgun-community/shared-models";
import React, { useEffect, useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StatusBar,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AlertProps,
  GenericAlert,
} from "@components/alerts/GenericAlert/GenericAlert";
import { FullScreenSpinner } from "@components/loading/FullScreenSpinner/FullScreenSpinner";
import { TabHeaderText } from "@components/text/TabHeaderText/TabHeaderText";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useSetPinWarning } from "@hooks/alerts/useSetPinWarning";
import { useDisableBackGesture } from "@hooks/navigation/useDisableBackGesture";
import { useSetActiveWallet } from "@hooks/useSetActiveWallet";
import {
  TokenStackParamList,
  WalletsStackParamList,
} from "@models/navigation-models";
import { CommonActions, NavigationProp } from "@react-navigation/native";
import {
  ERC20AmountRecipient,
  ERC20Token,
  FrontendWallet,
  getSupportedNetworks,
  logDevError,
  MINTABLE_TEST_TOKEN_ROPSTEN,
  NetworkService,
  refreshRailgunBalances,
  setDiscreetMode,
  setTempNotification,
  SharedConstants,
  showImmediateToast,
  StorageService,
  syncRailgunTransactionsV2,
  useAppDispatch,
  useBalancePriceRefresh,
  usePendingBalancePriceLabel,
  usePOIRequiredForCurrentNetwork,
  useReduxSelector,
  useTempNotification,
} from "@react-shared";
import {
  ErrorDetailsModal,
  ErrorDetailsModalProps,
} from "@screens/modals/ErrorDetailsModal/ErrorDetailsModal";
import { SelectWalletModal } from "@screens/modals/SelectWalletModal/SelectWalletModal";
import { callActionSheet } from "@services/util/action-sheet-options-service";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { PendingBalancesModal } from "@views/screens/modals/POIBalanceBucketModal/PendingBalancesModal";
import { RPCsSetUpModal } from "@views/screens/modals/RPCsSetUpModal/RPCsSetUpModal";
import { ERC20TokenList } from "./ERC20TokenList/ERC20TokenList";
import { POIPendingBalanceCallout } from "./POIPendingBalanceCallout/POIPendingBalanceCallout";
import { WalletCardSlides } from "./WalletCardSlides/WalletCardSlides";
import {
  calculateFloatingHeaderOpacityFromPageContentOffset,
  WalletFloatingHeader,
} from "./WalletFloatingHeader/WalletFloatingHeader";
import { WalletInfoCallout } from "./WalletInfoCallout/WalletInfoCallout";
import { WalletNetworkSelector } from "./WalletNetworkSelector/WalletNetworkSelector";
import { WalletSwirlBackground } from "./WalletSwirlBackground/WalletSwirlBackground";
import { styles } from "./styles";

interface WalletsScreenProps {
  navigation: NavigationProp<WalletsStackParamList, "Wallets">;
}

export const WalletsScreen: React.FC<WalletsScreenProps> = ({ navigation }) => {
  StatusBar.setBarStyle("light-content");

  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");
  const { txidVersion } = useReduxSelector("txidVersion");
  const { tempNotification } = useReduxSelector("tempNotification");
  const { setActiveWallet, isLoading } = useSetActiveWallet();
  const { poiRequired } = usePOIRequiredForCurrentNetwork();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRailgun, setIsRailgun] = useState(true);
  const [balanceBucketFilter] = useState<RailgunWalletBalanceBucket[]>([
    RailgunWalletBalanceBucket.Spendable,
  ]);
  const [showPendingBalancesModal, setShowPendingBalancesModal] =
    useState(false);
  const [showRPCsSetUpModal, setShowRPCsSetUpModal] = useState(false);
  const [headerOpacity, setHeaderOpacity] = useState(0);
  const [showLoadingNetworkPublicName, setShowLoadingNetworkPublicName] =
    useState<Optional<string>>();
  const [showWalletSelectorModal, setShowWalletSelectorModal] = useState(false);
  const [alert, setAlert] = useState<AlertProps>({});
  const [errorModal, setErrorModal] =
    useState<Optional<ErrorDetailsModalProps>>(undefined);

  const dispatch = useAppDispatch();
  const { showActionSheetWithOptions } = useActionSheet();
  useTempNotification();
  const { pendingBalancePriceLabel } = usePendingBalancePriceLabel(isRailgun);
  useDisableBackGesture(dispatch);
  const { pullPrices, pullBalances } = useBalancePriceRefresh(
    refreshRailgunBalances,
    (error: Error) =>
      setErrorModal({
        show: true,
        error,
        onDismiss: () => setErrorModal(undefined),
      })
  );

  const requireFunds = true;
  const { createPinModal } = useSetPinWarning(requireFunds);

  const scrollViewRef = useRef<ScrollView | null>(null);

  const isRailgunOverride =
    wallets.active?.isViewOnlyWallet ?? false ? true : isRailgun;

  const currentTempNotification = tempNotification.current;

  useEffect(() => {
    const checkShouldShowSetRPCsSetUpModal = async () => {
      const rpcSetUpKey =
        SharedConstants.HAS_SEEN_RPC_SET_UP + "_" + network.current.name;
      const hasSeen = await StorageService.getItem(rpcSetUpKey);
      if (!isDefined(hasSeen)) {
        setShowRPCsSetUpModal(true);
        await StorageService.setItem(rpcSetUpKey, "1");
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    checkShouldShowSetRPCsSetUpModal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network.current.name]);

  useEffect(() => {
    if (currentTempNotification) {
      setAlert({
        show: true,
        title: currentTempNotification.title,
        message: currentTempNotification.text,
        onSubmit: () => {
          setAlert({});
        },
      });
      dispatch(setTempNotification(undefined));
    }
  }, [currentTempNotification, dispatch]);

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
        params: {},
      })
    );
  };

  const onActionShieldTokens = () => {
    triggerHaptic(HapticSurface.NavigationButton);

    navigation.dispatch(
      CommonActions.navigate("Token", {
        screen: "ShieldToken",
        params: {},
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

  const onActionSendERC20s = () => {
    triggerHaptic(HapticSurface.NavigationButton);

    navigation.dispatch(
      CommonActions.navigate("Token", {
        screen: "SendERC20s",
        params: {
          isRailgun: isRailgunOverride,
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
          isRailgun: isRailgunOverride,
        },
      })
    );
  };

  const onAddToken = () => {
    triggerHaptic(HapticSurface.NavigationButton);

    if ([...wallets.available, ...wallets.viewOnly].length === 0) {
      dispatch(
        showImmediateToast({ message: "Please create a wallet first." })
      );
      return;
    }
    if (!wallets.active) {
      dispatch(
        showImmediateToast({ message: "Please select an active wallet." })
      );
      return;
    }

    navigation.dispatch(CommonActions.navigate("AddTokens"));
  };

  const onEnableDiscreetMode = () => {
    dispatch(setDiscreetMode(true));
  };

  const onDisableDiscreetMode = () => {
    dispatch(setDiscreetMode(false));
  };

  const onSelectToken = (token: ERC20Token) => {
    triggerHaptic(HapticSurface.NavigationButton);

    navigation.navigate("TokenInfo", {
      token,
      isRailgun: isRailgunOverride,
      balanceBucketFilter,
    });
  };

  const onWalletBecameActive = (newIsRailgun: boolean) => {
    triggerHaptic(HapticSurface.CardSwipe);
    setIsRailgun(newIsRailgun);
  };

  const onPageScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const pageContentOffset = event.nativeEvent.contentOffset.y;
    const opacity =
      calculateFloatingHeaderOpacityFromPageContentOffset(pageContentOffset);

    setHeaderOpacity(opacity);
  };

  const selectActiveWallet = (wallet?: FrontendWallet) => {
    setShowWalletSelectorModal(false);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    setActiveWallet(wallet);
  };

  const onRefresh = async () => {
    if (isRefreshing) {
      return;
    }
    setIsRefreshing(true);
    await pullPrices();
    await pullBalances();
    setIsRefreshing(false);

    if (
      txidVersion.current === TXIDVersion.V2_PoseidonMerkle &&
      isDefined(wallets.active)
    ) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      syncRailgunTransactionsV2(network.current.name);
    }
  };

  const navigateUnshieldToOrigin = (
    originalShieldTxid: string,
    erc20AmountRecipients: ERC20AmountRecipient[]
  ) => {
    setShowPendingBalancesModal(false);
    const params: TokenStackParamList["UnshieldERC20sConfirm"] = {
      erc20AmountRecipients: erc20AmountRecipients,
      isBaseTokenUnshield: false,
      nftAmountRecipients: [],
      balanceBucketFilter: balanceBucketFilter,
      unshieldToOriginShieldTxid: originalShieldTxid,
    };
    navigation.dispatch(
      CommonActions.navigate("Token", {
        screen: "UnshieldERC20sConfirm",
        params,
      })
    );
  };

  return (
    <>
      {createPinModal}
      <WalletFloatingHeader
        opacity={headerOpacity}
        onTapNetworkSelector={onTapNetworkSelector}
        onTapWallets={() => {
          triggerHaptic(HapticSurface.NavigationButton);
          setShowWalletSelectorModal(true);
        }}
      />
      <SelectWalletModal
        show={showWalletSelectorModal}
        closeModal={() => {
          setShowWalletSelectorModal(false);
        }}
        title="Select active wallet"
        isRailgunInitial={isRailgun}
        selectedWallet={wallets.active}
        onDismiss={selectActiveWallet}
      />
      <SafeAreaView style={styles.tabWrapper} edges={["right", "top", "left"]}>
        <WalletSwirlBackground animate={isRefreshing} />
        <ScrollView
          style={styles.scrollView}
          onScroll={onPageScroll}
          scrollEventThrottle={16}
          ref={scrollViewRef}
        >
          <View style={[styles.titleRow, { opacity: 1 - headerOpacity }]}>
            <TabHeaderText
              title="Wallets"
              onPress={() => {
                triggerHaptic(HapticSurface.NavigationButton);
                setShowWalletSelectorModal(true);
              }}
            />
            <WalletNetworkSelector onTap={onTapNetworkSelector} />
          </View>
          <WalletInfoCallout balanceBucketFilter={balanceBucketFilter} />
          <WalletCardSlides
            isRailgun={isRailgun}
            balanceBucketFilter={balanceBucketFilter}
            onActionCreateWallet={onActionCreateWallet}
            onActionImportWallet={onActionImportWallet}
            onActionUnshieldERC20s={onActionUnshieldERC20s}
            onActionShieldTokens={onActionShieldTokens}
            onActionSendERC20s={onActionSendERC20s}
            onActionReceiveTokens={onActionReceiveTokens}
            onActionMintTokens={onActionMintTokens}
            onWalletBecameActive={onWalletBecameActive}
          />
          {isRailgun && poiRequired && isDefined(pendingBalancePriceLabel) && (
            <POIPendingBalanceCallout
              onPress={() => {
                triggerHaptic(HapticSurface.NavigationButton);
                setShowPendingBalancesModal(true);
              }}
            />
          )}
          <ERC20TokenList
            isRefreshing={isRefreshing}
            onRefresh={onRefresh}
            onAddToken={onAddToken}
            onSelectToken={onSelectToken}
            onEnableDiscreetMode={onEnableDiscreetMode}
            onDisableDiscreetMode={onDisableDiscreetMode}
            isRailgun={isRailgunOverride}
            balanceBucketFilter={balanceBucketFilter}
          />
        </ScrollView>
      </SafeAreaView>
      {poiRequired && (
        <PendingBalancesModal
          show={showPendingBalancesModal}
          onDismiss={() => {
            setShowPendingBalancesModal(false);
          }}
          navigateUnshieldToOrigin={navigateUnshieldToOrigin}
        />
      )}
      <FullScreenSpinner show={isLoading} text="Updating active wallet..." />
      <FullScreenSpinner
        show={isDefined(showLoadingNetworkPublicName)}
        text={
          isDefined(showLoadingNetworkPublicName)
            ? `Loading ${showLoadingNetworkPublicName} and scanning new transactions`
            : ""
        }
      />
      <GenericAlert {...alert} />
      {isDefined(errorModal) && <ErrorDetailsModal {...errorModal} />}
      {showRPCsSetUpModal && (
        <RPCsSetUpModal
          selectedNetwork={network.current}
          onClose={() => setShowRPCsSetUpModal(false)}
        />
      )}
    </>
  );
};
