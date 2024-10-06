import {
  NetworkName,
  NFTAmountRecipient,
  RailgunWalletBalanceBucket,
  SelectedBroadcaster,
  TransactionGasDetails,
  TXIDVersion,
} from "@railgun-community/shared-models";
import React, { useRef } from "react";
import { ReviewTransactionView } from "@components/views/ReviewTransactionView/ReviewTransactionView";
import { TokenStackParamList } from "@models/navigation-models";
import { NavigationProp, RouteProp } from "@react-navigation/native";
import {
  AdjustedERC20AmountRecipientGroup,
  AvailableWallet,
  delay,
  ERC20Amount,
  ERC20AmountRecipient,
  executeERC20Approval,
  getERC20ApprovalGasEstimate,
  SavedTransactionService,
  useAppDispatch,
  useReduxSelector,
} from "@react-shared";
import { WalletSecureServiceReactNative } from "@services/wallet/wallet-secure-service-react-native";

type Props = {
  navigation: NavigationProp<TokenStackParamList, "ApproveTokenConfirm">;
  route: RouteProp<
    { params: TokenStackParamList["ApproveTokenConfirm"] },
    "params"
  >;
};

export const ApproveTokenConfirm: React.FC<Props> = ({ navigation, route }) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");

  const {
    spender,
    spenderName,
    tokenAmount,
    infoCalloutText,
    transactionType,
    onSuccessCallback,
  } = route.params;

  const dispatch = useAppDispatch();

  const nftAmountRecipientsRef = useRef<NFTAmountRecipient[]>([]);

  const activeWallet = wallets.active;
  if (!activeWallet || activeWallet.isViewOnlyWallet) {
    return null;
  }

  const approveERC20AmountRecipient: ERC20AmountRecipient = {
    ...tokenAmount,
    recipientAddress: spender,
    externalUnresolvedToWalletAddress: undefined,
  };

  const fromWalletAddress = activeWallet.ethAddress;

  const performTransaction = async (
    finalAdjustedERC20AmountRecipientGroup: AdjustedERC20AmountRecipientGroup,
    _nftAmountRecipients: NFTAmountRecipient[],
    _selectedBroadcaster: Optional<SelectedBroadcaster>,
    _broadcasterTokenFeeAmount: Optional<ERC20Amount>,
    transactionGasDetails: TransactionGasDetails,
    customNonce: Optional<number>,
    _publicWalletOverride: Optional<AvailableWallet>,
    _showSenderAddressToRecipient: boolean,
    _memoText: Optional<string>,
    success: () => void,
    error: (err: Error) => void
  ): Promise<Optional<string>> => {
    try {
      if (finalAdjustedERC20AmountRecipientGroup.inputs.length !== 1) {
        throw new Error("Can only approve one token.");
      }
      const walletSecureService = new WalletSecureServiceReactNative();
      const pKey = await walletSecureService.getWallet0xPKey(activeWallet);
      const [txResponse] = await Promise.all([
        executeERC20Approval(
          pKey,
          network.current.name,
          spender,
          finalAdjustedERC20AmountRecipientGroup.inputs[0],
          transactionGasDetails,
          customNonce
        ),
        delay(1000),
      ]);
      const transactionService = new SavedTransactionService(dispatch);
      await transactionService.saveApproveTransaction(
        txResponse.hash,
        fromWalletAddress,
        finalAdjustedERC20AmountRecipientGroup.inputs,
        [],
        network.current,
        spender,
        spenderName,
        txResponse.nonce
      );
      success();
      return txResponse.hash;
    } catch (cause) {
      error(new Error("Failed to execute ERC20 approval", { cause }));
      return undefined;
    }
  };

  const approvalGasEstimate = (
    _txidVersion: TXIDVersion,
    networkName: NetworkName,
    fromWalletAddress: string,
    erc20Amounts: ERC20Amount[]
  ): Promise<bigint> => {
    if (erc20Amounts.length !== 1) {
      throw new Error("Can only approve one token.");
    }
    return getERC20ApprovalGasEstimate(
      networkName,
      spender,
      fromWalletAddress,
      erc20Amounts[0]
    );
  };

  const processingText = "Approving token...";

  return (
    <ReviewTransactionView
      navigation={navigation}
      confirmButtonText="Approve"
      getGasEstimate={approvalGasEstimate}
      performTransaction={performTransaction}
      fromWalletAddress={fromWalletAddress}
      onSuccessCallback={onSuccessCallback}
      isFullyPrivateTransaction={false}
      erc20AmountRecipients={[approveERC20AmountRecipient]}
      nftAmountRecipients={nftAmountRecipientsRef.current}
      infoCalloutText={infoCalloutText}
      processingText={processingText}
      hideTokenAmounts={true}
      transactionType={transactionType}
      useRelayAdapt={false}
      showCustomNonce={true}
      balanceBucketFilter={[RailgunWalletBalanceBucket.Spendable]}
    />
  );
};
