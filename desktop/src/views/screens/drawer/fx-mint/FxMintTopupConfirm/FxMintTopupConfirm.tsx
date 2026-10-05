import {
  isDefined,
  NFTAmountRecipient,
  RailgunERC20Recipient,
} from '@railgun-community/shared-models';
import { useMemo } from 'react';
import { parseUnits } from 'ethers';
import { RecipeLoadingView } from '@components/RecipeLoadingView/RecipeLoadingView';
import { EVENT_CLOSE_DRAWER, FxMintTopupData } from '@models/drawer-types';
import {
  getFxPoolView,
  logDev,
  TransactionType,
  useCurrentEphemeralAddress,
  useFxMintTopupRecipe,
} from '@react-shared';
import { CrossContractReviewTransactionView } from '@screens/drawer/review-transaction/CrossContractReviewTransactionView';
import { drawerEventsBus } from '@services/navigation/drawer-events';

type Props = FxMintTopupData & {
  authKey: string;
};


export const FxMintTopupConfirm = ({
  authKey,
  pool,
  positionId,
  positionNFT,
  sellERC20Amount,
  additionalDebtString,
  slippagePercentage,
}: Props) => {
  const ephemeralAddress = useCurrentEphemeralAddress(authKey);

  const poolView = getFxPoolView(pool);
  const debtDecimals = poolView?.debtDecimals ?? 18;

  const positionIdBigInt = useMemo(() => {
    try {
      return BigInt(positionId);
    } catch {
      return undefined;
    }
  }, [positionId]);

  const additionalDebt = useMemo(() => {
    try {
      return parseUnits(additionalDebtString || '0', debtDecimals);
    } catch {
      return 0n;
    }
  }, [additionalDebtString, debtDecimals]);

  const { recipeOutput, isLoading, error, isBorrowing } = useFxMintTopupRecipe(
    pool,
    positionIdBigInt,
    positionNFT,
    sellERC20Amount,
    additionalDebt,
    slippagePercentage,
    ephemeralAddress,
  );

  if (isDefined(error) || !isDefined(recipeOutput)) {
    return (
      <RecipeLoadingView
        recipeError={error}
        recipeName="fxMINT Topup"
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

  const collateralSymbol = poolView?.collateralSymbol ?? 'the collateral';
  const debtSymbol = poolView?.debtSymbol ?? 'the debt token';
  const sellSymbol =
    'symbol' in sellERC20Amount.token &&
    isDefined(sellERC20Amount.token.symbol)
      ? sellERC20Amount.token.symbol
      : 'your token';
  const borrowDisplay = Number(additionalDebtString || '0').toFixed(4);
  const actionSteps = [
    `Unshield ${sellSymbol} and the ${pool} position NFT (#${positionId}) from RAILGUN`,
    `Swap ${sellSymbol} → ${collateralSymbol} (the pool collateral) via 0x`,
    isBorrowing
      ? `Add the collateral and mint ~${borrowDisplay} more ${debtSymbol} on position #${positionId}`
      : `Add the collateral to position #${positionId} (debt unchanged)`,
    `Shield the position NFT${
      isBorrowing ? `, the new ${debtSymbol},` : ''
    } and any surplus back to RAILGUN`,
  ];

  const onSuccess = () => {
    drawerEventsBus.dispatch(EVENT_CLOSE_DRAWER);
  };

  const saveTransaction = async () => {
    logDev('fxMINT topup position broadcast');
  };

  return (
    <CrossContractReviewTransactionView
      authKey={authKey}
      crossContractCalls={recipeOutput.crossContractCalls}
      saveTransaction={saveTransaction}
      onSuccess={onSuccess}
      transactionType={TransactionType.Swap}
      relayAdaptUnshieldERC20Amounts={[sellERC20Amount]}
      relayAdaptUnshieldNFTAmounts={[positionNFT]}
      relayAdaptShieldERC20Recipients={relayAdaptShieldERC20Recipients}
      relayAdaptShieldNFTRecipients={relayAdaptShieldNFTRecipients}
      infoCalloutText="Adding to an f(x) leveraged position privately, in one 7702 relay-adapt batch."
      actionSteps={actionSteps}
      processingText="Updating f(x) position..."
      confirmButtonText={isBorrowing ? 'Add & borrow' : 'Add collateral'}
      backButtonText={undefined}
      goBack={undefined}
      recipeOutput={recipeOutput}
      isRefreshingRecipeOutput={isLoading}
    />
  );
};
