import {
  isDefined,
  RailgunERC20Recipient,
} from '@railgun-community/shared-models';
import { RecipeLoadingView } from '@components/RecipeLoadingView/RecipeLoadingView';
import {
  EVENT_CLOSE_DRAWER,
  MorphoVaultRedeemData,
} from '@models/drawer-types';
import {
  ERC20Amount,
  ERC20Token,
  SavedTransactionService,
  TransactionType,
  useAppDispatch,
  useCurrentEphemeralAddress,
  useMorphoVaultRedeemRecipe,
  useReduxSelector,
} from '@react-shared';
import { CrossContractReviewTransactionView } from '@screens/drawer/review-transaction/CrossContractReviewTransactionView';
import { drawerEventsBus } from '@services/navigation/drawer-events';

type Props = MorphoVaultRedeemData & {
  authKey: string;
};

export const MorphoVaultRedeemConfirm = ({
  authKey,
  vaultAddress,
  vaultVersion,
  assetAddress,
  assetDecimals,
  shareDecimals,
  sharesAmountString,
  buyERC20,
  slippagePercentage,
}: Props) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const { txidVersion } = useReduxSelector('txidVersion');
  const dispatch = useAppDispatch();

  const ephemeralAddress = useCurrentEphemeralAddress(authKey);

  const sharesToken: ERC20Token = {
    address: vaultAddress,
    name: 'Morpho Vault Shares',
    symbol: 'shares',
    decimals: shareDecimals,
    isBaseToken: false,
  };
  const sharesERC20Amount: ERC20Amount = {
    token: sharesToken,
    amountString: sharesAmountString,
  };

  const { recipeOutput, isLoading, error } = useMorphoVaultRedeemRecipe(
    vaultAddress,
    vaultVersion,
    assetAddress,
    assetDecimals,
    sharesERC20Amount,
    buyERC20,
    slippagePercentage,
    ephemeralAddress,
  );

  if (isDefined(error) || !isDefined(recipeOutput)) {
    return (
      <RecipeLoadingView
        recipeError={error}
        recipeName="Morpho Vault Redeem"
        goBack={() => drawerEventsBus.dispatch(EVENT_CLOSE_DRAWER)}
      />
    );
  }

  const relayAdaptShieldERC20Recipients: RailgunERC20Recipient[] =
    recipeOutput.erc20AmountRecipients.map(({ tokenAddress, recipient }) => ({
      tokenAddress,
      recipientAddress: recipient,
    }));

  const buySymbol =
    'symbol' in buyERC20 && isDefined(buyERC20.symbol)
      ? buyERC20.symbol
      : 'your token';
  const actionSteps = [
    'Unshield your Morpho vault shares from RAILGUN',
    'Redeem the shares into the vault’s underlying asset',
    `Swap the asset → ${buySymbol} via 0x`,
    `Shield ${buySymbol} and any leftover back to RAILGUN`,
  ];

  const onSuccess = () => {
    drawerEventsBus.dispatch(EVENT_CLOSE_DRAWER);
  };

  const expectedBuyAmount =
    recipeOutput.erc20AmountRecipients.find(
      recipient =>
        recipient.tokenAddress.toLowerCase() === buyERC20.address.toLowerCase(),
    )?.amount ?? 0n;
  const buyERC20Amount: ERC20Amount = {
    token: buyERC20,
    amountString: expectedBuyAmount.toString(),
  };

  const saveTransaction = async (
    txHash: string,
    sendWithPublicWallet: boolean,
    _publicExecutionWalletAddress: Optional<string>,
    broadcasterFeeERC20Amount: Optional<ERC20Amount>,
    broadcasterRailgunAddress: Optional<string>,
    nonce: Optional<number>,
  ) => {
    const railgunAddress = wallets.active?.railAddress;
    if (!isDefined(railgunAddress)) {
      return;
    }
    const transactionService = new SavedTransactionService(dispatch);
    await transactionService.saveSwapTransaction(
      txidVersion.current,
      txHash,
      railgunAddress,
      ephemeralAddress,
      sharesERC20Amount,
      buyERC20Amount,
      undefined, network.current,
      !sendWithPublicWallet, true, true, undefined, broadcasterFeeERC20Amount,
      broadcasterRailgunAddress,
      nonce,
    );
  };

  return (
    <CrossContractReviewTransactionView
      authKey={authKey}
      crossContractCalls={recipeOutput.crossContractCalls}
      saveTransaction={saveTransaction}
      onSuccess={onSuccess}
      transactionType={TransactionType.Swap}
      relayAdaptUnshieldERC20Amounts={[sharesERC20Amount]}
      relayAdaptUnshieldNFTAmounts={[]}
      relayAdaptShieldERC20Recipients={relayAdaptShieldERC20Recipients}
      relayAdaptShieldNFTRecipients={[]}
      infoCalloutText="Redeeming from a Morpho vault privately, in one 7702 relay-adapt batch."
      actionSteps={actionSteps}
      processingText="Redeeming from Morpho vault..."
      confirmButtonText="Redeem"
      backButtonText={undefined}
      goBack={undefined}
      recipeOutput={recipeOutput}
      isRefreshingRecipeOutput={isLoading}
    />
  );
};
