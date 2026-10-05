import {
  isDefined,
  NFTAmountRecipient,
  RailgunERC20Recipient,
  RailgunWalletBalanceBucket,
} from '@railgun-community/shared-models';
import { useMemo } from 'react';
import { RecipeLoadingView } from '@components/RecipeLoadingView/RecipeLoadingView';
import { EVENT_CLOSE_DRAWER, FxMintCloseData } from '@models/drawer-types';
import {
  ERC20Amount,
  ERC20Token,
  getFxPoolView,
  logDev,
  TransactionType,
  useCurrentEphemeralAddress,
  useERC20Balance,
  useFxMintCloseRecipe,
  useReduxSelector,
} from '@react-shared';
import { CrossContractReviewTransactionView } from '@screens/drawer/review-transaction/CrossContractReviewTransactionView';
import { drawerEventsBus } from '@services/navigation/drawer-events';

type Props = FxMintCloseData & {
  authKey: string;
};

const SPENDABLE_ONLY = [RailgunWalletBalanceBucket.Spendable];

export const FxMintCloseConfirm = ({
  authKey,
  pool,
  positionId,
  positionNFT,
  buyERC20,
  slippagePercentage,
}: Props) => {
  const { wallets } = useReduxSelector('wallets');

  const ephemeralAddress = useCurrentEphemeralAddress(authKey);

  const poolView = getFxPoolView(pool);

  const debtToken: Optional<ERC20Token> = useMemo(
    () =>
      isDefined(poolView)
        ? {
            address: poolView.debtToken,
            name: poolView.debtSymbol,
            symbol: poolView.debtSymbol,
            decimals: poolView.debtDecimals,
            isBaseToken: false,
          }
        : undefined,
    [poolView],
  );

  const { tokenBalance: shieldedDebt } = useERC20Balance(
    wallets.active,
    debtToken,
    true,
    SPENDABLE_ONLY,
  );

  const positionIdBigInt = useMemo(() => {
    try {
      return BigInt(positionId);
    } catch {
      return undefined;
    }
  }, [positionId]);

  const { recipeOutput, isLoading, error, partialClose } =
    useFxMintCloseRecipe(
      pool,
      positionIdBigInt,
      positionNFT,
      debtToken,
      buyERC20,
      shieldedDebt,
      slippagePercentage,
      ephemeralAddress,
    );

  if (isDefined(error) || !isDefined(recipeOutput)) {
    const noDebt = !isDefined(shieldedDebt) || shieldedDebt <= 0n;
    const debtSymbol = poolView?.debtSymbol ?? 'the debt token';
    return (
      <RecipeLoadingView
        recipeError={
          error ??
          (noDebt
            ? new Error(
                `No shielded ${debtSymbol} found to repay this position. Shield ${debtSymbol} before closing.`,
              )
            : undefined)
        }
        recipeName="fxMINT Close"
        goBack={() => drawerEventsBus.dispatch(EVENT_CLOSE_DRAWER)}
      />
    );
  }

  const relayAdaptShieldERC20Recipients: RailgunERC20Recipient[] =
    recipeOutput.erc20AmountRecipients.map(({ tokenAddress, recipient }) => ({
      tokenAddress,
      recipientAddress: recipient,
    }));

  const relayAdaptShieldNFTRecipients: NFTAmountRecipient[] =
    recipeOutput.nftRecipients.map(
      ({ recipient, nftAddress, nftTokenType, tokenSubID, amount }) => ({
        nftAddress,
        nftTokenType,
        tokenSubID,
        amountString: amount.toString(),
        recipientAddress: recipient,
      }),
    );

  const debtAmount: ERC20Amount = {
    token: debtToken as ERC20Token,
    amountString: (shieldedDebt ?? 0n).toString(),
  };

  const collateralSymbol = poolView?.collateralSymbol ?? 'the collateral';
  const debtSymbol = poolView?.debtSymbol ?? 'the debt token';
  const buySymbol =
    'symbol' in buyERC20 && isDefined(buyERC20.symbol)
      ? buyERC20.symbol
      : 'your token';
  const closeVerb = partialClose === true ? 'Partially close' : 'Close';
  const actionSteps = [
    `Unshield ${debtSymbol} and the ${pool} position NFT (#${positionId}) from RAILGUN`,
    `${closeVerb} position #${positionId}: repay ${debtSymbol} and release ${collateralSymbol}`,
    `Swap the released ${collateralSymbol} → ${buySymbol} via 0x`,
    `Shield ${buySymbol}${
      partialClose === true ? ', the position NFT,' : ''
    } and any leftover ${debtSymbol} back to RAILGUN`,
  ];

  const onSuccess = () => {
    drawerEventsBus.dispatch(EVENT_CLOSE_DRAWER);
  };

  const saveTransaction = async () => {
    logDev('fxMINT close position broadcast');
  };

  return (
    <CrossContractReviewTransactionView
      authKey={authKey}
      crossContractCalls={recipeOutput.crossContractCalls}
      saveTransaction={saveTransaction}
      onSuccess={onSuccess}
      transactionType={TransactionType.Swap}
      relayAdaptUnshieldERC20Amounts={[debtAmount]}
      relayAdaptUnshieldNFTAmounts={[positionNFT]}
      relayAdaptShieldERC20Recipients={relayAdaptShieldERC20Recipients}
      relayAdaptShieldNFTRecipients={relayAdaptShieldNFTRecipients}
      infoCalloutText="Closing an f(x) leveraged position privately, in one 7702 relay-adapt batch."
      actionSteps={actionSteps}
      processingText="Closing f(x) position..."
      confirmButtonText={
        partialClose === true ? 'Partially close' : 'Close position'
      }
      backButtonText={undefined}
      goBack={undefined}
      recipeOutput={recipeOutput}
      isRefreshingRecipeOutput={isLoading}
    />
  );
};
