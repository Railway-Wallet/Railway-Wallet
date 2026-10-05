import {
  isDefined,
  NFTAmountRecipient,
  RailgunERC20Recipient,
} from '@railgun-community/shared-models';
import { useMemo } from 'react';
import { parseUnits } from 'ethers';
import { RecipeLoadingView } from '@components/RecipeLoadingView/RecipeLoadingView';
import { EVENT_CLOSE_DRAWER, FxMintOpenData } from '@models/drawer-types';
import {
  getFxPoolView,
  logDev,
  TransactionType,
  useCurrentEphemeralAddress,
  useFxMintOpenRecipe,
} from '@react-shared';
import { CrossContractReviewTransactionView } from '@screens/drawer/review-transaction/CrossContractReviewTransactionView';
import { drawerEventsBus } from '@services/navigation/drawer-events';

type Props = FxMintOpenData & {
  authKey: string;
};


export const FxMintOpenConfirm = ({
  authKey,
  pool,
  sellERC20Amount,
  targetDebtString,
  slippagePercentage,
}: Props) => {
  const ephemeralAddress = useCurrentEphemeralAddress(authKey);

  const poolView = getFxPoolView(pool);
  const debtDecimals = poolView?.debtDecimals ?? 18;

  const targetDebt = useMemo(() => {
    try {
      return parseUnits(targetDebtString || '0', debtDecimals);
    } catch {
      return 0n;
    }
  }, [targetDebtString, debtDecimals]);

  const { recipeOutput, isLoading, error } = useFxMintOpenRecipe(
    pool,
    sellERC20Amount,
    targetDebt,
    slippagePercentage,
    ephemeralAddress,
  );

  if (isDefined(error) || !isDefined(recipeOutput)) {
    return (
      <RecipeLoadingView
        recipeError={error}
        recipeName="fxMINT Open"
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
  const borrowDisplay = Number(targetDebtString).toFixed(4);
  const actionSteps = [
    `Unshield ${sellSymbol} from your RAILGUN balance`,
    `Swap ${sellSymbol} → ${collateralSymbol} (the pool collateral) via 0x`,
    `Mint ~${borrowDisplay} ${debtSymbol} and open the ${pool} position`,
    `Shield the position NFT, the ${debtSymbol}, and any surplus back to RAILGUN`,
  ];

  const onSuccess = () => {
    drawerEventsBus.dispatch(EVENT_CLOSE_DRAWER);
  };

  const saveTransaction = async () => {
    logDev('fxMINT open position broadcast');
  };

  return (
    <CrossContractReviewTransactionView
      authKey={authKey}
      crossContractCalls={recipeOutput.crossContractCalls}
      saveTransaction={saveTransaction}
      onSuccess={onSuccess}
      transactionType={TransactionType.Swap}
      relayAdaptUnshieldERC20Amounts={[sellERC20Amount]}
      relayAdaptUnshieldNFTAmounts={[]}
      relayAdaptShieldERC20Recipients={relayAdaptShieldERC20Recipients}
      relayAdaptShieldNFTRecipients={relayAdaptShieldNFTRecipients}
      infoCalloutText="Opening an f(x) leveraged position privately, in one 7702 relay-adapt batch."
      actionSteps={actionSteps}
      processingText="Opening f(x) position..."
      confirmButtonText="Open position"
      backButtonText={undefined}
      goBack={undefined}
      recipeOutput={recipeOutput}
      isRefreshingRecipeOutput={isLoading}
    />
  );
};
