import {
  FeeTokenDetails,
  isDefined,
  NetworkName,
  NFTAmountRecipient,
  RailgunPopulateTransactionResponse,
  RailgunWalletBalanceBucket,
  SelectedBroadcaster,
  TransactionGasDetails,
  TXIDVersion,
} from '@railgun-community/shared-models';
import { EVENT_CLOSE_DRAWER } from '@models/drawer-types';
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
 getBroadcasterFilterPeerCount , getBroadcasterLightPushPeerCount ,   getBroadcasterMeshPeerCount,
getBroadcasterPubSubPeerCount,    getOverallBatchMinGasPrice,
  getPOIRequiredForNetwork,
hasBlockedAddress,
  logDev,
  PerformGenerateProofType,
  POIProofEventStatusUI,
  refreshNFTsMetadataAfterShieldUnshield,
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
    selectedBroadcaster: Optional<SelectedBroadcaster>,
    broadcasterFeeERC20Amount: Optional<ERC20Amount>,
    publicWalletOverride: Optional<AvailableWallet>,
    _showSenderAddressToRecipient: boolean,
    _memoText: Optional<string>,
    overallBatchMinGasPrice: Optional<bigint>,
    success: () => void,
    error: (err: Error) => void,
  ) => {
    try {
      if (!isDefined(unshieldToOriginShieldTxid)) {
        if (!selectedBroadcaster && !publicWalletOverride) {
          throw new Error('No public broadcaster selected.');
        }
        if (!broadcasterFeeERC20Amount && !publicWalletOverride) {
          throw new Error('No fee amount selected.');
        }
      }

      const sendWithPublicWallet = isDefined(publicWalletOverride);

      const broadcasterFeeERC20AmountRecipient =
        createBroadcasterFeeERC20AmountRecipient(
          selectedBroadcaster,
          broadcasterFeeERC20Amount,
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
          broadcasterFeeERC20AmountRecipient,
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
    selectedBroadcaster: Optional<SelectedBroadcaster>,
    broadcasterFeeERC20Amount: Optional<ERC20Amount>,
    transactionGasDetails: TransactionGasDetails,
    customNonce: Optional<number>,
    publicWalletOverride: Optional<AvailableWallet>,
    _showSenderAddressToRecipient: boolean,
    _memoText: Optional<string>,
    success: () => void,
    error: (err: Error, isBroadcasterError?: boolean) => void,
  ): Promise<Optional<string>> => {
    if (!isDefined(unshieldToOriginShieldTxid)) {
      if (!selectedBroadcaster && !publicWalletOverride) {
        error(new Error('No public broadcaster or self broadcast wallet selected.'));
        return;
      }
      if (!broadcasterFeeERC20Amount && !publicWalletOverride) {
        error(new Error('No gas fee amount found.'));
        return;
      }
    }

    const sendWithPublicWallet = isDefined(publicWalletOverride);

    const overallBatchMinGasPrice = getOverallBatchMinGasPrice(
      isDefined(selectedBroadcaster),
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
            selectedBroadcaster,
            broadcasterFeeERC20Amount,
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
        const txResponse = await executeWithoutBroadcaster(
          publicWalletOverride.ethAddress,
          pKey,
          populateResponse.transaction,
          network.current,
          customNonce,
        );
        txHash = txResponse.hash;
        nonce = txResponse.nonce;
      } else if (selectedBroadcaster) {
        if (!isDefined(overallBatchMinGasPrice)) {
          throw new Error(
            'Broadcaster transaction requires overallBatchMinGasPrice.',
          );
        }

        const peerCounts = await Promise.all([
          getBroadcasterMeshPeerCount(),
          getBroadcasterFilterPeerCount(),
          getBroadcasterLightPushPeerCount(),
          getBroadcasterPubSubPeerCount(),
        ]);
        logDev(
          `Broadcast transaction peer counts... Mesh: ${peerCounts[0]}. Filter: ${peerCounts[1]}. LightPush: ${peerCounts[2]}. PubSub: ${peerCounts[3]}`,
        );

        const nullifiers = populateResponse.nullifiers ?? [];
        txHash = await broadcastTransaction(
          txidVersion.current,
          populateResponse.transaction.to,
          populateResponse.transaction.data,
          selectedBroadcaster.railgunAddress,
          selectedBroadcaster.tokenFee.feesID,
          network.current.chain,
          nullifiers,
          overallBatchMinGasPrice,
          isBaseTokenUnshield, populateResponse.preTransactionPOIsPerTxidLeafPerList,
        );
      } else {
        throw new Error('Must send with public broadcaster or self broadcast wallet');
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
        !sendWithPublicWallet && !isDefined(unshieldToOriginShieldTxid), isBaseTokenUnshield,
        broadcasterFeeERC20Amount,
        broadcasterRailgunAddress,
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
      const isBroadcasterError = true;
      error(
        new Error('Failed to execute unshield transaction', { cause }),
        isBroadcasterError,
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
