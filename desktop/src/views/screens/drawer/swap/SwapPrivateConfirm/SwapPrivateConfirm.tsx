import {
  isDefined,
  NFTAmountRecipient,
  RailgunERC20Recipient,
} from '@railgun-community/shared-models';
import { useEffect, useMemo, useRef, useState } from 'react';
import { RecipeLoadingView } from '@components/RecipeLoadingView/RecipeLoadingView';
import { EVENT_CLOSE_DRAWER, SwapPrivateData } from '@models/drawer-types';
import {
  compareERC20AmountArrays,
  ERC20Amount,
  ERC20AmountRecipient,
  getBaseTokenForNetwork,
  getWrappedTokenForNetwork,
  isRailgunAddress,
  isWrappedBaseTokenForNetwork,
  SavedTransactionService,
  TransactionType,
  useAdjustedRecipeUnshieldERC20Amount,
  useAppDispatch,
  useMemoCustomCompare,
  useReduxSelector,
  useUpdatingERC20Amount,
  useUpdatingSwapRecipe,
} from '@react-shared';
import { CrossContractReviewTransactionView } from '@screens/drawer/review-transaction/CrossContractReviewTransactionView';
import { appEventsBus, SWAP_COMPLETE } from '@services/navigation/app-events';
import { drawerEventsBus } from '@services/navigation/drawer-events';
import { SwapTransferBaseTokenSelectorModal } from '@views/screens/modals/SwapTransferBaseTokenSelectorModal/SwapTransferBaseTokenSelectorModal';

type Props = SwapPrivateData & {
  authKey: string;
};

export const SwapPrivateConfirm = ({
  authKey,
  originalQuote,
  originalRecipe,
  originalRecipeOutput,
  swapRecipeType,
  sellERC20Amount,
  buyERC20: originalBuyERC20,
  originalSlippagePercentage,
}: Props) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const { txidVersion } = useReduxSelector('txidVersion');

  const [buyERC20, setBuyERC20] = useState(originalBuyERC20);
  const [slippagePercent, setSlippagePercent] = useState(
    originalSlippagePercentage,
  );

  const dispatch = useAppDispatch();

  const {
    currentERC20Amount: currentBroadcasterFeeTokenAmount,
    onERC20AmountUpdate: onBroadcasterFeeUpdate,
  } = useUpdatingERC20Amount();

  const [swapDestinationAddress, setSwapDestinationAddress] =
    useState<Optional<string>>(undefined);
  const [
    showSwapTransferBaseTokenSelectorModal,
    setShowSwapTransferBaseTokenSelectorModal,
  ] = useState(false);

  const relayAdaptUnshieldNFTAmountsRef = useRef<NFTAmountRecipient[]>([]);
  const relayAdaptShieldNFTRecipientsRef = useRef<NFTAmountRecipient[]>([]);

  const transactionType = TransactionType.Swap;

  const setBuyWrappedBaseToken = () => {
    const wrappedBaseToken = getWrappedTokenForNetwork(
      wallets.active,
      network.current,
    );
    setBuyERC20(wrappedBaseToken ?? originalBuyERC20);
  };

  const setBuyBaseToken = () => {
    const baseToken = getBaseTokenForNetwork(wallets.active, network.current);
    setBuyERC20(baseToken ?? originalBuyERC20);
  };

  useEffect(() => {
    if (!isDefined(swapDestinationAddress)) {
      return;
    }

    if ((buyERC20.isBaseToken ?? false) ||
    isWrappedBaseTokenForNetwork(buyERC20, network.current)) {
      if (isRailgunAddress(swapDestinationAddress)) {
        setBuyWrappedBaseToken();
        return;
      }

      setShowSwapTransferBaseTokenSelectorModal(true);
    }
  }, [swapDestinationAddress]);

  const sellERC20AmountRecipient: ERC20AmountRecipient = useMemo(
    () => ({
      ...sellERC20Amount,
      recipientAddress: '0x API',
      externalUnresolvedToWalletAddress: undefined,
    }),
    [sellERC20Amount],
  );

  const { unshieldERC20AmountAdjusted } = useAdjustedRecipeUnshieldERC20Amount(
    sellERC20AmountRecipient,
    currentBroadcasterFeeTokenAmount,
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
    recipeError,
    isLoadingRecipeOutput,
  } = useUpdatingSwapRecipe(
    swapRecipeType,
    originalRecipe,
    originalRecipeOutput,
    originalQuote,
    unshieldERC20AmountAdjusted,
    buyERC20,
    slippagePercent,
    swapDestinationAddress,
  );

  const relayAdaptUnshieldERC20Amounts: ERC20Amount[] = useMemoCustomCompare(
    [unshieldERC20AmountAdjusted ?? sellERC20Amount],
    compareERC20AmountArrays,
  );
  const relayAdaptShieldERC20Recipients: RailgunERC20Recipient[] =
    lockedRecipeOutput.erc20AmountRecipients.map(
      ({ tokenAddress, recipient }) => ({
        tokenAddress,
        recipientAddress: recipient,
      }),
    );

  const getRecipeName = () => {
    if (!isDefined(swapDestinationAddress)) {
      return 'Private Swap';
    }
    if (isRailgunAddress(swapDestinationAddress)) {
      return 'Private Swap and Shield';
    }
    return 'Private Swap and Transfer';
  };

  if (isDefined(recipeError) || !isDefined(lockedRecipeOutput)) {
    return (
      <RecipeLoadingView
        recipeError={recipeError}
        recipeName={getRecipeName()}
        goBack={() => {
          drawerEventsBus.dispatch(EVENT_CLOSE_DRAWER);
        }}
      />
    );
  }

  const activeWallet = wallets.active;
  if (!activeWallet || activeWallet.isViewOnlyWallet) {
    return null;
  }

  const buyERC20AmountRecipient: ERC20AmountRecipient = {
    ...buyERC20Amount,
    recipientAddress: swapDestinationAddress ?? activeWallet.railAddress,
    externalUnresolvedToWalletAddress: undefined,
  };

  const railgunAddress = activeWallet.railAddress;

  const onSuccess = () => {
    appEventsBus.dispatch(SWAP_COMPLETE);
    drawerEventsBus.dispatch(EVENT_CLOSE_DRAWER);
  };

  const saveTransaction = async (
    txHash: string,
    sendWithPublicWallet: boolean,
    publicExecutionWalletAddress: Optional<string>,
    broadcasterFeeERC20Amount: Optional<ERC20Amount>,
    broadcasterRailgunAddress: Optional<string>,
    nonce: Optional<number>,
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
      !sendWithPublicWallet, true, true, [sellERC20Fee, buyERC20Fee],
      broadcasterFeeERC20Amount,
      broadcasterRailgunAddress,
      nonce,
    );
  };

  const handleSlippagePercent = (percent: number) => {
    setSlippagePercent(percent);
  };

  const infoCalloutText = `Swapping tokens privately via RAILGUN Adapt module.`;
  const processingText = !isDefined(swapDestinationAddress)
    ? 'Swapping tokens and transferring to the destination...'
    : 'Swapping tokens...';
  const confirmButtonText = !isDefined(swapDestinationAddress)
    ? 'Swap'
    : 'Swap and transfer';

  return (
    <>
      <CrossContractReviewTransactionView
        authKey={authKey}
        confirmButtonText={confirmButtonText}
        backButtonText={undefined}
        goBack={undefined}
        infoCalloutText={infoCalloutText}
        processingText={processingText}
        transactionType={transactionType}
        swapQuote={lockedQuote}
        recipeOutput={lockedRecipeOutput}
        setSlippagePercent={handleSlippagePercent}
        slippagePercent={slippagePercent}
        isRefreshingRecipeOutput={isLoadingRecipeOutput}
        swapBuyTokenAmount={buyERC20Amount}
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
      {showSwapTransferBaseTokenSelectorModal && (
        <SwapTransferBaseTokenSelectorModal
          onClose={transferToBaseToken => {
            if (transferToBaseToken) {
              setBuyBaseToken();
            } else {
              setBuyWrappedBaseToken();
            }

            setShowSwapTransferBaseTokenSelectorModal(false);
          }}
        />
      )}
    </>
  );
};
