import {
  isDefined,
  NetworkName,
  NFTAmountRecipient,
  RailgunWalletBalanceBucket,
  SelectedBroadcaster,
  TransactionGasDetails,
  TXIDVersion,
} from "@railgun-community/shared-models";
import React, { useRef } from "react";
import { Text } from "react-native";
import { ReviewTransactionView } from "@components/views/ReviewTransactionView/ReviewTransactionView";
import { TokenStackParamList } from "@models/navigation-models";
import { StackActions } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  AdjustedERC20AmountRecipientGroup,
  AvailableWallet,
  baseTokenForWallet,
  delay,
  ERC20Amount,
  ERC20AmountRecipient,
  executeERC20Transfer,
  getERC20TransferGasEstimate,
  SavedTransactionService,
  TransactionType,
  useAppDispatch,
  useReduxSelector,
} from "@react-shared";
import { WalletSecureServiceReactNative } from "@services/wallet/wallet-secure-service-react-native";

type Props = NativeStackScreenProps<
  TokenStackParamList,
  "CancelTransactionConfirm"
> & {};

export const CancelTransactionConfirm: React.FC<Props> = ({
  navigation,
  route,
}) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");

  const { transaction, txResponse } = route.params;
  const dispatch = useAppDispatch();

  const nftAmountRecipientsRef = useRef<NFTAmountRecipient[]>([]);

  const transactionType = TransactionType.Cancel;

  const gasToken = baseTokenForWallet(network.current.name, wallets.active);

  if (!gasToken) {
    return null;
  }
  if (!isDefined(txResponse)) {
    return (
      // eslint-disable-next-line react-native/no-inline-styles
      <Text style={{ margin: 24 }}>
        Nothing to cancel. Transaction not found.
      </Text>
    );
  }

  const tokenAmount: ERC20Amount = {
    token: gasToken,
    amountString: "0",
  };

  const toWalletAddress = transaction.publicExecutionWalletAddress;
  if (!isDefined(toWalletAddress)) {
    return null;
  }

  const activeWallet = wallets.active;
  if (!activeWallet || activeWallet.isViewOnlyWallet) {
    return null;
  }

  if (toWalletAddress !== activeWallet.ethAddress) {
    return (
      // eslint-disable-next-line react-native/no-inline-styles
      <Text style={{ margin: 24 }}>
        Must cancel with public wallet active: {toWalletAddress}. This is
        currently not possible in Railway wallet.
      </Text>
    );
  }

  const fromWalletAddress = toWalletAddress;

  const erc20AmountRecipient: ERC20AmountRecipient = {
    token: gasToken,
    amountString: "0",
    recipientAddress: toWalletAddress,
    externalUnresolvedToWalletAddress: undefined,
  };

  const onSuccess = () => {
    navigation.dispatch(StackActions.pop(1));
  };

  const getGasLimitOverrideForCancel = (): bigint => {
    return txResponse.gasLimit + 1n;
  };

  const performTransaction = async (
    finalAdjustedERC20AmountRecipientGroup: AdjustedERC20AmountRecipientGroup,
    _nftAmountRecipients: NFTAmountRecipient[],
    _selectedBroadcaster: Optional<SelectedBroadcaster>,
    _broadcasterFeeERC20Amount: Optional<ERC20Amount>,
    transactionGasDetails: TransactionGasDetails,
    _customNonce: Optional<number>,
    _publicWalletOverride: Optional<AvailableWallet>,
    _showSenderAddressToRecipient: boolean,
    _memoText: Optional<string>,
    success: () => void,
    error: (err: Error) => void
  ): Promise<Optional<string>> => {
    try {
      const walletSecureService = new WalletSecureServiceReactNative();
      const pKey = await walletSecureService.getWallet0xPKey(activeWallet);
      const [newTxResponse] = await Promise.all([
        executeERC20Transfer(
          pKey,
          network.current.name,
          toWalletAddress,
          finalAdjustedERC20AmountRecipientGroup.inputs[0],
          transactionGasDetails,
          txResponse.nonce,
          getGasLimitOverrideForCancel()
        ),
        delay(500),
      ]);
      const transactionService = new SavedTransactionService(dispatch);
      const newTransactionID = newTxResponse.hash;
      const originalTokenAmounts = transaction.tokenAmounts;
      const originalTransactionID = txResponse.hash;
      await transactionService.saveCancelTransaction(
        newTransactionID,
        fromWalletAddress,
        originalTokenAmounts,
        network.current,
        originalTransactionID,
        newTxResponse.nonce
      );
      success();
      return newTransactionID;
    } catch (cause) {
      error(new Error("Failed to cancel transaction", { cause }));
      return undefined;
    }
  };

  const transferGasEstimate = (
    _txidVersion: TXIDVersion,
    networkName: NetworkName,
    fromWalletAddress: string,
    erc20Amounts: ERC20Amount[]
  ): Promise<bigint> => {
    if (erc20Amounts.length !== 1) {
      throw new Error("Can only send to one recipient.");
    }
    return getERC20TransferGasEstimate(
      networkName,
      toWalletAddress,
      fromWalletAddress,
      erc20Amounts[0]
    );
  };

  const txCancelGasText =
    txResponse.type === 2
      ? `Max base fee must exceed original transaction by 30% to be accepted by the network. Priority fee must exceed original by 10%.`
      : `Gas price must exceed original transaction by 30% to be accepted by the network.`;
  const infoCalloutText = `Cancelling ${network.current.shortPublicName} transaction: ${txResponse.nonce}. ${txCancelGasText}`;
  const processingText = "Submitting cancellation...";

  return (
    <ReviewTransactionView
      navigation={navigation}
      confirmButtonText="Submit"
      getGasEstimate={transferGasEstimate}
      performTransaction={performTransaction}
      fromWalletAddress={tokenAmount.token.address}
      onSuccessCallback={onSuccess}
      isFullyPrivateTransaction={false}
      erc20AmountRecipients={[erc20AmountRecipient]}
      nftAmountRecipients={nftAmountRecipientsRef.current}
      infoCalloutText={infoCalloutText}
      processingText={processingText}
      transactionType={transactionType}
      cancelTxResponse={txResponse}
      useRelayAdapt={false}
      showCustomNonce={false}
      balanceBucketFilter={[RailgunWalletBalanceBucket.Spendable]}
    />
  );
};
