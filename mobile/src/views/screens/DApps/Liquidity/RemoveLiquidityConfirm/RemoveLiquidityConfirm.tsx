import {
  isDefined,
  NFTAmountRecipient,
  RailgunERC20Recipient,
} from "@railgun-community/shared-models";
import React, { useRef, useState } from "react";
import { DAppsStackParamList } from "@models/navigation-models";
import {
  CommonActions,
  NavigationProp,
  RouteProp,
  StackActions,
} from "@react-navigation/native";
import {
  compareERC20AmountArrays,
  createERC20TokenFromRecipeERC20Info,
  ERC20Amount,
  ERC20AmountRecipient,
  ERC20Token,
  ERC20TokenAddressOnly,
  getTokenIconKeyForPair,
  SavedTransactionService,
  SharedConstants,
  TransactionType,
  useAdjustedRecipeUnshieldERC20Amount,
  useAppDispatch,
  useMemoCustomCompare,
  useMountTimer,
  useReduxSelector,
  useRemoveLiquidityRecipe,
  useUpdatingERC20Amount,
} from "@react-shared";
import { RecipeLoadingView } from "@views/components/views/RecipeLoadingView/RecipeLoadingView";
import { CrossContractReviewTransactionView } from "@views/components/views/ReviewTransactionView/CrossContractReviewTransactionView";

type Props = {
  navigation: NavigationProp<DAppsStackParamList, "RemoveLiquidityConfirm">;
  route: RouteProp<
    { params: DAppsStackParamList["RemoveLiquidityConfirm"] },
    "params"
  >;
};
export const RemoveLiquidityConfirm: React.FC<Props> = ({
  navigation,
  route,
}) => {
  const { liquidityPool, tokenAmount } = route.params;
  const dispatch = useAppDispatch();
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");
  const { txidVersion } = useReduxSelector("txidVersion");

  const activeWallet = wallets.active;
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
    removeLiquidityData,
    tokenAMinimum,
    tokenBMinimum,
  } = useRemoveLiquidityRecipe(liquidityPool, tokenAmount, slippagePercent);

  const tokenLP: ERC20Token = {
    name: liquidityPool.pairTokenName,
    address: liquidityPool.pairAddress,
    decimals: Number(liquidityPool.pairTokenDecimals),
    isBaseToken: false,
    symbol: liquidityPool.pairTokenSymbol,
    icon: getTokenIconKeyForPair(liquidityPool.uniswapV2Fork),
  };
  const amountRecipientTokenLP: ERC20AmountRecipient = {
    token: tokenLP,
    amountString:
      removeLiquidityData?.lpERC20Amount.amount.toString() ??
      tokenAmount.amountString,
    recipientAddress:
      removeLiquidityData?.lpERC20Amount.recipient ?? liquidityPool.pairAddress,
    externalUnresolvedToWalletAddress: undefined,
  };
  const { unshieldERC20AmountAdjusted: unshieldAdjustedTokenAmountLP } =
    useAdjustedRecipeUnshieldERC20Amount(
      amountRecipientTokenLP,
      currentBroadcasterFeeTokenAmount
    );
  const unshieldERC20AmountRecipientLP =
    unshieldAdjustedTokenAmountLP ?? amountRecipientTokenLP;
  const relayAdaptUnshieldERC20Amounts: ERC20Amount[] = useMemoCustomCompare(
    [unshieldERC20AmountRecipientLP],
    compareERC20AmountArrays
  );

  const { mountTimerCompleted } = useMountTimer(
    SharedConstants.RECIPE_LOADING_VIEW_MIN_DISPLAY_TIME
  );

  if (!activeWallet || activeWallet.isViewOnlyWallet) {
    return null;
  }

  if (
    !mountTimerCompleted ||
    isDefined(recipeError) ||
    !isDefined(recipeOutput) ||
    !isDefined(removeLiquidityData)
  ) {
    return (
      <RecipeLoadingView
        recipeError={recipeError}
        recipeName="Remove Liquidity"
        goBack={() => navigation.goBack()}
      />
    );
  }

  const railgunAddress = activeWallet.railAddress;
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
  const receivedTokenA: ERC20TokenAddressOnly = {
    address: removeLiquidityData?.expectedERC20AmountA.tokenAddress,
    decimals: Number(removeLiquidityData?.expectedERC20AmountA.decimals),
    isAddressOnly: true,
    isBaseToken: removeLiquidityData?.expectedERC20AmountA.isBaseToken,
  };
  const receivedTokenB: ERC20TokenAddressOnly = {
    address: removeLiquidityData?.expectedERC20AmountB.tokenAddress,
    decimals: Number(removeLiquidityData?.expectedERC20AmountB.decimals),
    isAddressOnly: true,
    isBaseToken: removeLiquidityData?.expectedERC20AmountB.isBaseToken,
  };
  const receivedERC20AmountRecipients: ERC20AmountRecipient[] = [
    {
      token: receivedTokenA,
      amountString: removeLiquidityData.expectedERC20AmountA.amount.toString(),
      recipientAddress: railgunAddress,
      externalUnresolvedToWalletAddress: undefined,
    },
    {
      token: receivedTokenB,
      amountString: removeLiquidityData.expectedERC20AmountB.amount.toString(),
      recipientAddress: railgunAddress,
      externalUnresolvedToWalletAddress: undefined,
    },
  ];
  const relayAdaptShieldERC20Recipients: RailgunERC20Recipient[] =
    recipeOutput.erc20AmountRecipients.map(({ tokenAddress, recipient }) => ({
      tokenAddress,
      recipientAddress: recipient,
    }));
  const receivedTokenAMinimumAmount: Optional<ERC20Amount> = isDefined(
    tokenAMinimum
  )
    ? {
        token: receivedTokenA,
        amountString: tokenAMinimum,
      }
    : undefined;
  const receivedTokenBMinimumAmount: Optional<ERC20Amount> = isDefined(
    tokenBMinimum
  )
    ? {
        token: receivedTokenB,
        amountString: tokenBMinimum,
      }
    : undefined;
  const receivedMinimumAmounts =
    isDefined(receivedTokenAMinimumAmount) &&
    isDefined(receivedTokenBMinimumAmount)
      ? [receivedTokenAMinimumAmount, receivedTokenBMinimumAmount]
      : undefined;

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
      TransactionType.RemoveLiquidity,
      txHash,
      railgunAddress,
      publicExecutionWalletAddress,
      liquidityPool,
      [unshieldERC20AmountRecipientLP],
      receivedERC20AmountRecipients,
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

  const onSuccess = () => {
    navigation.dispatch(StackActions.pop(2));
    navigation.dispatch(CommonActions.navigate("WalletsScreen"));
  };

  const handleSlippagePercent = (percent: number) => {
    setSlippagePercent(percent);
  };

  const confirmButtonText = "Confirm";
  const infoCalloutText = `Removing liquidity from ${liquidityPool.name} and redeeming ${liquidityPool.pairTokenSymbol} tokens.`;
  const processingText = `Removing liquidity from ${liquidityPool.name}...`;

  return (
    <CrossContractReviewTransactionView
      pool={liquidityPool}
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
      isRefreshingRecipeOutput={isLoadingRecipeOutput}
      transactionType={TransactionType.RemoveLiquidity}
      crossContractCalls={recipeOutput.crossContractCalls}
      relayAdaptUnshieldERC20Amounts={relayAdaptUnshieldERC20Amounts}
      relayAdaptShieldERC20Recipients={relayAdaptShieldERC20Recipients}
      relayAdaptUnshieldNFTAmounts={relayAdaptUnshieldNFTAmountsRef.current}
      relayAdaptShieldNFTRecipients={relayAdaptShieldNFTRecipientsRef.current}
    />
  );
};
