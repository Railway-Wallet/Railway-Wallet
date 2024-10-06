import { ZeroXConfig, ZeroXQuote } from "@railgun-community/cookbook";
import {
  EVMGasType,
  isDefined,
  NetworkName,
  NFTAmountRecipient,
  RailgunWalletBalanceBucket,
  SelectedBroadcaster,
  TransactionGasDetails,
  TXIDVersion,
} from "@railgun-community/shared-models";
import React, { useRef, useState } from "react";
import { ContractTransaction } from "ethers";
import { ReviewTransactionView } from "@components/views/ReviewTransactionView/ReviewTransactionView";
import { DAppsStackParamList } from "@models/navigation-models";
import { NavigationProp, RouteProp } from "@react-navigation/native";
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
} from "@react-shared";
import { WalletSecureServiceReactNative } from "@services/wallet/wallet-secure-service-react-native";

type Props = {
  navigation: NavigationProp<DAppsStackParamList, "SwapPublicConfirm">;
  route: RouteProp<
    { params: DAppsStackParamList["SwapPublicConfirm"] },
    "params"
  >;
};

export const SwapPublicConfirm: React.FC<Props> = ({ navigation, route }) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");
  const { remoteConfig } = useReduxSelector("remoteConfig");

  const {
    sellERC20Amount,
    buyERC20,
    originalSlippagePercentage,
    originalQuote,
    returnBackFromCompletedOrder,
  } = route.params;

  const [slippagePercent, setSlippagePercent] = useState(
    originalSlippagePercentage
  );

  const dispatch = useAppDispatch();

  const nftAmountRecipientsRef = useRef<NFTAmountRecipient[]>([]);

  const [currentGasDetails, setCurrentGasDetails] =
    useState<Optional<TransactionGasDetails>>(undefined);

  const slippagePercentage = originalSlippagePercentage;

  const sellERC20AmountRecipient: ERC20AmountRecipient = {
    ...sellERC20Amount,
    recipientAddress: "0x API",
    externalUnresolvedToWalletAddress: undefined,
  };

  const { sellERC20AmountAdjusted, finalSellTokenAmount } =
    usePublicSwapAdjustedSellERC20Amount(
      sellERC20AmountRecipient,
      currentGasDetails
    );

  const sellERC20AmountRecipients: ERC20AmountRecipient[] =
    useMemoCustomCompare(
      [sellERC20AmountAdjusted ?? sellERC20AmountRecipient],
      compareERC20AmountRecipientArrays
    );

  ZeroXConfig.PROXY_API_DOMAIN = remoteConfig.current?.proxyApiUrl;
  const { quoteOutdated, updateQuote, lockedQuote } =
    useUpdatingPublicSwapQuote(
      originalQuote,
      sellERC20AmountAdjusted,
      buyERC20,
      slippagePercentage,
      ZeroXQuote.getSwapQuote
    );

  const onTransactionGasDetailsUpdate = (
    gasDetails: Optional<TransactionGasDetails>
  ) => {
    setCurrentGasDetails(gasDetails);
  };

  const { buyERC20Amount, crossContractCall } = lockedQuote;
  const buyERC20AmountRecipient: ERC20AmountRecipient = {
    token: buyERC20,
    amountString: buyERC20Amount.amount.toString(),
    recipientAddress: "0x API",
    externalUnresolvedToWalletAddress: undefined,
  };

  const transactionType = TransactionType.Swap;

  const activeWallet = wallets.active;
  if (!activeWallet || activeWallet.isViewOnlyWallet) {
    return null;
  }

  const fromWalletAddress = activeWallet.ethAddress;
  const walletSecureService = new WalletSecureServiceReactNative();

  const onSuccess = () => {
    returnBackFromCompletedOrder();
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
    error: (err: Error) => void
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
        customNonce
      );
      transactionWithGas.nonce = nonce;

      const pKey = await walletSecureService.getWallet0xPKey(activeWallet);
      const [txResponse] = await Promise.all([
        executeTransaction(pKey, network.current.name, transactionWithGas),
        delay(500),
      ]);
      const transactionService = new SavedTransactionService(dispatch);
      await transactionService.saveSwapTransaction(
        undefined,
        txResponse.hash,
        fromWalletAddress,
        fromWalletAddress,
        finalSellTokenAmount ?? sellERC20Amount,
        buyERC20AmountRecipient,
        undefined,
        network.current,
        false,
        false,
        false,
        undefined,
        undefined,
        undefined,
        txResponse.nonce
      );
      success();
      return txResponse.hash;
    } catch (cause) {
      error(new Error("Failed to execute public swap.", { cause }));
      return undefined;
    }
  };

  const getGasEstimate = async (
    _txidVersion: TXIDVersion,
    networkName: NetworkName,
    fromWalletAddress: string,
    _erc20Amounts: ERC20Amount[]
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
  const processingText = "Swapping tokens...";

  return (
    <ReviewTransactionView
      navigation={navigation}
      confirmButtonText="Swap"
      getGasEstimate={getGasEstimate}
      performTransaction={performTransaction}
      fromWalletAddress={fromWalletAddress}
      onSuccessCallback={onSuccess}
      setSlippagePercent={handleSlippagePercent}
      slippagePercent={slippagePercent}
      isFullyPrivateTransaction={false}
      erc20AmountRecipients={sellERC20AmountRecipients}
      nftAmountRecipients={nftAmountRecipientsRef.current}
      infoCalloutText={infoCalloutText}
      processingText={processingText}
      transactionType={transactionType}
      swapQuote={lockedQuote}
      swapQuoteOutdated={quoteOutdated}
      updateSwapQuote={updateQuote}
      swapBuyTokenAmount={buyERC20AmountRecipient}
      useRelayAdapt={false}
      showCustomNonce={true}
      onTransactionGasDetailsUpdate={onTransactionGasDetailsUpdate}
      balanceBucketFilter={[RailgunWalletBalanceBucket.Spendable]}
    />
  );
};
