import {
  isDefined,
  NFTAmountRecipient,
  RailgunERC20Recipient,
} from "@railgun-community/shared-models";
import React, { useMemo, useRef, useState } from "react";
import { RecipeLoadingView } from "@components/views/RecipeLoadingView/RecipeLoadingView";
import { CrossContractReviewTransactionView } from "@components/views/ReviewTransactionView/CrossContractReviewTransactionView";
import { DAppsStackParamList } from "@models/navigation-models";
import { NavigationProp, RouteProp } from "@react-navigation/native";
import {
  compareERC20AmountArrays,
  ERC20Amount,
  ERC20AmountRecipient,
  isRailgunAddress,
  SavedTransactionService,
  TransactionType,
  useAdjustedRecipeUnshieldERC20Amount,
  useAppDispatch,
  useMemoCustomCompare,
  useReduxSelector,
  useUpdatingERC20Amount,
  useUpdatingSwapRecipe,
} from "@react-shared";

type Props = {
  navigation: NavigationProp<DAppsStackParamList, "SwapPrivateConfirm">;
  route: RouteProp<
    { params: DAppsStackParamList["SwapPrivateConfirm"] },
    "params"
  >;
};

export const SwapPrivateConfirm: React.FC<Props> = ({ navigation, route }) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");
  const { txidVersion } = useReduxSelector("txidVersion");

  const dispatch = useAppDispatch();

  const {
    originalQuote,
    originalRecipe,
    originalRecipeOutput,
    swapRecipeType,
    sellERC20Amount,
    buyERC20,
    originalSlippagePercentage,
    returnBackFromCompletedOrder,
  } = route.params;

  const [slippagePercent, setSlippagePercent] = useState(
    originalSlippagePercentage
  );

  const {
    currentERC20Amount: currentBroadcasterFeeTokenAmount,
    onERC20AmountUpdate: onBroadcasterFeeUpdate,
  } = useUpdatingERC20Amount();

  const [swapDestinationAddress, setSwapDestinationAddress] =
    useState<Optional<string>>(undefined);

  const relayAdaptUnshieldNFTAmountsRef = useRef<NFTAmountRecipient[]>([]);
  const relayAdaptShieldNFTRecipientsRef = useRef<NFTAmountRecipient[]>([]);

  const transactionType = TransactionType.Swap;

  const sellERC20AmountRecipient: ERC20AmountRecipient = useMemo(
    () => ({
      ...sellERC20Amount,
      recipientAddress: "0x API",
      externalUnresolvedToWalletAddress: undefined,
    }),
    [sellERC20Amount]
  );

  const { unshieldERC20AmountAdjusted } = useAdjustedRecipeUnshieldERC20Amount(
    sellERC20AmountRecipient,
    currentBroadcasterFeeTokenAmount
  );

  const {
    quoteOutdated,
    updateQuote,
    lockedQuote,
    lockedRecipeOutput,
    sellERC20Fee,
    buyERC20Amount,
    buyERC20Minimum,
    buyERC20Fee,
    isLoadingRecipeOutput,
    recipeError,
  } = useUpdatingSwapRecipe(
    swapRecipeType,
    originalRecipe,
    originalRecipeOutput,
    originalQuote,
    unshieldERC20AmountAdjusted,
    buyERC20,
    slippagePercent,
    swapDestinationAddress
  );

  const relayAdaptUnshieldERC20Amounts: ERC20Amount[] = useMemoCustomCompare(
    [unshieldERC20AmountAdjusted ?? sellERC20Amount],
    compareERC20AmountArrays
  );
  const relayAdaptShieldERC20Recipients: RailgunERC20Recipient[] =
    lockedRecipeOutput.erc20AmountRecipients.map(
      ({ tokenAddress, recipient }) => ({
        tokenAddress,
        recipientAddress: recipient,
      })
    );

  const getRecipeName = () => {
    if (!isDefined(swapDestinationAddress)) {
      return "Private Swap";
    }
    if (isRailgunAddress(swapDestinationAddress)) {
      return "Private Swap and Shield";
    }
    return "Private Swap and Transfer";
  };

  if (isDefined(recipeError) || !isDefined(lockedRecipeOutput)) {
    return (
      <RecipeLoadingView
        recipeError={recipeError}
        recipeName={getRecipeName()}
        goBack={() => navigation.goBack()}
      />
    );
  }

  const activeWallet = wallets.active;
  if (!activeWallet || activeWallet.isViewOnlyWallet) {
    return null;
  }

  const buyERC20AmountRecipient: ERC20AmountRecipient = {
    ...buyERC20Amount,
    recipientAddress: "0x API",
    externalUnresolvedToWalletAddress: undefined,
  };

  const railgunAddress = activeWallet.railAddress;

  const onSuccess = () => {
    returnBackFromCompletedOrder();
  };

  const saveTransaction = async (
    txHash: string,
    sendWithPublicWallet: boolean,
    publicExecutionWalletAddress: Optional<string>,
    broadcasterFeeERC20Amount: Optional<ERC20Amount>,
    broadcasterRailgunAddress: Optional<string>,
    nonce: Optional<number>
  ) => {
    const transactionService = new SavedTransactionService(dispatch);
    await transactionService.saveSwapTransaction(
      txidVersion.current,
      txHash,
      railgunAddress,
      publicExecutionWalletAddress,
      unshieldERC20AmountAdjusted ?? sellERC20Amount,
      buyERC20AmountRecipient,
      swapDestinationAddress,
      network.current,
      !sendWithPublicWallet,
      true,
      true,
      [sellERC20Fee, buyERC20Fee],
      broadcasterFeeERC20Amount,
      broadcasterRailgunAddress,
      nonce
    );
  };

  const handleSlippagePercent = (percent: number) => {
    setSlippagePercent(percent);
  };

  const infoCalloutText = `Swapping tokens privately via RAILGUN Adapt module.`;
  const processingText = "Swapping tokens...";
  const confirmButtonText = "Swap";

  return (
    <CrossContractReviewTransactionView
      navigation={navigation}
      confirmButtonText={confirmButtonText}
      infoCalloutText={infoCalloutText}
      processingText={processingText}
      transactionType={transactionType}
      recipeOutput={lockedRecipeOutput}
      isRefreshingRecipeOutput={isLoadingRecipeOutput}
      swapQuote={lockedQuote}
      swapBuyTokenAmount={buyERC20Amount}
      setSlippagePercent={handleSlippagePercent}
      slippagePercent={slippagePercent}
      receivedMinimumAmounts={[buyERC20Minimum]}
      swapQuoteOutdated={quoteOutdated}
      swapDestinationAddress={swapDestinationAddress}
      setSwapDestinationAddress={setSwapDestinationAddress}
      updateSwapQuote={updateQuote}
      crossContractCalls={lockedRecipeOutput.crossContractCalls}
      saveTransaction={saveTransaction}
      onSuccess={onSuccess}
      relayAdaptUnshieldERC20Amounts={relayAdaptUnshieldERC20Amounts}
      relayAdaptUnshieldNFTAmounts={relayAdaptUnshieldNFTAmountsRef.current}
      relayAdaptShieldERC20Recipients={relayAdaptShieldERC20Recipients}
      relayAdaptShieldNFTRecipients={relayAdaptShieldNFTRecipientsRef.current}
      onBroadcasterFeeUpdate={onBroadcasterFeeUpdate}
    />
  );
};
