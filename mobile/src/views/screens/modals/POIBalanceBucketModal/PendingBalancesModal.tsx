import {
  isDefined,
  RailgunWalletBalanceBucket,
} from "@railgun-community/shared-models";
import React, { useEffect, useRef, useState } from "react";
import { Button, FlatList, Modal, Text, View } from "react-native";
import {
  AlertProps,
  GenericAlert,
} from "@components/alerts/GenericAlert/GenericAlert";
import { AppHeader } from "@components/headers/AppHeader/AppHeader";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import {
  ERC20AmountRecipient,
  getPOIBalancesDisclaimerMessage,
  getWalletTransactionHistory,
  NonSpendableTransaction,
  RailgunTransactionHistoryService,
  refreshReceivePOIsForWallet,
  refreshSpentPOIsForWallet,
  styleguide,
  useAppDispatch,
  useReduxSelector,
} from "@react-shared";
import { createPOIDisclaimerAlert } from "@utils/alerts";
import { SpinnerCubes } from "@views/components/loading/SpinnerCubes/SpinnerCubes";
import { PendingBalancesTabs } from "./Tabs/PendingBalancesTabs";
import { PendingBalancesItem } from "./TxItem/PendingBalancesItem";
import { styles } from "./styles";

export enum PendingBalancesModalTabOption {
  Pending = "Pending",
  Incomplete = "Incomplete",
  Restricted = "Restricted",
}

export enum SyncProofType {
  Spend = "Spend",
  Receive = "Receive",
}

type Props = {
  show: boolean;
  onDismiss: () => void;
  navigateUnshieldToOrigin: (
    originalShieldTxid: string,
    erc20AmountRecipients: ERC20AmountRecipient[]
  ) => void;
  initialBalanceBucket?: RailgunWalletBalanceBucket;
};

export const PendingBalancesModal: React.FC<Props> = ({
  show,
  onDismiss,
  navigateUnshieldToOrigin,
  initialBalanceBucket,
}) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");
  const { txidVersion } = useReduxSelector("txidVersion");
  const { remoteConfig } = useReduxSelector("remoteConfig");

  const [alert, setAlert] = useState<AlertProps | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<PendingBalancesModalTabOption>(
    PendingBalancesModalTabOption.Pending
  );
  const [showRestrictedTab, setShowRestrictedTab] = useState<boolean>(false);
  const [allTxItems, setAllTxItems] = useState<NonSpendableTransaction[]>([]);
  const isInitialLoadRef = useRef<boolean>(true);

  const dispatch = useAppDispatch();

  const currentNetwork = network.current;
  const currentWallet = wallets.active;

  useEffect(() => {
    if (isDefined(initialBalanceBucket)) {
      switch (initialBalanceBucket) {
        case RailgunWalletBalanceBucket.ShieldPending:
        case RailgunWalletBalanceBucket.ProofSubmitted:
          setSelectedTab(PendingBalancesModalTabOption.Pending);
          break;
        case RailgunWalletBalanceBucket.MissingExternalPOI:
        case RailgunWalletBalanceBucket.MissingInternalPOI:
          setSelectedTab(PendingBalancesModalTabOption.Incomplete);
          break;
        case RailgunWalletBalanceBucket.ShieldBlocked:
          setSelectedTab(PendingBalancesModalTabOption.Restricted);
          break;
        case RailgunWalletBalanceBucket.Spendable:
        case RailgunWalletBalanceBucket.Spent:
          break;
      }
    }
  }, [initialBalanceBucket]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchNonPOITransactionItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentNetwork, currentWallet, show]);

  const fetchNonPOITransactionItems = async () => {
    setAllTxItems([]);
    if (!isDefined(currentWallet)) return;

    setIsLoading(true);
    const txHistoryService = new RailgunTransactionHistoryService(dispatch);
    const railgunTransactions = await getWalletTransactionHistory(
      currentNetwork.chain,
      currentWallet.railWalletID,
      0
    );
    const txItems = await txHistoryService.getNonPOITransactions(
      currentNetwork.name,
      currentWallet,
      wallets.available,
      railgunTransactions
    );

    const hasRestrictedTransactions = txItems.some(
      (txItem) =>
        txItem.balanceBucket === RailgunWalletBalanceBucket.ShieldBlocked
    );
    setShowRestrictedTab(hasRestrictedTransactions);

    if (
      isInitialLoadRef.current &&
      !isDefined(initialBalanceBucket) &&
      txItems.length > 0
    ) {
      const firstNonSpendableTxItem = txItems[0];
      switch (firstNonSpendableTxItem.balanceBucket) {
        case RailgunWalletBalanceBucket.ShieldPending:
        case RailgunWalletBalanceBucket.ProofSubmitted:
          setSelectedTab(PendingBalancesModalTabOption.Pending);
          break;
        case RailgunWalletBalanceBucket.MissingExternalPOI:
        case RailgunWalletBalanceBucket.MissingInternalPOI:
          setSelectedTab(PendingBalancesModalTabOption.Incomplete);
          break;
        case RailgunWalletBalanceBucket.ShieldBlocked:
          setSelectedTab(PendingBalancesModalTabOption.Restricted);
          break;
        case RailgunWalletBalanceBucket.Spendable:
        case RailgunWalletBalanceBucket.Spent:
          break;
      }
    }
    isInitialLoadRef.current = false;

    setAllTxItems(txItems);
    setIsLoading(false);
  };

  const syncProofs = async (syncProofType: SyncProofType) => {
    if (!currentWallet) return;

    setIsLoading(true);
    if (syncProofType === SyncProofType.Spend) {
      await refreshReceivePOIsForWallet(
        txidVersion.current,
        currentNetwork.name,
        currentWallet?.railWalletID
      );
    } else {
      await refreshSpentPOIsForWallet(
        txidVersion.current,
        currentNetwork.name,
        currentWallet?.railWalletID,
        undefined
      );
    }

    await fetchNonPOITransactionItems();
  };

  const filteredTxItems: NonSpendableTransaction[] = allTxItems.filter(
    (txItem) => {
      switch (selectedTab) {
        case PendingBalancesModalTabOption.Pending:
          return (
            txItem.balanceBucket === RailgunWalletBalanceBucket.ShieldPending ||
            txItem.balanceBucket === RailgunWalletBalanceBucket.ProofSubmitted
          );
        case PendingBalancesModalTabOption.Incomplete:
          return (
            txItem.balanceBucket ===
              RailgunWalletBalanceBucket.MissingExternalPOI ||
            txItem.balanceBucket ===
              RailgunWalletBalanceBucket.MissingInternalPOI
          );
        case PendingBalancesModalTabOption.Restricted:
          return (
            txItem.balanceBucket === RailgunWalletBalanceBucket.ShieldBlocked
          );
      }
    }
  );

  return (
    <Modal animationType="slide" presentationStyle="formSheet" visible={show}>
      <ActionSheetProvider>
        <>
          <View style={styles.wrapper}>
            <AppHeader
              isModal
              title="Pending balances"
              headerStatusBarHeight={16}
              backgroundColor={styleguide.colors.black}
              headerRight={
                <Button
                  title="Info"
                  onPress={() => {
                    createPOIDisclaimerAlert(
                      "About Pending Balances",
                      getPOIBalancesDisclaimerMessage(),
                      setAlert,
                      dispatch,
                      remoteConfig?.current?.poiDocumentation,
                      undefined,
                      "Okay"
                    );
                  }}
                />
              }
              headerLeft={
                <Button
                  title="Close"
                  onPress={() => {
                    onDismiss();
                  }}
                />
              }
            />
            <PendingBalancesTabs
              selectedTab={selectedTab}
              setSelectedTab={setSelectedTab}
              showRestrictedTab={showRestrictedTab}
            />
            {isLoading && (
              <View style={styles.loadingContainer}>
                <SpinnerCubes size={64} />
              </View>
            )}
            {!isLoading && (
              <View style={styles.itemList}>
                {filteredTxItems.length === 0 && (
                  <Text style={styles.noTxItem}>
                    No {selectedTab.toLowerCase()} transactions.
                  </Text>
                )}
                <FlatList
                  style={styles.itemList}
                  contentContainerStyle={styles.itemListContentContainer}
                  data={filteredTxItems}
                  keyExtractor={(
                    _item: NonSpendableTransaction,
                    index: number
                  ) => String(index)}
                  renderItem={({ item }: { item: NonSpendableTransaction }) => {
                    return (
                      <PendingBalancesItem
                        txItem={item}
                        syncProofs={syncProofs}
                        navigateUnshieldToOrigin={navigateUnshieldToOrigin}
                      />
                    );
                  }}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            )}
          </View>
          <GenericAlert {...alert} />
        </>
      </ActionSheetProvider>
    </Modal>
  );
};
