import {
  isDefined,
  NFTAmountRecipient,
  RailgunERC20Recipient,
} from "@railgun-community/shared-models";
import React, { useMemo, useRef, useState } from "react";
import { RecipeLoadingView } from "@components/views/RecipeLoadingView/RecipeLoadingView";
import { CrossContractReviewTransactionView } from "@components/views/ReviewTransactionView/CrossContractReviewTransactionView";
import { DAppsStackParamList } from "@models/navigation-models";
import {
  CommonActions,
  NavigationProp,
  RouteProp,
  StackActions,
} from "@react-navigation/native";
import {
  compareERC20AmountArrays,
  compareTokenAddress,
  convertSerializedToLiquidityPool,
  createERC20TokenFromRecipeERC20Info,
  ERC20Amount,
  ERC20AmountRecipient,
  ERC20Token,
  SavedTransactionService,
  SharedConstants,
  TransactionType,
  useAddLiquidityRecipe,
  useAdjustedRecipeUnshieldERC20Amount,
  useAppDispatch,
  useMemoCustomCompare,
  useMountTimer,
  useReduxSelector,
  useUpdatingERC20Amount,
} from "@react-shared";

type Props = {
  navigation: NavigationProp<DAppsStackParamList, "AddLiquidityConfirm">;
  route: RouteProp<
    { params: DAppsStackParamList["AddLiquidityConfirm"] },
    "params"
  >;
};

export const AddLiquidityConfirm: React.FC<Props> = ({ navigation, route }) => {
  const { selectedPoolSerialized, tokenAmountA, tokenAmountB } = route.params;
  const selectedPool = useMemo(
    () => convertSerializedToLiquidityPool(selectedPoolSerialized),
    [selectedPoolSerialized]
  );

  const dispatch = useAppDispatch();
  const { wallets } = useReduxSelector("wallets");
  const { network } = useReduxSelector("network");
  const { txidVersion } = useReduxSelector("txidVersion");

  const relayAdaptUnshieldNFTAmountsRef = useRef<NFTAmountRecipient[]>([]);
  const relayAdaptShieldNFTRecipientsRef = useRef<NFTAmountRecipient[]>([]);
  const [slippagePercent, setSlippagePercent] = useState(
    SharedConstants.DEFAULT_SLIPPAGE_PRIVATE_TXS
  );

  const {
    currentERC20Amount: currentBroadcasterFeeTokenAmount,
    onERC20AmountUpdate: onBroadcasterFeeUpdate,
  } = useUpdatingERC20Amount();

  const {
    isLoadingRecipeOutput,
    recipeError,
    recipeOutput,
    tokenUnshieldAmountB,
    lpMinimum,
  } = useAddLiquidityRecipe(selectedPool, tokenAmountA, slippagePercent);

  const amountRecipientTokenA: ERC20AmountRecipient = useMemo(
    () => ({
      ...tokenAmountA,
      recipientAddress: selectedPool.name,
      externalUnresolvedToWalletAddress: undefined,
    }),
    [selectedPool.name, tokenAmountA]
  );
  const amountRecipientTokenB: ERC20AmountRecipient = useMemo(
    () => ({
      ...(tokenUnshieldAmountB ?? tokenAmountB),
      recipientAddress: selectedPool.name,
      externalUnresolvedToWalletAddress: undefined,
    }),
    [selectedPool.name, tokenAmountB, tokenUnshieldAmountB]
  );

  const { unshieldERC20AmountAdjusted: unshieldAdjustedTokenAmountA } =
    useAdjustedRecipeUnshieldERC20Amount(
      amountRecipientTokenA,
      currentBroadcasterFeeTokenAmount
    );
  const { unshieldERC20AmountAdjusted: unshieldAdjustedTokenAmountB } =
    useAdjustedRecipeUnshieldERC20Amount(
      amountRecipientTokenB,
      currentBroadcasterFeeTokenAmount
    );

  const unshieldERC20AmountRecipientA =
    unshieldAdjustedTokenAmountA ?? amountRecipientTokenA;
  const unshieldERC20AmountRecipientB =
    unshieldAdjustedTokenAmountB ?? amountRecipientTokenB;

  const relayAdaptUnshieldERC20Amounts: ERC20Amount[] = useMemoCustomCompare(
    [unshieldERC20AmountRecipientA, unshieldERC20AmountRecipientB],
    compareERC20AmountArrays
  );

  const { mountTimerCompleted } = useMountTimer(
    SharedConstants.RECIPE_LOADING_VIEW_MIN_DISPLAY_TIME
  );

  if (
    !mountTimerCompleted ||
    isDefined(recipeError) ||
    !isDefined(recipeOutput) ||
    !isDefined(tokenUnshieldAmountB)
  ) {
    return (
      <RecipeLoadingView
        recipeError={recipeError}
        recipeName="Add Liquidity"
        goBack={() => navigation.goBack()}
      />
    );
  }

  const relayAdaptShieldERC20Recipients: RailgunERC20Recipient[] =
    recipeOutput.erc20AmountRecipients.map(({ tokenAddress, recipient }) => ({
      tokenAddress,
      recipientAddress: recipient,
    }));

  const activeWallet = wallets.active;
  if (!activeWallet || activeWallet.isViewOnlyWallet) {
    return null;
  }

  const railgunAddress = activeWallet.railAddress;

  const receivedTokenAddress = selectedPool.pairAddress;
  const receivedRecipeERC20Amount = recipeOutput.erc20AmountRecipients.find(
    (recipeERC20AmountRecipient) =>
      compareTokenAddress(
        recipeERC20AmountRecipient.tokenAddress,
        receivedTokenAddress
      )
  );
  if (!isDefined(receivedRecipeERC20Amount)) {
    return null;
  }

  const receivedERC20Token: ERC20Token = createERC20TokenFromRecipeERC20Info(
    activeWallet,
    network.current.name,
    receivedRecipeERC20Amount
  );
  const feeERC20Amounts: ERC20Amount[] =
    recipeOutput.feeERC20AmountRecipients.map((feeERC20Amount) => {
      return {
        token: createERC20TokenFromRecipeERC20Info(
          activeWallet,
          network.current.name,
          feeERC20Amount
        ),
        amountString: feeERC20Amount.amount.toString(),
      };
    });

  const receivedERC20AmountRecipient: ERC20AmountRecipient = {
    token: receivedERC20Token,
    amountString: receivedRecipeERC20Amount.amount.toString(),
    recipientAddress: selectedPool.name,
    externalUnresolvedToWalletAddress: undefined,
  };
  const receivedLPTokenMinimumAmount: Optional<ERC20Amount> = isDefined(
    lpMinimum
  )
    ? {
        token: receivedERC20Token,
        amountString: lpMinimum,
      }
    : undefined;
  const receivedMinimumAmounts = receivedLPTokenMinimumAmount
    ? [receivedLPTokenMinimumAmount]
    : undefined;

  const onSuccess = () => {
    navigation.dispatch(StackActions.pop(2));
    navigation.dispatch(CommonActions.navigate("WalletsScreen"));
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
    await transactionService.saveLiquidityTransaction(
      txidVersion.current,
      TransactionType.AddLiquidity,
      txHash,
      railgunAddress,
      publicExecutionWalletAddress,
      selectedPool,
      [unshieldERC20AmountRecipientA, unshieldERC20AmountRecipientB],
      [receivedERC20AmountRecipient],
      network.current,
      !sendWithPublicWallet,
      true,
      true,
      feeERC20Amounts,
      broadcasterFeeERC20Amount,
      broadcasterRailgunAddress,
      nonce
    );
  };

  const handleSlippagePercent = (percent: number) => {
    setSlippagePercent(percent);
  };

  const confirmButtonText = "Confirm";
  const processingText = `Adding liquidity into ${selectedPool.name}...`;
  const infoCalloutText = `Adding liquidity into ${selectedPool.name}. The received ${selectedPool.pairTokenSymbol} tokens will represent this liquidity position, and can be redeemed for the underlying tokens at any time.`;

  return (
    <CrossContractReviewTransactionView
      pool={selectedPool}
      onSuccess={onSuccess}
      navigation={navigation}
      recipeOutput={recipeOutput}
      processingText={processingText}
      infoCalloutText={infoCalloutText}
      saveTransaction={saveTransaction}
      slippagePercent={slippagePercent}
      confirmButtonText={confirmButtonText}
      onBroadcasterFeeUpdate={onBroadcasterFeeUpdate}
      setSlippagePercent={handleSlippagePercent}
      receivedMinimumAmounts={receivedMinimumAmounts}
      transactionType={TransactionType.AddLiquidity}
      isRefreshingRecipeOutput={isLoadingRecipeOutput}
      crossContractCalls={recipeOutput.crossContractCalls}
      relayAdaptUnshieldERC20Amounts={relayAdaptUnshieldERC20Amounts}
      relayAdaptShieldERC20Recipients={relayAdaptShieldERC20Recipients}
      relayAdaptUnshieldNFTAmounts={relayAdaptUnshieldNFTAmountsRef.current}
      relayAdaptShieldNFTRecipients={relayAdaptShieldNFTRecipientsRef.current}
    />
  );
};
