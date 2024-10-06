import {
  isDefined,
  NFTAmountRecipient,
  RailgunWalletBalanceBucket,
} from "@railgun-community/shared-models";
import React, { useState } from "react";
import { Text, View } from "react-native";
import { ButtonIconOnly } from "@components/buttons/ButtonIconOnly/ButtonIconOnly";
import { useActionSheet } from "@expo/react-native-action-sheet";
import {
  createSerializedERC20AmountRecipients,
  createSerializedNFTAmountRecipients,
  ERC20AmountRecipient,
  formatBalanceBucketStatus,
  formatTransactionTimestamp,
  getERC20AndNFTAmountRecipientsForUnshieldToOrigin,
  getExternalScanSiteName,
  getTransactionPOIStatusColor,
  getTransactionPOIStatusInfoText,
  logDevError,
  NonSpendableTransaction,
  styleguide,
  transactionLinkOnExternalScanSite,
  transactionText,
  useAppDispatch,
  useReduxSelector,
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
import { openInAppBrowserLink } from "@services/util/in-app-browser-service";
import { isAndroid } from "@services/util/platform-os-service";
import { Icon } from "@views/components/icons/Icon";
import { FullScreenSpinner } from "../../../../components/loading/FullScreenSpinner/FullScreenSpinner";
import { SyncProofType } from "../PendingBalancesModal";
import { styles } from "./styles";

type Props = {
  txItem: NonSpendableTransaction;
  isRailgun?: boolean;
  syncProofs: (syncType: SyncProofType) => void;
  navigateUnshieldToOrigin: (
    originalShieldTxid: string,
    erc20AmountRecipients: ERC20AmountRecipient[]
  ) => void;
};

export const PendingBalancesItem: React.FC<Props> = ({
  txItem,
  isRailgun = false,
  syncProofs,
  navigateUnshieldToOrigin,
}) => {
  const dispatch = useAppDispatch();
  const [memoNumberOfLines, setMemoNumberOfLines] =
    useState<Optional<number>>(4);
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");
  const { txidVersion } = useReduxSelector("txidVersion");

  const { showActionSheetWithOptions } = useActionSheet();
  const [isLoading, setIsLoading] = useState(false);
  const [errorModal, setErrorModal] =
    useState<Optional<ErrorDetailsModalProps>>(undefined);

  if (!wallets.active) {
    return null;
  }

  const { transaction, balanceBucket } = txItem;

  const getUnshieldToOriginData = async (): Promise<
    Optional<{
      erc20AmountRecipients: ERC20AmountRecipient[];
      nftAmountRecipients: NFTAmountRecipient[];
    }>
  > => {
    try {
      if (!wallets.active) {
        throw new Error("No active wallet");
      }

      const originalShieldTxid = transaction.id;
      const { erc20AmountRecipients, nftAmountRecipients } =
        await getERC20AndNFTAmountRecipientsForUnshieldToOrigin(
          txidVersion.current,
          network.current.name,
          wallets.active.railWalletID,
          originalShieldTxid
        );

      return {
        erc20AmountRecipients: createSerializedERC20AmountRecipients(
          wallets.active,
          network.current.name,
          erc20AmountRecipients
        ),
        nftAmountRecipients:
          createSerializedNFTAmountRecipients(nftAmountRecipients),
      };
    } catch (cause) {
      const error = new Error("Error getting data to unshield to origin", {
        cause,
      });
      logDevError(error);
      setErrorModal({
        show: true,
        error,
        onDismiss: () => setErrorModal(undefined),
      });
      return undefined;
    }
  };

  const unshieldToOrigin = async () => {
    triggerHaptic(HapticSurface.NavigationButton);

    setIsLoading(true);
    const unshieldToOriginData = await getUnshieldToOriginData();
    setIsLoading(false);
    if (!unshieldToOriginData) {
      return;
    }

    navigateUnshieldToOrigin(
      transaction.id,
      unshieldToOriginData.erc20AmountRecipients
    );
  };

  const showTransactionMenu = () => {
    const scanSiteName = getExternalScanSiteName(network.current.name);
    triggerHaptic(HapticSurface.NavigationButton);

    const options: OptionWithAction[] = [];

    let executeSyncProofs: Optional<() => void>;

    switch (balanceBucket) {
      case RailgunWalletBalanceBucket.ShieldPending:
      case RailgunWalletBalanceBucket.MissingExternalPOI:
      case RailgunWalletBalanceBucket.ProofSubmitted:
        executeSyncProofs = () => syncProofs(SyncProofType.Receive);
        break;
      case RailgunWalletBalanceBucket.MissingInternalPOI:
        executeSyncProofs = () => syncProofs(SyncProofType.Spend);
        break;
      case RailgunWalletBalanceBucket.ShieldBlocked:
      case RailgunWalletBalanceBucket.Spendable:
      case RailgunWalletBalanceBucket.Spent:
        break;
    }

    const shouldAllowUnshieldToOrigin = [
      RailgunWalletBalanceBucket.ShieldPending,
      RailgunWalletBalanceBucket.ShieldBlocked,
    ].includes(balanceBucket);

    if (shouldAllowUnshieldToOrigin) {
      options.push({
        name: "Unshield to origin",
        action: unshieldToOrigin,
      });
    }

    if (isDefined(executeSyncProofs)) {
      options.push({
        name: "Resync proofs",
        action: executeSyncProofs,
      });
    }

    options.push({
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
    });

    callActionSheet(
      showActionSheetWithOptions,
      `Transaction from ${formatTimestampDate()}`,
      options
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

  const poiStatusText = getTransactionPOIStatusInfoText(
    balanceBucket,
    transaction,
    network.current
  );

  return (
    <View style={styles.wrapper}>
      <FullScreenSpinner show={isLoading} />
      <View style={styles.headerRow}>
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: getTransactionPOIStatusColor(balanceBucket) },
            ]}
          />
          <Text style={styles.statusText}>
            {formatBalanceBucketStatus(balanceBucket).toUpperCase()}
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
          undefined
        ).trim()}
      </Text>
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
        </Text>
        {isDefined(poiStatusText) && (
          <View style={styles.poiStatusTextContainer}>
            <Icon
              size={20}
              source="information-outline"
              color={styleguide.colors.textSecondary}
            />
            <Text style={styles.footerText}>{poiStatusText}</Text>
          </View>
        )}
      </View>
      {isDefined(errorModal) && <ErrorDetailsModal {...errorModal} />}
    </View>
  );
};
