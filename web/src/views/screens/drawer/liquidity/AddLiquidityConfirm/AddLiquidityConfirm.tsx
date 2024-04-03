import { LiquidityV2Pool } from '@railgun-community/cookbook';
import {
  isDefined,
  NFTAmountRecipient,
  RailgunERC20Recipient,
} from '@railgun-community/shared-models';
import { useMemo, useRef, useState } from 'react';
import { EVENT_CLOSE_DRAWER } from '@models/drawer-types';
import {
  compareERC20AmountArrays,
  compareTokenAddress,
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
} from '@react-shared';
import { drawerEventsBus } from '@services/navigation/drawer-events';
import { RecipeLoadingView } from '@views/components/RecipeLoadingView/RecipeLoadingView';
import { CrossContractReviewTransactionView } from '../../review-transaction/CrossContractReviewTransactionView';
import {
  AddLiquidityConfirmData,
  LiquidityView,
} from '../LiquidityFlow/LiquidityFlow';

type Props = {
  authKey: string;
  selectedPool: LiquidityV2Pool;
  tokenAmountA: ERC20Amount;
  tokenAmountB: ERC20Amount;
  initialSlippagePercent: number;
  handleSetView: (view: LiquidityView, data: AddLiquidityConfirmData) => void;
};

export const AddLiquidityConfirm = ({
  authKey,
  selectedPool,
  tokenAmountA,
  tokenAmountB,
  initialSlippagePercent,
  handleSetView,
}: Props) => {
  const dispatch = useAppDispatch();
  const { wallets } = useReduxSelector('wallets');
  const { network } = useReduxSelector('network');
  const { txidVersion } = useReduxSelector('txidVersion');

  const relayAdaptUnshieldNFTAmountsRef = useRef<NFTAmountRecipient[]>([]);
  const relayAdaptShieldNFTRecipientsRef = useRef<NFTAmountRecipient[]>([]);
  const [slippagePercent, setSlippagePercent] = useState(
    initialSlippagePercent,
  );

  const {
    currentERC20Amount: currentRelayerFeeTokenAmount,
    onERC20AmountUpdate: onRelayerFeeUpdate,
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
    [selectedPool.name, tokenAmountA],
  );
  const amountRecipientTokenB: ERC20AmountRecipient = useMemo(
    () => ({
      ...(tokenUnshieldAmountB ?? tokenAmountB),
      recipientAddress: selectedPool.name,
      externalUnresolvedToWalletAddress: undefined,
    }),
    [selectedPool.name, tokenAmountB, tokenUnshieldAmountB],
  );

  const { unshieldERC20AmountAdjusted: unshieldAdjustedTokenAmountA } =
    useAdjustedRecipeUnshieldERC20Amount(
      amountRecipientTokenA,
      currentRelayerFeeTokenAmount,
    );
  const { unshieldERC20AmountAdjusted: unshieldAdjustedTokenAmountB } =
    useAdjustedRecipeUnshieldERC20Amount(
      amountRecipientTokenB,
      currentRelayerFeeTokenAmount,
    );

  const unshieldERC20AmountRecipientA =
    unshieldAdjustedTokenAmountA ?? amountRecipientTokenA;
  const unshieldERC20AmountRecipientB =
    unshieldAdjustedTokenAmountB ?? amountRecipientTokenB;

  const relayAdaptUnshieldERC20Amounts: ERC20Amount[] = useMemoCustomCompare(
    [unshieldERC20AmountRecipientA, unshieldERC20AmountRecipientB],
    compareERC20AmountArrays,
  );

  const { mountTimerCompleted } = useMountTimer(
    SharedConstants.RECIPE_LOADING_VIEW_MIN_DISPLAY_TIME,
  );

  const goBack = () => {
    handleSetView(LiquidityView.ADD_INITIAL, {
      selectedPool,
      tokenAmountA,
      tokenAmountB,
      slippagePercentage: slippagePercent,
    });
  };

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
        goBack={goBack}
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
    recipeERC20AmountRecipient =>
      compareTokenAddress(
        recipeERC20AmountRecipient.tokenAddress,
        receivedTokenAddress,
      ),
  );
  if (!isDefined(receivedRecipeERC20Amount)) {
    return null;
  }

  const receivedERC20Token: ERC20Token = createERC20TokenFromRecipeERC20Info(
    activeWallet,
    network.current.name,
    receivedRecipeERC20Amount,
  );
  const feeERC20Amounts: ERC20Amount[] =
    recipeOutput.feeERC20AmountRecipients.map(feeERC20Amount => {
      return {
        token: createERC20TokenFromRecipeERC20Info(
          activeWallet,
          network.current.name,
          feeERC20Amount,
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
    lpMinimum,
  )
    ? {
        token: receivedERC20Token,
        amountString: lpMinimum,
      }
    : undefined;

  const onSuccess = () => {
    drawerEventsBus.dispatch(EVENT_CLOSE_DRAWER);
  };

  const saveTransaction = async (
    txHash: string,
    sendWithPublicWallet: boolean,
    publicExecutionWalletAddress: Optional<string>,
    relayerFeeERC20Amount: Optional<ERC20Amount>,
    relayerRailgunAddress: Optional<string>,
    nonce: Optional<number>,
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
      !sendWithPublicWallet, true, true, feeERC20Amounts,
      relayerFeeERC20Amount,
      relayerRailgunAddress,
      nonce,
    );
  };

  const handleSlippagePercent = (percent: number) => {
    setSlippagePercent(percent);
  };

  const confirmButtonText = 'Add liquidity';
  const infoCalloutText = `Adding liquidity into ${selectedPool.name}. The received ${selectedPool.pairTokenSymbol} tokens will represent this liquidity position, and can be redeemed for the underlying tokens at any time.`;
  const processingText = `Adding liquidity into ${selectedPool.name}...`;

  return (
    <CrossContractReviewTransactionView
      goBack={goBack}
      authKey={authKey}
      pool={selectedPool}
      onSuccess={onSuccess}
      recipeOutput={recipeOutput}
      isRefreshingRecipeOutput={isLoadingRecipeOutput}
      backButtonText="Select amount"
      processingText={processingText}
      saveTransaction={saveTransaction}
      infoCalloutText={infoCalloutText}
      slippagePercent={slippagePercent}
      confirmButtonText={confirmButtonText}
      onRelayerFeeUpdate={onRelayerFeeUpdate}
      setSlippagePercent={handleSlippagePercent}
      receivedMinimumAmounts={
        receivedLPTokenMinimumAmount
          ? [receivedLPTokenMinimumAmount]
          : undefined
      }
      transactionType={TransactionType.AddLiquidity}
      crossContractCalls={recipeOutput.crossContractCalls}
      relayAdaptUnshieldERC20Amounts={relayAdaptUnshieldERC20Amounts}
      relayAdaptShieldERC20Recipients={relayAdaptShieldERC20Recipients}
      relayAdaptUnshieldNFTAmounts={relayAdaptUnshieldNFTAmountsRef.current}
      relayAdaptShieldNFTRecipients={relayAdaptShieldNFTRecipientsRef.current}
    />
  );
};
