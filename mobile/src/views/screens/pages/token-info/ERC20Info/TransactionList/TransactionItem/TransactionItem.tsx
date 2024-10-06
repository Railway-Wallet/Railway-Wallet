import {
  isDefined,
  RailgunWalletBalanceBucket,
} from "@railgun-community/shared-models";
import React, { useState } from "react";
import { Alert, Text, View } from "react-native";
import { TransactionResponse } from "ethers";
import { ButtonIconOnly } from "@components/buttons/ButtonIconOnly/ButtonIconOnly";
import { useActionSheet } from "@expo/react-native-action-sheet";
import Clipboard from "@react-native-clipboard/clipboard";
import { CommonActions, useNavigation } from "@react-navigation/native";
import {
  BlockedBroadcasterService,
  broadcasterFeeTransactionText,
  canCancelTransaction,
  canMarkAsFailedTransaction,
  compareTokens,
  ERC20AmountRecipient,
  ERC20Token,
  formatTransactionTimestamp,
  getDistinctERC20Tokens,
  getExternalScanSiteName,
  isNonSpendableBucket,
  ProviderService,
  railgunFeeTransactionText,
  SavedTransaction,
  SavedTransactionStore,
  shortenTokenAddress,
  shortenWalletAddress,
  showImmediateToast,
  styleguide,
  ToastType,
  transactionLinkOnExternalScanSite,
  TransactionStatus,
  transactionStatusIconColor,
  transactionSyncedHistoryDescription,
  transactionText,
  transactionTitle,
  txidVersionTransactionText,
  useAddedTokenSearch,
  useAppDispatch,
  useReduxSelector,
} from "@react-shared";
import {
  callActionSheet,
  OptionWithAction,
} from "@services/util/action-sheet-options-service";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { openInAppBrowserLink } from "@services/util/in-app-browser-service";
import { isAndroid } from "@services/util/platform-os-service";
import { PendingBalancesModal } from "@views/screens/modals/POIBalanceBucketModal/PendingBalancesModal";
import { TokenStackParamList } from "../../../../../../../models/navigation-models";
import { styles } from "./styles";

type Props = {
  transaction: SavedTransaction;
  filteredToken?: ERC20Token;
  isRailgun?: boolean;
  onCancelTransaction: (
    transaction: SavedTransaction,
    txResponse: TransactionResponse
  ) => void;
  generatePOIs?: () => void;
  refreshPOILists?: () => void;
  poiRequired: boolean;
};

export const TransactionItem: React.FC<Props> = ({
  transaction,
  filteredToken,
  isRailgun = false,
  onCancelTransaction,
  generatePOIs,
  refreshPOILists,
  poiRequired,
}) => {
  const [memoNumberOfLines, setMemoNumberOfLines] =
    useState<Optional<number>>(4);
  const [showPendingBalancesModal, setShowPendingBalancesModal] =
    useState(false);
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");
  const { broadcasterBlocklist } = useReduxSelector("broadcasterBlocklist");

  const { showActionSheetWithOptions } = useActionSheet();

  const dispatch = useAppDispatch();

  const { tokens } = useAddedTokenSearch();
  const navigation = useNavigation();

  if (!wallets.active) {
    return null;
  }

  const cancelTransaction = async () => {
    const provider = await ProviderService.getProvider(network.current.name);
    const txResponse = await provider.getTransaction(transaction.id);

    if (!txResponse) {
      Alert.alert(
        "Cannot cancel",
        `Unable to find transaction with hash ${transaction.id}. Mark this transaction as failed?\n\nWarning: If you submitted this transaction recently, it may take up to 30 minutes to appear on the blockchain.`,
        [
          {
            text: "Mark as Failed",
            onPress: markAsFailed,
            style: "destructive",
          },
          {
            text: "Do nothing",
          },
        ]
      );
      return;
    }

    onCancelTransaction(transaction, txResponse);
  };

  const markAsFailedTransaction = () => {
    Alert.alert(
      "WARNING",
      `Please note that this action will not cancel the pending transaction, which may still complete. This action will remove the badge notification on the Activity tab, and set this transaction's status as FAILED.`,
      [
        {
          text: "Mark as Failed",
          onPress: markAsFailed,
          style: "destructive",
        },
        {
          text: "Do nothing",
        },
      ]
    );
  };

  const markAsFailed = async () => {
    const savedTransactionStore = new SavedTransactionStore(dispatch);
    await savedTransactionStore.updateTransactionAsFailed(
      transaction.id,
      network.current.name,
      transaction.walletAddress,
      undefined
    );
  };

  const blockBroadcaster = async (pubKey?: string) => {
    if (isDefined(pubKey)) {
      const blockedBroadcasterService = new BlockedBroadcasterService(dispatch);
      await blockedBroadcasterService.addBlockedBroadcaster(pubKey, undefined);

      Alert.alert("Public broadcaster added to block list.");
    }
  };

  const openPendingBalances = () => {
    setShowPendingBalancesModal(true);
  };

  const isReceivedPOIPending =
    isDefined(transaction.balanceBucket) &&
    isNonSpendableBucket(transaction.balanceBucket);

  const isSpentPOIPending = transaction.pendingSpentPOI ?? false;

  const showTransactionMenu = () => {
    const scanSiteName = getExternalScanSiteName(network.current.name);
    triggerHaptic(HapticSurface.NavigationButton);

    const options: OptionWithAction[] = [
      {
        name: `View on ${scanSiteName}`,
        action: async () => {
          const link = transactionLinkOnExternalScanSite(
            network.current.name,
            transaction.id
          );
          if (isDefined(link)) {
            await openInAppBrowserLink(link, dispatch);
          }
        },
      },
      {
        name: `Copy transaction hash`,
        action: () => {
          Clipboard.setString(transaction.id);
          triggerHaptic(HapticSurface.ClipboardCopy);
          dispatch(
            showImmediateToast({
              message: `${shortenWalletAddress(
                transaction.id
              )} copied to clipboard`,
              type: ToastType.Copy,
            })
          );
        },
      },
    ];

    let unknownERC20Tokens: ERC20Token[] = [];

    transaction.tokenAmounts.forEach((amount) => {
      const { token } = amount;
      if (token.isAddressOnly ?? false) {
        unknownERC20Tokens.push(token);
      }
    });

    transaction.syncedReceiveTokenAmounts?.forEach((amount) => {
      const { token } = amount;
      if (token.isAddressOnly ?? false) {
        unknownERC20Tokens.push(token);
      }
    });

    const uniqueUnknownERC20Tokens: ERC20Token[] =
      getDistinctERC20Tokens(unknownERC20Tokens);

    uniqueUnknownERC20Tokens.forEach((token) => {
      let tokenAdded = false;
      for (const addedToken of tokens) {
        const match = compareTokens(addedToken, token);
        if (match) {
          tokenAdded = true;
          break;
        }
      }

      if (!tokenAdded) {
        options.push({
          name: `Add token to wallet: ${shortenTokenAddress(token.address)}`,
          action: () => {
            navigation.dispatch(
              CommonActions.navigate("AddTokens", {
                screen: "AddTokensScreen",
                params: {
                  initialTokenAddress: token.address,
                },
              })
            );
          },
        });
      }
    });

    if (
      isDefined(transaction.syncedHistoryVersion) &&
      transaction.syncedHistoryVersion !== 0
    ) {
      options.push({
        name: `About v${transaction.syncedHistoryVersion} RAILGUN history`,
        action: showSyncedHistoryDescriptionPopup,
      });
    }
    if (canCancelTransaction(transaction)) {
      options.push({
        name: "Cancel transaction",
        action: cancelTransaction,
        isDestructive: true,
      });
    }
    if (canMarkAsFailedTransaction(transaction)) {
      options.push({
        name: "Mark as failed",
        action: markAsFailedTransaction,
        isDestructive: true,
      });
    }

    if (
      transaction.status === TransactionStatus.failed &&
      isDefined(transaction.broadcasterRailgunAddress) &&
      !BlockedBroadcasterService.isBroadcasterBlocked(
        transaction.broadcasterRailgunAddress,
        broadcasterBlocklist.broadcasters
      )
    ) {
      options.push({
        name: "Block this public broadcaster",
        action: () => blockBroadcaster(transaction.broadcasterRailgunAddress),
      });
    }

    if (poiRequired) {
      if (isReceivedPOIPending) {
        options.push({
          name: "View pending balances",
          action: openPendingBalances,
        });

        if (isDefined(refreshPOILists)) {
          options.push({
            name: "Resync proofs",
            action: refreshPOILists,
          });
        }
      }

      if (isSpentPOIPending && isDefined(generatePOIs)) {
        options.push({
          name: "Generate Proof",
          action: generatePOIs,
        });
      }
    }

    callActionSheet(
      showActionSheetWithOptions,
      `Transaction from ${formatTimestampDate()}`,
      options
    );
  };

  const showSyncedHistoryDescriptionPopup = () => {
    const description = transactionSyncedHistoryDescription(transaction);
    if (!isDefined(description)) {
      return;
    }
    Alert.alert(
      `On-chain history v${transaction.syncedHistoryVersion}`,
      description
    );
  };

  const formatTimestampDate = () => {
    const date = new Date(transaction.timestamp * 1000);
    return date.toLocaleString();
  };

  const toggleShowFullMemo = () => {
    triggerHaptic(HapticSurface.SelectItem);
    if (memoNumberOfLines === 4) {
      setMemoNumberOfLines(undefined);
    } else {
      setMemoNumberOfLines(4);
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
      balanceBucketFilter: [RailgunWalletBalanceBucket.Spendable],
      unshieldToOriginShieldTxid: originalShieldTxid,
    };
    navigation.dispatch(
      CommonActions.navigate("Token", {
        screen: "UnshieldERC20sConfirm",
        params,
      })
    );
  };

  const railgunFee = railgunFeeTransactionText(
    transaction,
    wallets.available,
    filteredToken
  );
  const broadcasterFee = broadcasterFeeTransactionText(
    transaction,
    wallets.active,
    wallets.available
  );

  const txidVersionText = txidVersionTransactionText(transaction);

  return (
    <>
      <View
        style={[
          styles.wrapper,
          isReceivedPOIPending || isSpentPOIPending
            ? styles.wrapperDisabled
            : {},
        ]}
      >
        <View style={styles.headerRow}>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: transactionStatusIconColor(transaction) },
              ]}
            />
            <Text style={styles.statusText}>
              {transactionTitle(transaction)}
            </Text>
          </View>
          <ButtonIconOnly
            icon={isAndroid() ? "dots-vertical" : "dots-horizontal"}
            onTap={showTransactionMenu}
            size={24}
            color={styleguide.colors.white}
          />
        </View>
        <Text style={styles.transactionText}>
          {transactionText(
            transaction,
            isRailgun,
            network.current,
            wallets.active,
            wallets.available,
            filteredToken
          ).trim()}
        </Text>
        {isDefined(railgunFee) && (
          <Text style={styles.feeText}>{railgunFee}</Text>
        )}
        {isDefined(broadcasterFee) && (
          <Text style={styles.feeText}>{broadcasterFee}</Text>
        )}
        {isDefined(transaction.memoText) && (
          <Text
            style={styles.memoText}
            numberOfLines={memoNumberOfLines}
            onPress={toggleShowFullMemo}
          >
            "{transaction.memoText.trim()}"
          </Text>
        )}
        {isDefined(transaction.failedErrorMessage) && (
          <Text style={styles.failedErrorText}>
            Error: "{transaction.failedErrorMessage}"
          </Text>
        )}
        <View style={styles.footerWrapper}>
          <Text style={styles.footerText}>
            {formatTransactionTimestamp(transaction.timestamp)}
            {isDefined(txidVersionText) ? ` • ${txidVersionText}` : null}
            {isDefined(transaction.nonce)
              ? ` • Nonce ${transaction.nonce}`
              : null}
            {transaction.sentViaBroadcaster &&
            !(transaction.syncedFromRailgun ?? false)
              ? ` • Sent via public broadcaster`
              : null}
            {transaction.syncedFromRailgun ?? false
              ? ` • Synced from encrypted on-chain history`
              : null}
            {transaction.sentViaBroadcaster &&
            !(transaction.syncedFromRailgun ?? false) &&
            !(transaction.foundBySync ?? false)
              ? ` • Not yet synced to RAILGUN balance`
              : null}
          </Text>
          {poiRequired && isReceivedPOIPending && (
            <Text
              style={[styles.footerText, styles.pendingBalancesButton]}
              onPress={openPendingBalances}
            >
              {"View pending balances"}
            </Text>
          )}
        </View>
      </View>
      {poiRequired && (
        <PendingBalancesModal
          show={showPendingBalancesModal}
          onDismiss={() => {
            setShowPendingBalancesModal(false);
          }}
          initialBalanceBucket={transaction.balanceBucket}
          navigateUnshieldToOrigin={navigateUnshieldToOrigin}
        />
      )}
    </>
  );
};
