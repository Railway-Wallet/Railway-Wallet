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
import { StackActions } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  AdjustedERC20AmountRecipientGroup,
  AvailableWallet,
  delay,
  ERC20Amount,
  ERC20AmountRecipient,
  executeERC20Mint,
  getERC20MintGasEstimate,
  SavedTransactionService,
  TransactionType,
  useAppDispatch,
  useReduxSelector,
} from "@react-shared";
import { WalletSecureServiceReactNative } from "@services/wallet/wallet-secure-service-react-native";

type Props = NativeStackScreenProps<
  TokenStackParamList,
  "MintTokensConfirm"
> & {};

export const MintTokensConfirm: React.FC<Props> = ({ navigation, route }) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");

  const { tokenAmount } = route.params;

  const dispatch = useAppDispatch();

  const transactionType = TransactionType.Mint;

  const nftAmountRecipientsRef = useRef<NFTAmountRecipient[]>([]);

  const activeWallet = wallets.active;
  if (!activeWallet || activeWallet.isViewOnlyWallet) {
    return null;
  }

  const toWalletAddress = activeWallet.ethAddress;

  const erc20AmountRecipient: ERC20AmountRecipient = {
    token: tokenAmount.token,
    amountString: tokenAmount.amountString,
    recipientAddress: toWalletAddress,
    externalUnresolvedToWalletAddress: undefined,
  };

  const onSuccess = () => {
    navigation.dispatch(StackActions.pop(1));
  };

  const performTransaction = async (
    finalAdjustedERC20AmountRecipientGroup: AdjustedERC20AmountRecipientGroup,
    _nftAmountRecipients: NFTAmountRecipient[],
    _selectedBroadcaster: Optional<SelectedBroadcaster>,
    _broadcasterFeeERC20Amount: Optional<ERC20Amount>,
    transactionGasDetails: TransactionGasDetails,
    customNonce: Optional<number>,
    _publicWalletOverride: Optional<AvailableWallet>,
    _showSenderAddressToRecipient: boolean,
    _memoText: Optional<string>,
    success: () => void,
    error: (err: Error) => void
  ): Promise<Optional<string>> => {
    try {
      const walletSecureService = new WalletSecureServiceReactNative();
      const pKey = await walletSecureService.getWallet0xPKey(activeWallet);
      const [txResponse] = await Promise.all([
        executeERC20Mint(
          pKey,
          network.current.name,
          toWalletAddress,
          finalAdjustedERC20AmountRecipientGroup.inputs[0],
          transactionGasDetails,
          customNonce
        ),
        delay(500),
      ]);
      const transactionService = new SavedTransactionService(dispatch);
      await transactionService.saveMintTransaction(
        txResponse.hash,
        toWalletAddress,
        finalAdjustedERC20AmountRecipientGroup.inputs[0],
        network.current,
        txResponse.nonce
      );
      success();
      return txResponse.hash;
    } catch (cause) {
      error(new Error("Failed to execute ERC20 mint.", { cause }));
      return undefined;
    }
  };

  const mintGasEstimate = (
    _txidVersion: TXIDVersion,
    networkName: NetworkName,
    fromWalletAddress: string,
    erc20Amounts: ERC20Amount[]
  ) =>
    getERC20MintGasEstimate(
      networkName,
      toWalletAddress,
      fromWalletAddress,
      erc20Amounts[0]
    );

  const infoCalloutText = `Minting tokens into a public ${network.current.publicName} address.`;
  const processingText = "Minting tokens...";

  return (
    <ReviewTransactionView
      navigation={navigation}
      confirmButtonText="Mint"
      getGasEstimate={mintGasEstimate}
      performTransaction={performTransaction}
      fromWalletAddress={tokenAmount.token.address}
      onSuccessCallback={onSuccess}
      isFullyPrivateTransaction={false}
      erc20AmountRecipients={[erc20AmountRecipient]}
      nftAmountRecipients={nftAmountRecipientsRef.current}
      infoCalloutText={infoCalloutText}
      processingText={processingText}
      transactionType={transactionType}
      useRelayAdapt={false}
      showCustomNonce={true}
      balanceBucketFilter={[RailgunWalletBalanceBucket.Spendable]}
    />
  );
};
