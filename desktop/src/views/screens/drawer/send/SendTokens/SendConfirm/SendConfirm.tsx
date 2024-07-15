import {
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
  executeERC20Transfer,
  executeNFTTransfer,
  executeWithoutBroadcaster,
  getBroadcasterFilterPeerCount,
  getBroadcasterLightPushPeerCount,
  getBroadcasterMeshPeerCount,
  getBroadcasterPubSubPeerCount,
  getERC20TransferGasEstimate,
  getNFTTransferGasEstimate,
  getOverallBatchMinGasPrice,
  getPOIRequiredForNetwork,
  hasBlockedAddress,
  logDev,
  PerformGenerateProofType,
  POIProofEventStatusUI,
  populateProvedTransfer,
  SavedTransactionService,
  TransactionType,
  updatePOIProofProgressStatus,
  useAppDispatch,
  useReduxSelector,
} from '@react-shared';
import { ReviewTransactionView } from '@screens/drawer/review-transaction/ReviewTransactionView';
import { drawerEventsBus } from '@services/navigation/drawer-events';
import { WalletSecureStorageWeb } from '@services/wallet/wallet-secure-service-web';

type Props = {
  goBack: () => void;
  isRailgun: boolean;
  erc20AmountRecipients: ERC20AmountRecipient[];
  nftAmountRecipients: NFTAmountRecipient[];
  authKey: string;
};

export const SendConfirm = ({
  goBack,
  isRailgun,
  erc20AmountRecipients,
  nftAmountRecipients,
  authKey,
}: Props) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const { txidVersion } = useReduxSelector('txidVersion');

  const dispatch = useAppDispatch();

  const transactionType = TransactionType.Send;

  const activeWallet = wallets.active;
  if (!activeWallet || activeWallet.isViewOnlyWallet) {
    return null;
  }

  const fromWalletAddress = isRailgun
    ? activeWallet.railAddress
    : activeWallet.ethAddress;
  const railWalletID = activeWallet.railWalletID;

  const walletSecureService = new WalletSecureStorageWeb(authKey);
  const authenticatedWalletService = new AuthenticatedWalletService(authKey);

  const onSuccess = () => {
    drawerEventsBus.dispatch(EVENT_CLOSE_DRAWER);
  };

  const generateProof: PerformGenerateProofType = async (
    finalERC20AmountRecipients: ERC20AmountRecipient[],
    nftAmountRecipients: NFTAmountRecipient[],
    selectedBroadcaster: Optional<SelectedBroadcaster>,
    broadcasterFeeERC20Amount: Optional<ERC20Amount>,
    publicWalletOverride: Optional<AvailableWallet>,
    showSenderAddressToRecipient: boolean,
    memoText: Optional<string>,
    overallBatchMinGasPrice: Optional<bigint>,
    success: () => void,
    error: (err: Error) => void,
  ) => {
    try {
      if (!isRailgun) {
        throw new Error('Cannot generate proofs for non-Railgun transfers.');
      }
      if (!selectedBroadcaster && !publicWalletOverride) {
        throw new Error('No public broadcaster selected.');
      }
      if (!broadcasterFeeERC20Amount && !publicWalletOverride) {
        throw new Error('No fee amount selected.');
      }

      const sendWithPublicWallet = isDefined(publicWalletOverride);

      const broadcasterFeeERC20AmountRecipient =
        createBroadcasterFeeERC20AmountRecipient(
          selectedBroadcaster,
          broadcasterFeeERC20Amount,
        );

      await Promise.all([
        authenticatedWalletService.generateTransferProof(
          txidVersion.current,
          network.current.name,
          railWalletID,
          memoText,
          showSenderAddressToRecipient,
          finalERC20AmountRecipients,
          nftAmountRecipients,
          broadcasterFeeERC20AmountRecipient,
          sendWithPublicWallet,
          overallBatchMinGasPrice,
        ),
        delay(1000),
      ]);

      success();
    } catch (err) {
      error(err);
    }
  };

  const performTransaction = (
    finalAdjustedERC20AmountRecipientGroup: AdjustedERC20AmountRecipientGroup,
    nftAmountRecipients: NFTAmountRecipient[],
    selectedBroadcaster: Optional<SelectedBroadcaster>,
    broadcasterFeeERC20Amount: Optional<ERC20Amount>,
    transactionGasDetails: TransactionGasDetails,
    customNonce: Optional<number>,
    publicWalletOverride: Optional<AvailableWallet>,
    showSenderAddressToRecipient: boolean,
    memoText: Optional<string>,
    success: () => void,
    error: (err: Error, isBroadcasterError?: boolean) => void,
  ): Promise<Optional<string>> => {
    if (isRailgun) {
      return transactRailgun(
        finalAdjustedERC20AmountRecipientGroup.inputs,
        nftAmountRecipients,
        selectedBroadcaster,
        broadcasterFeeERC20Amount,
        transactionGasDetails,
        customNonce,
        publicWalletOverride,
        showSenderAddressToRecipient,
        memoText,
        success,
        error,
      );
    }

    if (nftAmountRecipients.length) {
      if (finalAdjustedERC20AmountRecipientGroup.inputs.length) {
        throw new Error(
          'Cannot send ERC20s and NFTs in the same public transaction.',
        );
      }
      return transactNFT(
        nftAmountRecipients,
        transactionGasDetails,
        customNonce,
        success,
        error,
      );
    }

    return transactERC20(
      finalAdjustedERC20AmountRecipientGroup.inputs,
      transactionGasDetails,
      customNonce,
      success,
      error,
    );
  };

  const transactRailgun = async (
    finalERC20AmountRecipients: ERC20AmountRecipient[],
    nftAmountRecipients: NFTAmountRecipient[],
    selectedBroadcaster: Optional<SelectedBroadcaster>,
    broadcasterFeeERC20Amount: Optional<ERC20Amount>,
    transactionGasDetails: TransactionGasDetails,
    customNonce: Optional<number>,
    publicWalletOverride: Optional<AvailableWallet>,
    showSenderAddressToRecipient: boolean,
    memoText: Optional<string>,
    success: () => void,
    error: (err: Error, isBroadcasterError?: boolean) => void,
  ): Promise<Optional<string>> => {
    if (!selectedBroadcaster && !publicWalletOverride) {
      error(
        new Error(
          'No selected public broadcaster or self broadcast wallet found.',
        ),
      );
      return;
    }
    if (!broadcasterFeeERC20Amount && !publicWalletOverride) {
      error(new Error('No gas fee amount found.'));
      return;
    }

    const sendWithPublicWallet = isDefined(publicWalletOverride);

    const overallBatchMinGasPrice = getOverallBatchMinGasPrice(
      isDefined(selectedBroadcaster),
      transactionGasDetails,
    );

    let populateResponse: Optional<RailgunPopulateTransactionResponse>;
    try {
      const [populateTxResponse] = await Promise.all([
        populateProvedTransfer(
          txidVersion.current,
          network.current.name,
          railWalletID,
          showSenderAddressToRecipient,
          memoText,
          finalERC20AmountRecipients,
          nftAmountRecipients,
          selectedBroadcaster,
          broadcasterFeeERC20Amount,
          sendWithPublicWallet,
          overallBatchMinGasPrice,
          transactionGasDetails,
        ),
        delay(1000),
      ]);
      populateResponse = populateTxResponse;
    } catch (cause) {
      error(new Error('Failed to populate transaction.', { cause }));
      return;
    }

    try {
      let txHash: string;
      let nonce: Optional<number>;
      if (publicWalletOverride) {
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
          false, populateResponse.preTransactionPOIsPerTxidLeafPerList,
        );
      } else {
        throw new Error(
          'Must send with public broadcaster or self broadcast wallet',
        );
      }

      const transactionService = new SavedTransactionService(dispatch);
      const broadcasterRailgunAddress = !sendWithPublicWallet
        ? selectedBroadcaster?.railgunAddress
        : undefined;
      await transactionService.saveSendTransaction(
        txidVersion.current,
        txHash,
        fromWalletAddress,
        publicWalletOverride?.ethAddress,
        finalERC20AmountRecipients,
        nftAmountRecipients,
        network.current,
        !sendWithPublicWallet, true, broadcasterFeeERC20Amount,
        broadcasterRailgunAddress,
        nonce,
        memoText,
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
      const isBroadcasterError = true;
      error(
        new Error('Failed to execute transaction', { cause }),
        isBroadcasterError,
      );
      return undefined;
    }
  };

  const getPublicToWalletAddress = (
    tokenAmountRecipients: (ERC20AmountRecipient | NFTAmountRecipient)[],
  ) => {
    if (tokenAmountRecipients.length > 1) {
      throw new Error(
        'You may only send one token at a time through public transfers.',
      );
    }
    return tokenAmountRecipients[0].recipientAddress;
  };

  const transactERC20 = async (
    finalERC20AmountRecipients: ERC20AmountRecipient[],
    transactionGasDetails: TransactionGasDetails,
    customNonce: Optional<number>,
    success: () => void,
    error: (err: Error) => void,
  ): Promise<Optional<string>> => {
    try {
      if (finalERC20AmountRecipients.length !== 1) {
        throw new Error('Can only send one erc20 token publicly.');
      }
      const toWalletAddress = getPublicToWalletAddress(
        finalERC20AmountRecipients,
      );
      if (await hasBlockedAddress([toWalletAddress])) {
        throw new Error('The recipient address is blocked.');
      }

      const pKey = await walletSecureService.getWallet0xPKey(activeWallet);
      const [txResponse] = await Promise.all([
        executeERC20Transfer(
          pKey,
          network.current.name,
          toWalletAddress,
          finalERC20AmountRecipients[0],
          transactionGasDetails,
          customNonce,
        ),
        delay(500),
      ]);
      const transactionService = new SavedTransactionService(dispatch);
      await transactionService.saveSendTransaction(
        undefined, txResponse.hash,
        fromWalletAddress,
        fromWalletAddress, finalERC20AmountRecipients,
        [], network.current,
        false, false, undefined, undefined, txResponse.nonce,
        undefined,
      );
      success();
      return txResponse.hash;
    } catch (cause) {
      error(new Error('Failed to execute ERC20 transfer.', { cause }));
      return undefined;
    }
  };

  const transactNFT = async (
    nftAmountRecipients: NFTAmountRecipient[],
    transactionGasDetails: TransactionGasDetails,
    customNonce: Optional<number>,
    success: () => void,
    error: (err: Error) => void,
  ): Promise<Optional<string>> => {
    try {
      if (nftAmountRecipients.length !== 1) {
        throw new Error('Can only send one NFT publicly.');
      }
      const pKey = await walletSecureService.getWallet0xPKey(activeWallet);
      const [txResponse] = await Promise.all([
        executeNFTTransfer(
          pKey,
          network.current.name,
          fromWalletAddress,
          nftAmountRecipients[0],
          transactionGasDetails,
          customNonce,
        ),
        delay(500),
      ]);
      const transactionService = new SavedTransactionService(dispatch);
      await transactionService.saveSendTransaction(
        undefined, txResponse.hash,
        fromWalletAddress,
        fromWalletAddress, [], nftAmountRecipients,
        network.current,
        false, false, undefined, undefined, txResponse.nonce,
        undefined,
      );
      success();
      return txResponse.hash;
    } catch (cause) {
      error(new Error('Failed to execute NFT transfer.', { cause }));
      return undefined;
    }
  };

  const getPublicTransferGasEstimates = (
    _txidVersion: TXIDVersion,
    networkName: NetworkName,
    fromWalletAddress: string,
    erc20AmountRecipients: ERC20AmountRecipient[],
    nftAmountRecipients: NFTAmountRecipient[],
  ) => {
    if (erc20AmountRecipients.length && nftAmountRecipients.length) {
      throw new Error(
        'Cannot transfer both erc20 and NFT in one public transaction.',
      );
    }
    if (nftAmountRecipients.length) {
      return getPublicNFTTransferGasEstimates(
        networkName,
        fromWalletAddress,
        nftAmountRecipients,
      );
    }
    return getPublicERC20TransferGasEstimates(
      networkName,
      fromWalletAddress,
      erc20AmountRecipients,
    );
  };

  const getPublicERC20TransferGasEstimates = (
    networkName: NetworkName,
    fromWalletAddress: string,
    erc20AmountRecipients: ERC20AmountRecipient[],
  ) => {
    if (erc20AmountRecipients.length !== 1) {
      throw new Error('Can only send one erc20 publicly.');
    }
    const toWalletAddress = getPublicToWalletAddress(erc20AmountRecipients);
    return getERC20TransferGasEstimate(
      networkName,
      toWalletAddress,
      fromWalletAddress,
      erc20AmountRecipients[0],
    );
  };

  const getPublicNFTTransferGasEstimates = (
    networkName: NetworkName,
    fromWalletAddress: string,
    nftAmountRecipients: NFTAmountRecipient[],
  ) => {
    if (nftAmountRecipients.length !== 1) {
      throw new Error('Can only send one nft publicly.');
    }
    return getNFTTransferGasEstimate(
      networkName,
      fromWalletAddress,
      nftAmountRecipients[0],
    );
  };

  const infoCalloutText = isRailgun
    ? 'Sending shielded tokens to a private RAILGUN address.'
    : `Sending unshielded tokens to a public ${network.current.publicName} address.`;
  const processingText = isRailgun
    ? 'Submitting transaction.\nThis may take a moment.'
    : 'Submitting transaction.';

  const balanceBucketFilter = [RailgunWalletBalanceBucket.Spendable];

  return (
    <ReviewTransactionView
      goBack={goBack}
      backButtonText="Select tokens"
      confirmButtonText="Send"
      getGasEstimate={
        isRailgun
          ? authenticatedWalletService.getGasEstimatesForUnprovenTransfer
          : getPublicTransferGasEstimates
      }
      performTransaction={performTransaction}
      performGenerateProof={generateProof}
      fromWalletAddress={fromWalletAddress}
      onSuccessCallback={onSuccess}
      isFullyPrivateTransaction={isRailgun}
      balanceBucketFilter={balanceBucketFilter}
      erc20AmountRecipients={erc20AmountRecipients}
      nftAmountRecipients={nftAmountRecipients}
      infoCalloutText={infoCalloutText}
      processingText={processingText}
      transactionType={transactionType}
      useRelayAdapt={false}
      showCustomNonce={!isRailgun}
    />
  );
};
