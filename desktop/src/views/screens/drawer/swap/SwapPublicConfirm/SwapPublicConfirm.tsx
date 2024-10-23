import { ZeroXConfig, ZeroXV2Quote } from '@railgun-community/cookbook';
import {
  EVMGasType,
  isDefined,
  NetworkName,
  NFTAmountRecipient,
  RailgunWalletBalanceBucket,
  SelectedBroadcaster,
  TransactionGasDetails,
  TXIDVersion,
} from '@railgun-community/shared-models';
import { useRef, useState } from 'react';
import { ContractTransaction } from 'ethers';
import { EVENT_CLOSE_DRAWER, SwapPublicData } from '@models/drawer-types';
import {
  AdjustedERC20AmountRecipientGroup,
  AvailableWallet,
  compareERC20AmountRecipientArrays,
  delay,
  ERC20Amount,
  ERC20AmountRecipient,
  executeTransaction,
  NonceStorageService,
  ProviderService,
  SavedTransactionService,
  TransactionType,
  useAppDispatch,
  useMemoCustomCompare,
  usePublicSwapAdjustedSellERC20Amount,
  useReduxSelector,
  useUpdatingPublicSwapQuote,
} from '@react-shared';
import { ReviewTransactionView } from '@screens/drawer/review-transaction/ReviewTransactionView';
import { EnterPasswordModal } from '@screens/modals/EnterPasswordModal/EnterPasswordModal';
import { appEventsBus, SWAP_COMPLETE } from '@services/navigation/app-events';
import { drawerEventsBus } from '@services/navigation/drawer-events';
import { WalletSecureStorageWeb } from '@services/wallet/wallet-secure-service-web';

type Props = SwapPublicData;

export const SwapPublicConfirm = ({
  sellERC20Amount,
  buyERC20,
  originalSlippagePercentage,
  originalQuote,
}: Props) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const { remoteConfig } = useReduxSelector('remoteConfig');

  const dispatch = useAppDispatch();
  const [authKey, setAuthKey] = useState<Optional<string>>();
  const [currentGasDetails, setCurrentGasDetails] =
    useState<Optional<TransactionGasDetails>>(undefined);

  const [slippagePercent, setSlippagePercent] = useState(
    originalSlippagePercentage,
  );

  const nftAmountRecipientsRef = useRef<NFTAmountRecipient[]>([]);

  const sellERC20AmountRecipient: ERC20AmountRecipient = {
    ...sellERC20Amount,
    recipientAddress: '0x API',
    externalUnresolvedToWalletAddress: undefined,
  };

  const { sellERC20AmountAdjusted, finalSellTokenAmount } =
    usePublicSwapAdjustedSellERC20Amount(
      sellERC20AmountRecipient,
      currentGasDetails,
    );

  const sellERC20AmountRecipients: ERC20AmountRecipient[] =
    useMemoCustomCompare(
      [sellERC20AmountAdjusted ?? sellERC20AmountRecipient],
      compareERC20AmountRecipientArrays,
    );

  ZeroXConfig.PROXY_API_DOMAIN = remoteConfig.current?.proxyApiUrl;
  const { quoteOutdated, updateQuote, lockedQuote } =
    useUpdatingPublicSwapQuote(
      originalQuote,
      sellERC20AmountAdjusted,
      buyERC20,
      slippagePercent,
      ZeroXV2Quote.getSwapQuote,
    );

  if (!isDefined(authKey)) {
    return (
      <EnterPasswordModal
        success={setAuthKey}
        onDismiss={() => {
          drawerEventsBus.dispatch(EVENT_CLOSE_DRAWER);
        }}
      />
    );
  }

  const { buyERC20Amount, crossContractCall } = lockedQuote;
  const buyERC20AmountRecipient: ERC20AmountRecipient = {
    token: buyERC20,
    amountString: buyERC20Amount.amount.toString(),
    recipientAddress: '0x API',
    externalUnresolvedToWalletAddress: undefined,
  };

  const onTransactionGasDetailsUpdate = (
    gasDetails: Optional<TransactionGasDetails>,
  ) => {
    setCurrentGasDetails(gasDetails);
  };

  const transactionType = TransactionType.Swap;

  const activeWallet = wallets.active;
  if (!activeWallet || activeWallet.isViewOnlyWallet) {
    return null;
  }

  const fromWalletAddress = activeWallet.ethAddress;
  const walletSecureService = new WalletSecureStorageWeb(authKey);

  const onSuccess = () => {
    appEventsBus.dispatch(SWAP_COMPLETE);
    drawerEventsBus.dispatch(EVENT_CLOSE_DRAWER);
  };

  const performTransaction = async (
    _finalAdjustedERC20AmountRecipientGroup: AdjustedERC20AmountRecipientGroup,
    _nftAmountRecipients: NFTAmountRecipient[],
    _selectedBroadcaster: Optional<SelectedBroadcaster>,
    _broadcasterFeeERC20Amount: Optional<ERC20Amount>,
    transactionGasDetails: TransactionGasDetails,
    customNonce: Optional<number>,
    _publicWalletOverride: Optional<AvailableWallet>,
    _showSenderAddressToRecipient: boolean,
    _memoText: Optional<string>,
    success: () => void,
    error: (err: Error) => void,
  ): Promise<Optional<string>> => {
    try {
      const transactionWithGas: ContractTransaction = {
        ...crossContractCall,
      };
      if (isDefined(transactionGasDetails)) {
        transactionWithGas.type = transactionGasDetails.evmGasType;
        switch (transactionGasDetails.evmGasType) {
          case EVMGasType.Type0:
          case EVMGasType.Type1: {
            transactionWithGas.gasPrice = transactionGasDetails.gasPrice;
            break;
          }
          case EVMGasType.Type2: {
            transactionWithGas.maxFeePerGas =
              transactionGasDetails.maxFeePerGas;
            transactionWithGas.maxPriorityFeePerGas =
              transactionGasDetails.maxPriorityFeePerGas;
            break;
          }
        }
      }

      const provider = await ProviderService.getProvider(network.current.name);
      const nonceStorageService = new NonceStorageService();
      const nonce = await nonceStorageService.getNextTransactionNonce(
        provider,
        fromWalletAddress,
        network.current.name,
        customNonce,
      );
      transactionWithGas.nonce = nonce;

      const pKey = await walletSecureService.getWallet0xPKey(activeWallet);
      const [txResponse] = await Promise.all([
        executeTransaction(pKey, network.current.name, transactionWithGas),
        delay(500),
      ]);
      const transactionService = new SavedTransactionService(dispatch);
      await transactionService.saveSwapTransaction(
        undefined, txResponse.hash,
        fromWalletAddress,
        fromWalletAddress, finalSellTokenAmount ?? sellERC20Amount,
        buyERC20AmountRecipient,
        undefined, network.current,
        false, false, false, undefined, undefined, undefined, txResponse.nonce,
      );
      success();
      return txResponse.hash;
    } catch (cause) {
      error(new Error('Failed to execute public swap.', { cause }));
      return undefined;
    }
  };

  const getGasEstimate = async (
    _txidVersion: TXIDVersion,
    networkName: NetworkName,
    fromWalletAddress: string,
    _tokenAmounts: ERC20Amount[],
  ) => {
    const provider = await ProviderService.getProvider(networkName);
    return provider.estimateGas({
      ...crossContractCall,
      from: fromWalletAddress,
    });
  };

  const handleSlippagePercent = (percent: number) => {
    setSlippagePercent(percent);
  };

  const infoCalloutText = `Swapping tokens via public wallet.`;
  const processingText = 'Swapping tokens...';

  const balanceBucketFilter = [RailgunWalletBalanceBucket.Spendable];

  return (
    <ReviewTransactionView
      backButtonText="Cancel"
      confirmButtonText="Swap"
      getGasEstimate={getGasEstimate}
      performTransaction={performTransaction}
      fromWalletAddress={fromWalletAddress}
      onSuccessCallback={onSuccess}
      isFullyPrivateTransaction={false}
      balanceBucketFilter={balanceBucketFilter}
      erc20AmountRecipients={sellERC20AmountRecipients}
      nftAmountRecipients={nftAmountRecipientsRef.current}
      infoCalloutText={infoCalloutText}
      processingText={processingText}
      transactionType={transactionType}
      swapQuote={lockedQuote}
      swapQuoteOutdated={quoteOutdated}
      updateSwapQuote={updateQuote}
      setSlippagePercent={handleSlippagePercent}
      slippagePercent={slippagePercent}
      swapBuyTokenAmount={buyERC20AmountRecipient}
      useRelayAdapt={false}
      showCustomNonce={true}
      onTransactionGasDetailsUpdate={onTransactionGasDetailsUpdate}
    />
  );
};
