import {
  FeeTokenDetails,
  isDefined,
  NetworkName,
  NFTAmountRecipient,
  RailgunPopulateTransactionResponse,
  SelectedRelayer,
  TransactionGasDetails,
  TXIDVersion,
} from '@railgun-community/shared-models';
import React from 'react';
import { ReviewTransactionView } from '@components/views/ReviewTransactionView/ReviewTransactionView';
import { TokenStackParamList } from '@models/navigation-models';
import {
  CommonActions,
  NavigationProp,
  RouteProp,
} from '@react-navigation/native';
import {
  AdjustedERC20AmountRecipientGroup,
  AuthenticatedWalletService,
  AvailableWallet,
  createRelayerFeeERC20AmountRecipient,
  delay,
  ERC20Amount,
  ERC20AmountRecipient,
  executeWithoutRelayer,
  getOverallBatchMinGasPrice,
  getPOIRequiredForNetwork,
  hasBlockedAddress,
  POIProofEventStatusUI,
  populateProvedUnshield,
  populateProvedUnshieldBaseToken,
  populateProvedUnshieldToOrigin,
  refreshNFTsMetadataAfterShieldUnshield,
  relayTransaction,
  SavedTransactionService,
  TransactionType,
  updatePOIProofProgressStatus,
  useAppDispatch,
  useReduxSelector,
} from '@react-shared';
import { getOrCreateDbEncryptionKey } from '@services/core/db';
import { WalletSecureServiceReactNative } from '@services/wallet/wallet-secure-service-react-native';

type Props = {
  navigation: NavigationProp<TokenStackParamList, 'UnshieldERC20sConfirm'>;
  route: RouteProp<
    { params: TokenStackParamList['UnshieldERC20sConfirm'] },
    'params'
  >;
};

export const UnshieldERC20sConfirm: React.FC<Props> = ({
  navigation,
  route,
}) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const { txidVersion } = useReduxSelector('txidVersion');

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
    getOrCreateDbEncryptionKey(),
  );

  const fromWalletAddress = activeWallet.railAddress;
  const { railWalletID } = activeWallet;

  const relayAdaptUnshieldERC20Amounts: Optional<ERC20Amount[]> =
    isBaseTokenUnshield
      ? erc20AmountRecipients.map(tokenAmount => ({
          token: tokenAmount.token,
          amountString: tokenAmount.amountString,
        }))
      : undefined;

  const onSuccess = () => {
    navigation.dispatch(CommonActions.navigate('WalletsScreen'));
  };

  const generateProof = async (
    finalERC20AmountRecipients: ERC20AmountRecipient[],
    nftAmountRecipients: NFTAmountRecipient[],
    selectedRelayer: Optional<SelectedRelayer>,
    relayerFeeERC20Amount: Optional<ERC20Amount>,
    publicWalletOverride: Optional<AvailableWallet>,
    _showSenderAddressToRecipient: boolean,
    _memoText: Optional<string>,
    overallBatchMinGasPrice: Optional<bigint>,
    success: () => void,
    error: (err: Error) => void,
  ) => {
    try {
      if (!isDefined(unshieldToOriginShieldTxid)) {
        if (!selectedRelayer && !publicWalletOverride) {
          throw new Error('No public relayer selected.');
        }
        if (!relayerFeeERC20Amount && !publicWalletOverride) {
          throw new Error('No fee amount selected.');
        }
      }

      const sendWithPublicWallet = isDefined(publicWalletOverride);

      const relayerFeeERC20AmountRecipient =
        createRelayerFeeERC20AmountRecipient(
          selectedRelayer,
          relayerFeeERC20Amount,
        );

      let proofCall;

      if (isBaseTokenUnshield) {
        proofCall = authenticatedWalletService.generateUnshieldBaseTokenProof(
          txidVersion.current,
          network.current.name,
          finalERC20AmountRecipients[0].recipientAddress,
          railWalletID,
          finalERC20AmountRecipients[0],
          relayerFeeERC20AmountRecipient,
          sendWithPublicWallet,
          overallBatchMinGasPrice,
        );
      } else if (isDefined(unshieldToOriginShieldTxid)) {
        proofCall = authenticatedWalletService.generateUnshieldToOriginProof(
          unshieldToOriginShieldTxid,
          txidVersion.current,
          network.current.name,
          railWalletID,
          finalERC20AmountRecipients,
          nftAmountRecipients,
        );
      } else {
        proofCall = authenticatedWalletService.generateUnshieldProof(
          txidVersion.current,
          network.current.name,
          railWalletID,
          finalERC20AmountRecipients,
          nftAmountRecipients,
          relayerFeeERC20AmountRecipient,
          sendWithPublicWallet,
          overallBatchMinGasPrice,
        );
      }

      await Promise.all([
        proofCall,
        delay(1000),
      ]);
      success();
    } catch (err) {
      error(err);
    }
  };

  const performTransaction = async (
    finalAdjustedERC20AmountRecipientGroup: AdjustedERC20AmountRecipientGroup,
    nftAmountRecipients: NFTAmountRecipient[],
    selectedRelayer: Optional<SelectedRelayer>,
    relayerFeeERC20Amount: Optional<ERC20Amount>,
    transactionGasDetails: TransactionGasDetails,
    customNonce: Optional<number>,
    publicWalletOverride: Optional<AvailableWallet>,
    _showSenderAddressToRecipient: boolean,
    _memoText: Optional<string>,
    success: () => void,
    error: (err: Error, isRelayerError?: boolean) => void,
  ): Promise<Optional<string>> => {
    if (!isDefined(unshieldToOriginShieldTxid)) {
      if (!selectedRelayer && !publicWalletOverride) {
        error(new Error('No public relayer or self relay wallet selected.'));
        return;
      }
      if (!relayerFeeERC20Amount && !publicWalletOverride) {
        error(new Error('No gas fee amount found.'));
        return;
      }
    }

    const sendWithPublicWallet = publicWalletOverride != null;

    const overallBatchMinGasPrice = getOverallBatchMinGasPrice(
      isDefined(selectedRelayer),
      transactionGasDetails,
    );

    const toAddresses = finalAdjustedERC20AmountRecipientGroup.outputs.map(
      output => output.recipientAddress,
    );
    if (await hasBlockedAddress(toAddresses)) {
      throw new Error('One or more of the recipient addresses is blocked.');
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
            transactionGasDetails,
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
            selectedRelayer,
            relayerFeeERC20Amount,
            sendWithPublicWallet,
            overallBatchMinGasPrice,
            transactionGasDetails,
          ),
          delay(1000),
        ]);
        populateTransactionResponse = response;
      }
    } catch (cause) {
      error(new Error('Failed to populate unshield.', { cause }));
      return;
    }

    try {
      let txHash: string;
      let nonce: Optional<number>;

      if (isDefined(unshieldToOriginShieldTxid)) {
        if (!wallets.active || wallets.active.isViewOnlyWallet) {
          throw new Error('Cannot send transaction with this active wallet.');
        }
        publicWalletOverride = wallets.active;
      }

      if (publicWalletOverride) {
        const pKey = await walletSecureService.getWallet0xPKey(
          publicWalletOverride,
        );
        const txResponse = await executeWithoutRelayer(
          publicWalletOverride.ethAddress,
          pKey,
          populateTransactionResponse.transaction,
          network.current,
          customNonce,
        );
        txHash = txResponse.hash;
        nonce = txResponse.nonce;
      } else if (selectedRelayer) {
        if (!isDefined(overallBatchMinGasPrice)) {
          throw new Error(
            'Relayer transaction requires overallBatchMinGasPrice.',
          );
        }
        const nullifiers = populateTransactionResponse.nullifiers ?? [];
        txHash = await relayTransaction(
          txidVersion.current,
          populateTransactionResponse.transaction.to,
          populateTransactionResponse.transaction.data,
          selectedRelayer.railgunAddress,
          selectedRelayer.tokenFee.feesID,
          network.current.chain,
          nullifiers,
          overallBatchMinGasPrice,
          isBaseTokenUnshield, populateTransactionResponse.preTransactionPOIsPerTxidLeafPerList,
        );
      } else {
        throw new Error('Must send with public relayer or self relay wallet');
      }

      const transactionService = new SavedTransactionService(dispatch);
      const relayerRailgunAddress = !sendWithPublicWallet
        ? selectedRelayer?.railgunAddress
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
        !sendWithPublicWallet && !isDefined(unshieldToOriginShieldTxid), isBaseTokenUnshield,
        relayerFeeERC20Amount,
        relayerRailgunAddress,
        nonce,
      );
      await refreshNFTsMetadataAfterShieldUnshield(
        dispatch,
        network.current.name,
        nftAmountRecipients,
      );

      const poiRequired = await getPOIRequiredForNetwork(network.current.name);
      if (poiRequired) {
        dispatch(
          updatePOIProofProgressStatus({
            networkName: network.current.name,
            walletID: railWalletID,
            txidVersion: txidVersion.current,
            status: POIProofEventStatusUI.NewTransactionLoading,
          }),
        );
      }

      success();
      return txHash;
    } catch (cause) {
      const isRelayerError = true;
      error(
        new Error('Transaction could not be executed', { cause }),
        isRelayerError,
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
    sendWithPublicWallet: boolean,
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
        sendWithPublicWallet,
      );
    }
    if (isDefined(unshieldToOriginShieldTxid)) {
      return authenticatedWalletService.getGasEstimatesForUnprovenUnshieldToOrigin(
        unshieldToOriginShieldTxid,
        txidVersion,
        networkName,
        railWalletID,
        erc20AmountRecipients,
        nftAmountRecipients,
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
      sendWithPublicWallet,
    );
  };

  const infoCalloutText = `Unshielding tokens into a public ${network.current.publicName} address.`;
  const processingText = 'Unshielding tokens... \nThis may take a moment.';

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
