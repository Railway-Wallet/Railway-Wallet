import {
  FeeTokenDetails,
  isDefined,
  NetworkName,
  NFTAmountRecipient,
  RailgunPopulateTransactionResponse,
  RailgunWalletBalanceBucket,
  SelectedRelayer,
  TransactionGasDetails,
  TXIDVersion,
} from '@railgun-community/shared-models';
import { EVENT_CLOSE_DRAWER } from '@models/drawer-types';
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
 getRelayerFilterPeerCount , getRelayerLightPushPeerCount ,   getRelayerMeshPeerCount,
getRelayerPubSubPeerCount,  hasBlockedAddress,
  logDev,
  PerformGenerateProofType,
  POIProofEventStatusUI,
  refreshNFTsMetadataAfterShieldUnshield,
  relayTransaction,
  SavedTransactionService,
  TransactionType,
  UnauthenticatedWalletService,
  updatePOIProofProgressStatus,
  useAppDispatch,
  useReduxSelector } from '@react-shared';
import { ReviewTransactionView } from '@screens/drawer/review-transaction/ReviewTransactionView';
import { drawerEventsBus } from '@services/navigation/drawer-events';
import { WalletSecureStorageWeb } from '@services/wallet/wallet-secure-service-web';

type Props = {
  goBack: () => void;
  erc20AmountRecipients: ERC20AmountRecipient[];
  nftAmountRecipients: NFTAmountRecipient[];
  authKey: string;
  setHasValidProof: (hasProof: boolean) => void;
  isBaseTokenUnshield: boolean;
  balanceBucketFilter: RailgunWalletBalanceBucket[];
  unshieldToOriginShieldTxid?: string;
};

export const UnshieldConfirm = ({
  goBack,
  erc20AmountRecipients,
  nftAmountRecipients,
  setHasValidProof,
  authKey,
  isBaseTokenUnshield,
  balanceBucketFilter,
  unshieldToOriginShieldTxid,
}: Props) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const { txidVersion } = useReduxSelector('txidVersion');

  const dispatch = useAppDispatch();

  const transactionType = TransactionType.Unshield;

  const activeWallet = wallets.active;
  if (!activeWallet || activeWallet.isViewOnlyWallet) {
    return null;
  }

  const fromWalletAddress = activeWallet.railAddress;
  const railWalletID = activeWallet.railWalletID;

  const relayAdaptUnshieldERC20Amounts: Optional<ERC20Amount[]> =
    isBaseTokenUnshield
      ? erc20AmountRecipients.map(tokenAmount => ({
          token: tokenAmount.token,
          amountString: tokenAmount.amountString,
        }))
      : undefined;

  const authenticatedWalletService = new AuthenticatedWalletService(authKey);
  const unauthenticatedWalletService = new UnauthenticatedWalletService();

  const onSuccess = () => {
    drawerEventsBus.dispatch(EVENT_CLOSE_DRAWER);
  };

  const generateProof: PerformGenerateProofType = async (
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

    const sendWithPublicWallet = isDefined(publicWalletOverride);

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

    let populateResponse: RailgunPopulateTransactionResponse;
    try {
      if (isDefined(unshieldToOriginShieldTxid)) {
        const [populateUnshieldResponse] = await Promise.all([
          unauthenticatedWalletService.populateRailgunProvedUnshieldToOrigin(
            txidVersion.current,
            network.current.name,
            railWalletID,
            finalAdjustedERC20AmountRecipientGroup.inputs,
            nftAmountRecipients,
            transactionGasDetails,
          ),
          delay(1000),
        ]);
        populateResponse = populateUnshieldResponse;
      } else {
        const unshieldCall = isBaseTokenUnshield
          ? unauthenticatedWalletService.populateRailgunProvedUnshieldBaseToken
          : unauthenticatedWalletService.populateRailgunProvedUnshield;
        const [populateUnshieldResponse] = await Promise.all([
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
        populateResponse = populateUnshieldResponse;
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
        const walletSecureService = new WalletSecureStorageWeb(authKey);
        const pKey = await walletSecureService.getWallet0xPKey(
          publicWalletOverride,
        );
        const txResponse = await executeWithoutRelayer(
          publicWalletOverride.ethAddress,
          pKey,
          populateResponse.transaction,
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

        const peerCounts = await Promise.all([
          getRelayerMeshPeerCount(),
          getRelayerFilterPeerCount(),
          getRelayerLightPushPeerCount(),
          getRelayerPubSubPeerCount(),
        ]);
        logDev(
          `Relay transaction peer counts... Mesh: ${peerCounts[0]}. Filter: ${peerCounts[1]}. LightPush: ${peerCounts[2]}. PubSub: ${peerCounts[3]}`,
        );

        const nullifiers = populateResponse.nullifiers ?? [];
        txHash = await relayTransaction(
          txidVersion.current,
          populateResponse.transaction.to,
          populateResponse.transaction.data,
          selectedRelayer.railgunAddress,
          selectedRelayer.tokenFee.feesID,
          network.current.chain,
          nullifiers,
          overallBatchMinGasPrice,
          isBaseTokenUnshield, populateResponse.preTransactionPOIsPerTxidLeafPerList,
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

      if (!isDefined(unshieldToOriginShieldTxid)) {
        const poiRequired = await getPOIRequiredForNetwork(
          network.current.name,
        );
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
      }

      success();
      return txHash;
    } catch (cause) {
      const isRelayerError = true;
      error(
        new Error('Failed to execute unshield transaction', { cause }),
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
      goBack={goBack}
      backButtonText={
        isDefined(unshieldToOriginShieldTxid)
          ? 'Close transaction'
          : 'Select tokens'
      }
      confirmButtonText="Unshield"
      getGasEstimate={getGasEstimate}
      performTransaction={performTransaction}
      performGenerateProof={generateProof}
      fromWalletAddress={fromWalletAddress}
      onSuccessCallback={onSuccess}
      isFullyPrivateTransaction={false}
      balanceBucketFilter={balanceBucketFilter}
      erc20AmountRecipients={erc20AmountRecipients}
      nftAmountRecipients={nftAmountRecipients}
      infoCalloutText={infoCalloutText}
      processingText={processingText}
      transactionType={transactionType}
      setHasValidProof={setHasValidProof}
      useRelayAdapt={isBaseTokenUnshield}
      isBaseTokenUnshield={isBaseTokenUnshield}
      relayAdaptUnshieldERC20Amounts={relayAdaptUnshieldERC20Amounts}
      relayAdaptShieldERC20Recipients={undefined}
      crossContractCalls={undefined}
      showCustomNonce={false}
      requireSelfSigned={isDefined(unshieldToOriginShieldTxid)}
    />
  );
};
