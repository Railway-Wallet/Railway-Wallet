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
  SelectedRelayer,
  TransactionGasDetails,
  TXIDVersion,
} from '@railgun-community/shared-models';
import React, { useRef } from 'react';
import { ContractTransaction } from 'ethers';
import { DAppsStackParamList } from '@models/navigation-models';
import { NavigationProp } from '@react-navigation/native';
import {
  AdjustedERC20AmountRecipientGroup,
  AuthenticatedWalletService,
  AvailableWallet,
  createRelayerFeeERC20AmountRecipient,
  delay,
  ERC20Amount,
  ERC20AmountRecipient,
  executeWithoutRelayer,
  GetGasEstimateProofRequired,
  getOverallBatchMinGasPrice,
  getPOIRequiredForNetwork,
  POIProofEventStatusUI,
  relayTransaction,
  TransactionType,
  UnauthenticatedWalletService,
  updatePOIProofProgressStatus,
  useAppDispatch,
  useReduxSelector,
  Vault,
} from '@react-shared';
import { getOrCreateDbEncryptionKey } from '@services/core/db';
import { WalletSecureServiceReactNative } from '@services/wallet/wallet-secure-service-react-native';
import { FullScreenSpinner } from '../../loading/FullScreenSpinner/FullScreenSpinner';
import { ReviewTransactionView } from './ReviewTransactionView';

type Props = {
  navigation: NavigationProp<
    DAppsStackParamList,
    | 'SwapPublicConfirm'
    | 'SwapPrivateConfirm'
    | 'FarmVaultConfirm'
    | 'AddLiquidityConfirm'
    | 'RemoveLiquidityConfirm'
  >;
  crossContractCalls: ContractTransaction[];
  saveTransaction: (
    txHash: string,
    sendWithPublicWallet: boolean,
    publicExecutionWalletAddress: Optional<string>,
    relayerFeeERC20Amount: Optional<ERC20Amount>,
    relayerRailgunAddress: Optional<string>,
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
  onRelayerFeeUpdate?: (relayerFeeERC20Amount: Optional<ERC20Amount>) => void;

  receivedMinimumAmounts?: ERC20Amount[];
  recipeOutput: RecipeOutput;
  isRefreshingRecipeOutput: boolean;

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
  navigation,
  crossContractCalls,
  saveTransaction,
  onSuccess,
  transactionType,
  relayAdaptUnshieldERC20Amounts,
  relayAdaptUnshieldNFTAmounts,
  relayAdaptShieldERC20Recipients,
  relayAdaptShieldNFTRecipients,
  infoCalloutText,
  processingText,
  confirmButtonText,
  swapQuote,
  swapBuyTokenAmount,
  swapQuoteOutdated,
  receivedMinimumAmounts,
  swapDestinationAddress,
  setSwapDestinationAddress,
  updateSwapQuote,
  onRelayerFeeUpdate,
  setSlippagePercent,
  slippagePercent,
  recipeOutput,
  isRefreshingRecipeOutput,
  vault,
  pool,
}) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const { txidVersion } = useReduxSelector('txidVersion');
  const dispatch = useAppDispatch();

  const nftAmountRecipientsRef = useRef<NFTAmountRecipient[]>([]);

  const activeWallet = wallets.active;
  if (!activeWallet || activeWallet.isViewOnlyWallet) {
    return null;
  }

  const railgunAddress = activeWallet.railAddress;
  const { railWalletID } = activeWallet;

  const relayAdaptUnshieldERC20AmountRecipients: ERC20AmountRecipient[] =
    relayAdaptUnshieldERC20Amounts.map(tokenAmount => ({
      token: tokenAmount.token,
      amountString: tokenAmount.amountString,
      recipientAddress: NETWORK_CONFIG[network.current.name].relayAdaptContract,
      externalUnresolvedToWalletAddress: undefined,
    }));

  const walletSecureService = new WalletSecureServiceReactNative();
  const authenticatedWalletService = new AuthenticatedWalletService(
    getOrCreateDbEncryptionKey(),
  );
  const unauthenticatedWalletService = new UnauthenticatedWalletService();

  const generateProof = async (
    _finalERC20AmountRecipients: ERC20AmountRecipient[],
    _nftAmountRecipients: NFTAmountRecipient[],
    selectedRelayer: Optional<SelectedRelayer>,
    relayerFeeERC20Amount: Optional<ERC20Amount>,
    publicWalletOverride: Optional<AvailableWallet>,
    _showSenderAddressToRecipient: boolean,
    _memoText: Optional<string>,
    overallBatchMinGasPrice: Optional<bigint>,
    success: () => void,
    error: (err: Error) => void,
  ) => {
    if (!selectedRelayer && !publicWalletOverride) {
      error(new Error('No public relayer selected.'));
      return;
    }
    if (!relayerFeeERC20Amount && !publicWalletOverride) {
      error(new Error('No fee amount selected.'));
      return;
    }
    try {
      const sendWithPublicWallet = isDefined(publicWalletOverride);

      const relayerFeeERC20AmountRecipient =
        createRelayerFeeERC20AmountRecipient(
          selectedRelayer,
          relayerFeeERC20Amount,
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
          relayerFeeERC20AmountRecipient,
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
    if (!selectedRelayer && !publicWalletOverride) {
      error(new Error('No public relayer or self relay wallet selected.'));
      return;
    }
    if (!relayerFeeERC20Amount && !publicWalletOverride) {
      error(new Error('No gas fee amount found.'));
      return;
    }

    const sendWithPublicWallet = isDefined(publicWalletOverride);

    const overallBatchMinGasPrice = getOverallBatchMinGasPrice(
      isDefined(selectedRelayer),
      transactionGasDetails,
    );

    const relayerFeeERC20AmountRecipient = createRelayerFeeERC20AmountRecipient(
      selectedRelayer,
      relayerFeeERC20Amount,
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
          relayerFeeERC20AmountRecipient,
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
          true, populateResponse.preTransactionPOIsPerTxidLeafPerList,
        );
      } else {
        throw new Error('Must send with public relayer or self relay wallet');
      }

      const relayerRailgunAddress = !sendWithPublicWallet
        ? selectedRelayer?.railgunAddress
        : undefined;

      await saveTransaction(
        txHash,
        sendWithPublicWallet,
        publicWalletOverride?.ethAddress,
        relayerFeeERC20Amount,
        relayerRailgunAddress,
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
      const isRelayerError = true;
      error(
        new Error(`Transaction could not be executed.`, { cause }),
        isRelayerError,
      );
      return undefined;
    }
  };

  const getGasEstimate: GetGasEstimateProofRequired = async (
    _txidVersion: TXIDVersion,
    networkName: NetworkName,
    railWalletID: string,
    _memoText: Optional<string>,
    _erc20Amounts: ERC20Amount[],
    _nftAmountRecipients: NFTAmountRecipient[],
    originalGasDetails: TransactionGasDetails,
    feeTokenDetails: Optional<FeeTokenDetails>,
    sendWithPublicWallet: boolean,
  ) => {
    return authenticatedWalletService.getGasEstimatesForUnprovenCrossContractCalls(
      txidVersion.current,
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

  return (
    <>
      <ReviewTransactionView
        navigation={navigation}
        confirmButtonText={confirmButtonText}
        getGasEstimate={getGasEstimate}
        performTransaction={performTransaction}
        performGenerateProof={generateProof}
        receivedMinimumAmounts={receivedMinimumAmounts}
        fromWalletAddress={railgunAddress}
        onSuccessCallback={onSuccess}
        isFullyPrivateTransaction={true}
        erc20AmountRecipients={relayAdaptUnshieldERC20AmountRecipients}
        nftAmountRecipients={nftAmountRecipientsRef.current}
        infoCalloutText={infoCalloutText}
        processingText={processingText}
        transactionType={transactionType}
        swapQuote={swapQuote}
        swapBuyTokenAmount={swapBuyTokenAmount}
        swapQuoteOutdated={swapQuoteOutdated}
        swapDestinationAddress={swapDestinationAddress}
        setSwapDestinationAddress={setSwapDestinationAddress}
        updateSwapQuote={updateSwapQuote}
        useRelayAdapt={true}
        showCustomNonce={false}
        relayAdaptUnshieldERC20Amounts={relayAdaptUnshieldERC20Amounts}
        relayAdaptUnshieldNFTAmounts={relayAdaptUnshieldNFTAmounts}
        relayAdaptShieldERC20Recipients={relayAdaptShieldERC20Recipients}
        relayAdaptShieldNFTRecipients={relayAdaptShieldNFTRecipients}
        crossContractCalls={crossContractCalls}
        onRelayerFeeUpdate={onRelayerFeeUpdate}
        recipeOutput={recipeOutput}
        vault={vault}
        pool={pool}
        setSlippagePercent={setSlippagePercent}
        slippagePercent={slippagePercent}
        balanceBucketFilter={[RailgunWalletBalanceBucket.Spendable]}
      />
      <FullScreenSpinner
        show={isRefreshingRecipeOutput}
        text="Updating Recipe..."
      />
    </>
  );
};
