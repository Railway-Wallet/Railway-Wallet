import {
  isDefined,
  MerkletreeScanStatus,
  TXIDVersion,
} from "@railgun-community/shared-models";
import React, { useState } from "react";
import {
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TransactionResponse } from "ethers";
import { FloatingHeader } from "@components/headers/FloatingHeader/FloatingHeader";
import { SpinnerCubes } from "@components/loading/SpinnerCubes/SpinnerCubes";
import { TabHeaderText } from "@components/text/TabHeaderText/TabHeaderText";
import { ActivityStackParamList } from "@models/navigation-models";
import { NavigationProp } from "@react-navigation/native";
import {
  generateAllPOIsForWallet,
  getWalletTransactionHistory,
  logDevError,
  MerkletreeType,
  PendingTransactionWatcher,
  RailgunTransactionHistorySync,
  SavedTransaction,
  styleguide,
  syncRailgunTransactionsV2,
  TransactionHistoryStatus,
  useAppDispatch,
  useFilteredNetworkTransactions,
  useFilteredNetworkTransactionsMissingTimestamp,
  usePOIRequiredForCurrentNetwork,
  useReduxSelector,
  useTransactionSearch,
} from "@react-shared";
import {
  ErrorDetailsModal,
  ErrorDetailsModalProps,
} from "@screens/modals/ErrorDetailsModal/ErrorDetailsModal";
import { TransactionList } from "@screens/pages/token-info/ERC20Info/TransactionList/TransactionList";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { calculateFloatingHeaderOpacityFromPageContentOffset } from "../WalletsScreen/WalletFloatingHeader/WalletFloatingHeader";
import { styles } from "./styles";

interface ActivityScreenProps {
  navigation: NavigationProp<ActivityStackParamList, "Activity">;
}

export const ActivityScreen: React.FC<ActivityScreenProps> = ({
  navigation,
}) => {
  StatusBar.setBarStyle("light-content");

  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");
  const { txidVersion } = useReduxSelector("txidVersion");
  const { transactionHistoryStatus } = useReduxSelector(
    "transactionHistoryStatus"
  );
  const { merkletreeHistoryScan } = useReduxSelector("merkletreeHistoryScan");
  const { savedTransactions } = useReduxSelector("savedTransactions");
  const { poiRequired } = usePOIRequiredForCurrentNetwork();

  const [headerOpacity, setHeaderOpacity] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [generatingPOIs, setGeneratingPOIs] = useState<boolean>(false);
  const [errorModal, setErrorModal] =
    useState<Optional<ErrorDetailsModalProps>>(undefined);

  const { networkTransactions, refreshPoiLists } =
    useFilteredNetworkTransactions(poiRequired);
  const { networkTransactionsMissingTimestamp } =
    useFilteredNetworkTransactionsMissingTimestamp();

  const dispatch = useAppDispatch();

  const status =
    transactionHistoryStatus.forNetwork[network.current.name]?.status;
  const utxoMerkletreeScanStatus =
    merkletreeHistoryScan.forNetwork[network.current.name]?.forType[
      MerkletreeType.UTXO
    ]?.status;
  const isScanningMerkletree =
    utxoMerkletreeScanStatus === MerkletreeScanStatus.Started ||
    utxoMerkletreeScanStatus === MerkletreeScanStatus.Updated;

  const searchText = "";
  const isRailgunForTokenInfo = false;
  const { filteredTransactions } = useTransactionSearch(
    networkTransactions,
    isRailgunForTokenInfo,
    searchText
  );

  const insets = useSafeAreaInsets();

  const onPageScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const pageContentOffset = event.nativeEvent.contentOffset.y;
    const opacity =
      calculateFloatingHeaderOpacityFromPageContentOffset(pageContentOffset);
    setHeaderOpacity(opacity);
  };

  const onCancelTransaction = (
    transaction: SavedTransaction,
    txResponse: TransactionResponse
  ) => {
    (navigation as any).navigate("Token", {
      screen: "CancelTransactionConfirm",
      params: {
        transaction,
        txResponse,
      },
    });
  };

  const promptGenerateAllPOIs = () => {
    triggerHaptic(HapticSurface.NavigationButton);
    Alert.alert(
      "Generate Private POI",
      "This action will generate a Private Proof of Innocence for your transaction.",
      [
        {
          text: "Generate",
          onPress: generatePOIs,
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const generatePOIs = async () => {
    if (!wallets.active) return;

    setGeneratingPOIs(true);

    await generateAllPOIsForWallet(
      network.current.name,
      wallets.active.railWalletID
    );

    setGeneratingPOIs(false);

    refreshPoiLists();
  };

  const resyncTransactions = async (fromPullRefresh = false) => {
    if (isRefreshing) {
      return;
    }

    const allNetworkTransactions =
      savedTransactions.forNetwork[network.current.name] ?? [];
    PendingTransactionWatcher.watchPendingTransactions(
      allNetworkTransactions,
      network.current
    );

    if (status === TransactionHistoryStatus.Syncing) {
      return;
    }
    if (fromPullRefresh) {
      setIsRefreshing(true);
    }

    try {
      if (
        txidVersion.current === TXIDVersion.V2_PoseidonMerkle &&
        poiRequired &&
        isDefined(wallets.active)
      ) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        syncRailgunTransactionsV2(network.current.name);
      } else {
        await RailgunTransactionHistorySync.unsafeSyncTransactionHistory(
          dispatch,
          network.current,
          getWalletTransactionHistory
        );
      }
    } catch (cause) {
      const error = new Error("Error syncing transaction history", {
        cause,
      });
      logDevError(error);
      setErrorModal({
        show: true,
        error,
        onDismiss: () => setErrorModal(undefined),
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <>
      <FloatingHeader
        opacity={headerOpacity}
        backgroundColor={styleguide.colors.headerBackground}
        title="Activity"
        isModal={false}
      />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView
          style={styles.scrollView}
          onScroll={onPageScroll}
          scrollEventThrottle={16}
          indicatorStyle={"white"}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing || generatingPOIs}
              onRefresh={() => resyncTransactions(true)}
              tintColor={styleguide.colors.white}
              colors={[styleguide.colors.white]}
            />
          }
        >
          <View style={[styles.titleRow, { opacity: 1 - headerOpacity }]}>
            <TabHeaderText title="Activity" />
          </View>
          <View style={styles.transactionsWrapper}>
            <View style={styles.transactionsHeader}>
              <Text style={styles.transactionsHeaderText}>Transactions</Text>
              {(isScanningMerkletree ||
                status === TransactionHistoryStatus.Syncing) && (
                <SpinnerCubes size={12} style={styles.spinner} />
              )}
            </View>
            <TransactionList
              transactions={filteredTransactions}
              transactionsMissingTimestamp={networkTransactionsMissingTimestamp}
              resyncTransactions={resyncTransactions}
              onCancelTransaction={onCancelTransaction}
              generatePOIs={promptGenerateAllPOIs}
              refreshPOILists={refreshPoiLists}
              poiRequired={poiRequired}
            />
          </View>
        </ScrollView>
        {isDefined(errorModal) && <ErrorDetailsModal {...errorModal} />}
      </View>
    </>
  );
};
