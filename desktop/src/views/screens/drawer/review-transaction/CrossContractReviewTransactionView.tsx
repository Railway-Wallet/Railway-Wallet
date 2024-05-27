import {
  LiquidityV2Pool,
  RecipeOutput,
  SwapQuoteData,
} from '@railgun-community/cookbook';
import {
  FeeTokenDetails,
  isDefined,
  NETWORK_CONFIG,
  NetworkName,
  NFTAmount,
  NFTAmountRecipient,
  RailgunERC20Recipient,
  RailgunPopulateTransactionResponse,
  RailgunWalletBalanceBucket,
  SelectedBroadcaster,
  TransactionGasDetails,
  TXIDVersion,
} from '@railgun-community/shared-models';
import React, { useMemo, useRef } from 'react';
import { ContractTransaction } from 'ethers';
import { FullScreenSpinner } from '@components/loading/FullScreenSpinner/FullScreenSpinner';
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
  getBroadcasterFilterPeerCount,
  getBroadcasterLightPushPeerCount,
  getBroadcasterMeshPeerCount,
  getBroadcasterPubSubPeerCount,
  GetGasEstimateProofRequired,
  getOverallBatchMinGasPrice,
  getPOIRequiredForNetwork,
  logDev,
  PerformGenerateProofType,
  POIProofEventStatusUI,
  TransactionType,
  UnauthenticatedWalletService,
  updatePOIProofProgressStatus,
  useAppDispatch,
  useReduxSelector,
  Vault,
} from '@react-shared';
import { WalletSecureStorageWeb } from '@services/wallet/wallet-secure-service-web';
import { ReviewTransactionView } from './ReviewTransactionView';

type Props = {
  authKey: string;
  crossContractCalls: ContractTransaction[];
  saveTransaction: (
    txHash: string,
    sendWithPublicWallet: boolean,
    publicExecutionWalletAddress: Optional<string>,
    broadcasterFeeERC20Amount: Optional<ERC20Amount>,
    broadcasterRailgunAddress: Optional<string>,
    nonce: Optional<number>,
  ) => Promise<void>;
  onSuccess: () => void;
  transactionType: TransactionType;
  relayAdaptUnshieldERC20Amounts: ERC20Amount[];
  relayAdaptUnshieldNFTAmounts: NFTAmount[];
  relayAdaptShieldERC20Recipients: RailgunERC20Recipient[];
  relayAdaptShieldNFTRecipients: NFTAmountRecipient[];
  infoCalloutText: string;
  processingText: string;
  confirmButtonText: string;
  backButtonText: Optional<string>;
  goBack: Optional<() => void>;
  onBroadcasterFeeUpdate?: (
    broadcasterFeeERC20Amount: Optional<ERC20Amount>,
  ) => void;

  recipeOutput: RecipeOutput;
  isRefreshingRecipeOutput: boolean;

  receivedMinimumAmounts?: ERC20Amount[];

  swapQuote?: SwapQuoteData
  swapBuyTokenAmount?: ERC20Amount;
  swapQuoteOutdated?: boolean;
  swapDestinationAddress?: string;
  setSwapDestinationAddress?: (destinationAddress: Optional<string>) => void;
  updateSwapQuote?: () => void;

  vault?: Vault

  pool?: LiquidityV2Pool
  setSlippagePercent?: (slippage: number) => void;
  slippagePercent?: number;
};

export const CrossContractReviewTransactionView: React.FC<Props> = ({
  authKey,
  crossContractCalls,
  saveTransaction,
  onSuccess,
  transactionType,
  recipeOutput,
  isRefreshingRecipeOutput,
  relayAdaptUnshieldERC20Amounts,
  relayAdaptUnshieldNFTAmounts,
  relayAdaptShieldERC20Recipients,
  relayAdaptShieldNFTRecipients,
  infoCalloutText,
  processingText,
  confirmButtonText,
  backButtonText,
  goBack,
  swapQuote,
  swapBuyTokenAmount,
  receivedMinimumAmounts,
  swapQuoteOutdated,
  swapDestinationAddress,
  setSwapDestinationAddress,
  updateSwapQuote,
  onBroadcasterFeeUpdate,
  setSlippagePercent,
  slippagePercent,
  vault,
  pool,
}) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const { txidVersion } = useReduxSelector('txidVersion');
  const dispatch = useAppDispatch();

  const nftAmountRecipientsRef = useRef<NFTAmountRecipient[]>([]);

  const relayAdaptContract =
    NETWORK_CONFIG[network.current.name].relayAdaptContract;

  const relayAdaptUnshieldERC20AmountRecipients: ERC20AmountRecipient[] =
    useMemo(
      () =>
        relayAdaptUnshieldERC20Amounts.map(tokenAmount => ({
          ...tokenAmount,
          recipientAddress: relayAdaptContract,
          externalUnresolvedToWalletAddress: undefined,
        })),
      [relayAdaptContract, relayAdaptUnshieldERC20Amounts],
    );

  const activeWallet = wallets.active;
  if (!activeWallet || activeWallet.isViewOnlyWallet) {
    return null;
  }

  const railgunAddress = activeWallet.railAddress;
  const { railWalletID } = activeWallet;

  const authenticatedWalletService = new AuthenticatedWalletService(authKey);
  const unauthenticatedWalletService = new UnauthenticatedWalletService();

  const generateProof: PerformGenerateProofType = async (
    _finalERC20AmountRecipients: ERC20AmountRecipient[],
    _nftAmountRecipients: NFTAmountRecipient[],
    selectedBroadcaster: Optional<SelectedBroadcaster>,
    broadcasterFeeERC20Amount: Optional<ERC20Amount>,
    publicWalletOverride: Optional<AvailableWallet>,
    _showSenderAddressToRecipient: boolean,
    _memoText: Optional<string>,
    overallBatchMinGasPrice: Optional<bigint>,
    success: () => void,
    error: (err: Error) => void,
  ) => {
    if (!selectedBroadcaster && !publicWalletOverride) {
      error(new Error('No public broadcaster selected.'));
      return;
    }
    if (!broadcasterFeeERC20Amount && !publicWalletOverride) {
      error(new Error('No fee amount selected.'));
      return;
    }
    try {
      const sendWithPublicWallet = isDefined(publicWalletOverride);

      const broadcasterFeeERC20AmountRecipient =
        createBroadcasterFeeERC20AmountRecipient(
          selectedBroadcaster,
          broadcasterFeeERC20Amount,
        );

      await Promise.all([
        authenticatedWalletService.generateCrossContractCallsProof(
          txidVersion.current,
          network.current.name,
          railWalletID,
          relayAdaptUnshieldERC20Amounts, relayAdaptUnshieldNFTAmounts,
          relayAdaptShieldERC20Recipients,
          relayAdaptShieldNFTRecipients,
          crossContractCalls,
          broadcasterFeeERC20AmountRecipient,
          sendWithPublicWallet,
          overallBatchMinGasPrice,
          recipeOutput.minGasLimit,
        ),
        delay(1000),
      ]);

      success();
    } catch (err) {
      error(err);
    }
  };

  const performTransaction = async (
    _finalAdjustedERC20AmountRecipientGroup: AdjustedERC20AmountRecipientGroup,
    _nftAmountRecipients: NFTAmountRecipient[],
    selectedBroadcaster: Optional<SelectedBroadcaster>,
    broadcasterFeeERC20Amount: Optional<ERC20Amount>,
    transactionGasDetails: TransactionGasDetails,
    customNonce: Optional<number>,
    publicWalletOverride: Optional<AvailableWallet>,
    _showSenderAddressToRecipient: boolean,
    _memoText: Optional<string>,
    success: () => void,
    error: (err: Error, isBroadcasterError?: boolean) => void,
  ) => {
    if (!selectedBroadcaster && !publicWalletOverride) {
      error(new Error('No public broadcaster or self broadcast wallet selected.'));
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

    const broadcasterFeeERC20AmountRecipient =
      createBroadcasterFeeERC20AmountRecipient(
        selectedBroadcaster,
        broadcasterFeeERC20Amount,
      );

    let populateResponse: Optional<RailgunPopulateTransactionResponse>;
    try {
      const [populateCrossContractCallsResponse] = await Promise.all([
        unauthenticatedWalletService.populateRailgunCrossContractCalls(
          txidVersion.current,
          network.current.name,
          railWalletID,
          relayAdaptUnshieldERC20Amounts,
          relayAdaptUnshieldNFTAmounts,
          relayAdaptShieldERC20Recipients,
          relayAdaptShieldNFTRecipients,
          crossContractCalls,
          broadcasterFeeERC20AmountRecipient,
          sendWithPublicWallet,
          overallBatchMinGasPrice,
          transactionGasDetails,
        ),
        delay(1000),
      ]);
      populateResponse = populateCrossContractCallsResponse;
    } catch (cause) {
      error(new Error('Failed to populate cross contract calls.', { cause }));
      return;
    }

    try {
      let txHash: string;
      let nonce: Optional<number>;
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
          true, populateResponse.preTransactionPOIsPerTxidLeafPerList,
        );
      } else {
        throw new Error(
          'Must send with public broadcaster or self broadcast wallet',
        );
      }

      const broadcasterRailgunAddress = !sendWithPublicWallet
        ? selectedBroadcaster?.railgunAddress
        : undefined;

      await saveTransaction(
        txHash,
        sendWithPublicWallet,
        publicWalletOverride?.ethAddress,
        broadcasterFeeERC20Amount,
        broadcasterRailgunAddress,
        nonce,
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
        new Error(`Transaction could not be executed.`, { cause }),
        isBroadcasterError,
      );
      return undefined;
    }
  };

  const getGasEstimate: GetGasEstimateProofRequired = async (
    txidVersion: TXIDVersion,
    networkName: NetworkName,
    railWalletID: string,
    _memoText: Optional<string>,
    _tokenAmounts: ERC20Amount[],
    _nftAmountRecipients: NFTAmountRecipient[],
    originalGasDetails: TransactionGasDetails,
    feeTokenDetails: Optional<FeeTokenDetails>,
    sendWithPublicWallet: boolean,
  ) => {
    return authenticatedWalletService.getGasEstimatesForUnprovenCrossContractCalls(
      txidVersion,
      networkName,
      railWalletID,
      relayAdaptUnshieldERC20Amounts,
      relayAdaptUnshieldNFTAmounts,
      relayAdaptShieldERC20Recipients,
      relayAdaptShieldNFTRecipients,
      crossContractCalls,
      originalGasDetails,
      feeTokenDetails,
      sendWithPublicWallet,
      recipeOutput.minGasLimit,
    );
  };

  const balanceBucketFilter = [RailgunWalletBalanceBucket.Spendable];

  return (
    <>
      <ReviewTransactionView
        confirmButtonText={confirmButtonText}
        backButtonText={backButtonText}
        goBack={goBack}
        getGasEstimate={getGasEstimate}
        performTransaction={performTransaction}
        performGenerateProof={generateProof}
        fromWalletAddress={railgunAddress}
        onSuccessCallback={onSuccess}
        isFullyPrivateTransaction={true}
        balanceBucketFilter={balanceBucketFilter}
        erc20AmountRecipients={relayAdaptUnshieldERC20AmountRecipients}
        nftAmountRecipients={nftAmountRecipientsRef.current}
        infoCalloutText={infoCalloutText}
        processingText={processingText}
        transactionType={transactionType}
        swapQuote={swapQuote}
        swapBuyTokenAmount={swapBuyTokenAmount}
        receivedMinimumAmounts={receivedMinimumAmounts}
        swapQuoteOutdated={swapQuoteOutdated}
        swapDestinationAddress={swapDestinationAddress}
        setSwapDestinationAddress={setSwapDestinationAddress}
        updateSwapQuote={updateSwapQuote}
        onBroadcasterFeeUpdate={onBroadcasterFeeUpdate}
        useRelayAdapt={true}
        showCustomNonce={false}
        relayAdaptUnshieldERC20Amounts={relayAdaptUnshieldERC20Amounts}
        relayAdaptUnshieldNFTAmounts={relayAdaptUnshieldNFTAmounts}
        relayAdaptShieldERC20Recipients={relayAdaptShieldERC20Recipients}
        relayAdaptShieldNFTRecipients={relayAdaptShieldNFTRecipients}
        crossContractCalls={crossContractCalls}
        recipeOutput={recipeOutput}
        vault={vault}
        pool={pool}
        setSlippagePercent={setSlippagePercent}
        slippagePercent={slippagePercent}
      />
      {isRefreshingRecipeOutput && (
        <FullScreenSpinner text="Updating Recipe..." />
      )}
    </>
  );
};
