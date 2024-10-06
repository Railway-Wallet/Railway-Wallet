import {
  FeeTokenDetails,
  isDefined,
  NetworkName,
  NFTAmountRecipient,
  RailgunPopulateTransactionResponse,
  SelectedBroadcaster,
  TransactionGasDetails,
  TXIDVersion,
} from "@railgun-community/shared-models";
import React from "react";
import { ReviewTransactionView } from "@components/views/ReviewTransactionView/ReviewTransactionView";
import { TokenStackParamList } from "@models/navigation-models";
import {
  CommonActions,
  NavigationProp,
  RouteProp,
} from "@react-navigation/native";
import {
  AdjustedERC20AmountRecipientGroup,
  AuthenticatedWalletService,
  AvailableWallet,
  broadcastTransaction,
  createBroadcasterFeeERC20AmountRecipient,
  delay,
  ERC20Amount,
  ERC20AmountRecipient,
  executeWithoutBroadcaster,
  getOverallBatchMinGasPrice,
  getPOIRequiredForNetwork,
  hasBlockedAddress,
  POIProofEventStatusUI,
  populateProvedUnshield,
  populateProvedUnshieldBaseToken,
  populateProvedUnshieldToOrigin,
  refreshNFTsMetadataAfterShieldUnshield,
  SavedTransactionService,
  TransactionType,
  updatePOIProofProgressStatus,
  useAppDispatch,
  useReduxSelector,
} from "@react-shared";
import { getOrCreateDbEncryptionKey } from "@services/core/db";
import { WalletSecureServiceReactNative } from "@services/wallet/wallet-secure-service-react-native";

type Props = {
  navigation: NavigationProp<TokenStackParamList, "UnshieldERC20sConfirm">;
  route: RouteProp<
    { params: TokenStackParamList["UnshieldERC20sConfirm"] },
    "params"
  >;
};

export const UnshieldERC20sConfirm: React.FC<Props> = ({
  navigation,
  route,
}) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");
  const { txidVersion } = useReduxSelector("txidVersion");

  const {
    erc20AmountRecipients,
    isBaseTokenUnshield,
    nftAmountRecipients,
    balanceBucketFilter,
    unshieldToOriginShieldTxid,
  } = route.params;

  const dispatch = useAppDispatch();

  const transactionType = TransactionType.Unshield;

  const activeWallet = wallets.active;
  if (!activeWallet || activeWallet.isViewOnlyWallet) {
    return null;
  }

  const walletSecureService = new WalletSecureServiceReactNative();
  const authenticatedWalletService = new AuthenticatedWalletService(
    getOrCreateDbEncryptionKey()
  );

  const fromWalletAddress = activeWallet.railAddress;
  const { railWalletID } = activeWallet;

  const relayAdaptUnshieldERC20Amounts: Optional<ERC20Amount[]> =
    isBaseTokenUnshield
      ? erc20AmountRecipients.map((tokenAmount) => ({
          token: tokenAmount.token,
          amountString: tokenAmount.amountString,
        }))
      : undefined;

  const onSuccess = () => {
    navigation.dispatch(CommonActions.navigate("WalletsScreen"));
  };

  const generateProof = async (
    finalERC20AmountRecipients: ERC20AmountRecipient[],
    nftAmountRecipients: NFTAmountRecipient[],
    selectedBroadcaster: Optional<SelectedBroadcaster>,
    broadcasterFeeERC20Amount: Optional<ERC20Amount>,
    publicWalletOverride: Optional<AvailableWallet>,
    _showSenderAddressToRecipient: boolean,
    _memoText: Optional<string>,
    overallBatchMinGasPrice: Optional<bigint>,
    success: () => void,
    error: (err: Error) => void
  ) => {
    try {
      if (!isDefined(unshieldToOriginShieldTxid)) {
        if (!selectedBroadcaster && !publicWalletOverride) {
          throw new Error("No public broadcaster selected.");
        }
        if (!broadcasterFeeERC20Amount && !publicWalletOverride) {
          throw new Error("No fee amount selected.");
        }
      }

      const sendWithPublicWallet = isDefined(publicWalletOverride);

      const broadcasterFeeERC20AmountRecipient =
        createBroadcasterFeeERC20AmountRecipient(
          selectedBroadcaster,
          broadcasterFeeERC20Amount
        );

      let proofCall;

      if (isBaseTokenUnshield) {
        proofCall = authenticatedWalletService.generateUnshieldBaseTokenProof(
          txidVersion.current,
          network.current.name,
          finalERC20AmountRecipients[0].recipientAddress,
          railWalletID,
          finalERC20AmountRecipients[0],
          broadcasterFeeERC20AmountRecipient,
          sendWithPublicWallet,
          overallBatchMinGasPrice
        );
      } else if (isDefined(unshieldToOriginShieldTxid)) {
        proofCall = authenticatedWalletService.generateUnshieldToOriginProof(
          unshieldToOriginShieldTxid,
          txidVersion.current,
          network.current.name,
          railWalletID,
          finalERC20AmountRecipients,
          nftAmountRecipients
        );
      } else {
        proofCall = authenticatedWalletService.generateUnshieldProof(
          txidVersion.current,
          network.current.name,
          railWalletID,
          finalERC20AmountRecipients,
          nftAmountRecipients,
          broadcasterFeeERC20AmountRecipient,
          sendWithPublicWallet,
          overallBatchMinGasPrice
        );
      }

      await Promise.all([proofCall, delay(1000)]);
      success();
    } catch (err) {
      error(err);
    }
  };

  const performTransaction = async (
    finalAdjustedERC20AmountRecipientGroup: AdjustedERC20AmountRecipientGroup,
    nftAmountRecipients: NFTAmountRecipient[],
    selectedBroadcaster: Optional<SelectedBroadcaster>,
    broadcasterFeeERC20Amount: Optional<ERC20Amount>,
    transactionGasDetails: TransactionGasDetails,
    customNonce: Optional<number>,
    publicWalletOverride: Optional<AvailableWallet>,
    _showSenderAddressToRecipient: boolean,
    _memoText: Optional<string>,
    success: () => void,
    error: (err: Error, isBroadcasterError?: boolean) => void
  ): Promise<Optional<string>> => {
    if (!isDefined(unshieldToOriginShieldTxid)) {
      if (!selectedBroadcaster && !publicWalletOverride) {
        error(
          new Error("No public broadcaster or self broadcast wallet selected.")
        );
        return;
      }
      if (!broadcasterFeeERC20Amount && !publicWalletOverride) {
        error(new Error("No gas fee amount found."));
        return;
      }
    }

    const sendWithPublicWallet = publicWalletOverride != null;

    const overallBatchMinGasPrice = getOverallBatchMinGasPrice(
      isDefined(selectedBroadcaster),
      transactionGasDetails
    );

    const toAddresses = finalAdjustedERC20AmountRecipientGroup.outputs.map(
      (output) => output.recipientAddress
    );
    if (await hasBlockedAddress(toAddresses)) {
      throw new Error("One or more of the recipient addresses is blocked.");
    }

    let populateTransactionResponse: Optional<RailgunPopulateTransactionResponse>;
    try {
      if (isDefined(unshieldToOriginShieldTxid)) {
        const [populateUnshieldResponse] = await Promise.all([
          populateProvedUnshieldToOrigin(
            txidVersion.current,
            network.current.name,
            railWalletID,
            finalAdjustedERC20AmountRecipientGroup.inputs,
            nftAmountRecipients,
            transactionGasDetails
          ),
          delay(1000),
        ]);
        populateTransactionResponse = populateUnshieldResponse;
      } else {
        const unshieldCall = isBaseTokenUnshield
          ? populateProvedUnshieldBaseToken
          : populateProvedUnshield;
        const [response] = await Promise.all([
          unshieldCall(
            txidVersion.current,
            network.current.name,
            railWalletID,
            finalAdjustedERC20AmountRecipientGroup.inputs,
            nftAmountRecipients,
            selectedBroadcaster,
            broadcasterFeeERC20Amount,
            sendWithPublicWallet,
            overallBatchMinGasPrice,
            transactionGasDetails
          ),
          delay(1000),
        ]);
        populateTransactionResponse = response;
      }
    } catch (cause) {
      error(new Error("Failed to populate unshield.", { cause }));
      return;
    }

    try {
      let txHash: string;
      let nonce: Optional<number>;

      if (isDefined(unshieldToOriginShieldTxid)) {
        if (!wallets.active || wallets.active.isViewOnlyWallet) {
          throw new Error("Cannot send transaction with this active wallet.");
        }
        publicWalletOverride = wallets.active;
      }

      if (publicWalletOverride) {
        const pKey = await walletSecureService.getWallet0xPKey(
          publicWalletOverride
        );
        const txResponse = await executeWithoutBroadcaster(
          publicWalletOverride.ethAddress,
          pKey,
          populateTransactionResponse.transaction,
          network.current,
          customNonce
        );
        txHash = txResponse.hash;
        nonce = txResponse.nonce;
      } else if (selectedBroadcaster) {
        if (!isDefined(overallBatchMinGasPrice)) {
          throw new Error(
            "Broadcaster transaction requires overallBatchMinGasPrice."
          );
        }
        const nullifiers = populateTransactionResponse.nullifiers ?? [];
        txHash = await broadcastTransaction(
          txidVersion.current,
          populateTransactionResponse.transaction.to,
          populateTransactionResponse.transaction.data,
          selectedBroadcaster.railgunAddress,
          selectedBroadcaster.tokenFee.feesID,
          network.current.chain,
          nullifiers,
          overallBatchMinGasPrice,
          isBaseTokenUnshield,
          populateTransactionResponse.preTransactionPOIsPerTxidLeafPerList
        );
      } else {
        throw new Error(
          "Must send with public broadcaster or self broadcast wallet"
        );
      }

      const transactionService = new SavedTransactionService(dispatch);
      const broadcasterRailgunAddress = !sendWithPublicWallet
        ? selectedBroadcaster?.railgunAddress
        : undefined;
      await transactionService.saveUnshieldTransactions(
        txidVersion.current,
        txHash,
        activeWallet,
        fromWalletAddress,
        publicWalletOverride?.ethAddress,
        finalAdjustedERC20AmountRecipientGroup.fees,
        finalAdjustedERC20AmountRecipientGroup.outputs,
        nftAmountRecipients,
        network.current,
        !sendWithPublicWallet && !isDefined(unshieldToOriginShieldTxid),
        isBaseTokenUnshield,
        broadcasterFeeERC20Amount,
        broadcasterRailgunAddress,
        nonce
      );
      await refreshNFTsMetadataAfterShieldUnshield(
        dispatch,
        network.current.name,
        nftAmountRecipients
      );

      const poiRequired = await getPOIRequiredForNetwork(network.current.name);
      if (poiRequired) {
        dispatch(
          updatePOIProofProgressStatus({
            networkName: network.current.name,
            walletID: railWalletID,
            txidVersion: txidVersion.current,
            status: POIProofEventStatusUI.NewTransactionLoading,
          })
        );
      }

      success();
      return txHash;
    } catch (cause) {
      const isBroadcasterError = true;
      error(
        new Error("Transaction could not be executed", { cause }),
        isBroadcasterError
      );
      return undefined;
    }
  };

  const getGasEstimate = (
    txidVersion: TXIDVersion,
    networkName: NetworkName,
    railWalletID: string,
    memoText: Optional<string>,
    _tokenAmounts: ERC20Amount[],
    _nftAmountRecipients: NFTAmountRecipient[],
    originalGasDetails: TransactionGasDetails,
    feeTokenDetails: Optional<FeeTokenDetails>,
    sendWithPublicWallet: boolean
  ) => {
    if (isBaseTokenUnshield) {
      return authenticatedWalletService.getGasEstimatesForUnprovenUnshieldBaseToken(
        txidVersion,
        networkName,
        railWalletID,
        memoText,
        erc20AmountRecipients,
        nftAmountRecipients,
        originalGasDetails,
        feeTokenDetails,
        sendWithPublicWallet
      );
    }
    if (isDefined(unshieldToOriginShieldTxid)) {
      return authenticatedWalletService.getGasEstimatesForUnprovenUnshieldToOrigin(
        unshieldToOriginShieldTxid,
        txidVersion,
        networkName,
        railWalletID,
        erc20AmountRecipients,
        nftAmountRecipients
      );
    }
    return authenticatedWalletService.getGasEstimatesForUnprovenUnshield(
      txidVersion,
      networkName,
      railWalletID,
      memoText,
      erc20AmountRecipients,
      nftAmountRecipients,
      originalGasDetails,
      feeTokenDetails,
      sendWithPublicWallet
    );
  };

  const infoCalloutText = `Unshielding tokens into a public ${network.current.publicName} address.`;
  const processingText = "Unshielding tokens... \nThis may take a moment.";

  return (
    <ReviewTransactionView
      navigation={navigation}
      confirmButtonText="Unshield"
      getGasEstimate={getGasEstimate}
      performTransaction={performTransaction}
      performGenerateProof={generateProof}
      fromWalletAddress={fromWalletAddress}
      onSuccessCallback={onSuccess}
      isFullyPrivateTransaction={false}
      erc20AmountRecipients={erc20AmountRecipients}
      nftAmountRecipients={nftAmountRecipients}
      infoCalloutText={infoCalloutText}
      processingText={processingText}
      transactionType={transactionType}
      useRelayAdapt={isBaseTokenUnshield}
      isBaseTokenUnshield={isBaseTokenUnshield}
      relayAdaptUnshieldERC20Amounts={relayAdaptUnshieldERC20Amounts}
      relayAdaptShieldERC20Recipients={undefined}
      crossContractCalls={undefined}
      showCustomNonce={false}
      balanceBucketFilter={balanceBucketFilter}
      requireSelfSigned={isDefined(unshieldToOriginShieldTxid)}
    />
  );
};
