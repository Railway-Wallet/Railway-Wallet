import {
  isDefined,
  RailgunERC20Recipient,
} from '@railgun-community/shared-models';
import { RecipeLoadingView } from '@components/RecipeLoadingView/RecipeLoadingView';
import {
  EVENT_CLOSE_DRAWER,
  MorphoVaultDepositData,
} from '@models/drawer-types';
import {
  ERC20Amount,
  ERC20Token,
  SavedTransactionService,
  TransactionType,
  useAppDispatch,
  useCurrentEphemeralAddress,
  useMorphoVaultDepositRecipe,
  useReduxSelector,
} from '@react-shared';
import { CrossContractReviewTransactionView } from '@screens/drawer/review-transaction/CrossContractReviewTransactionView';
import { drawerEventsBus } from '@services/navigation/drawer-events';

type Props = MorphoVaultDepositData & {
  authKey: string;
};

export const MorphoVaultDepositConfirm = ({
  authKey,
  vaultAddress,
  vaultVersion,
  assetAddress,
  assetDecimals,
  shareDecimals,
  sellERC20Amount,
  slippagePercentage,
}: Props) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const { txidVersion } = useReduxSelector('txidVersion');
  const dispatch = useAppDispatch();

  const ephemeralAddress = useCurrentEphemeralAddress(authKey);

  const { recipeOutput, isLoading, error } = useMorphoVaultDepositRecipe(
    vaultAddress,
    vaultVersion,
    assetAddress,
    assetDecimals,
    sellERC20Amount,
    slippagePercentage,
    ephemeralAddress,
  );

  if (isDefined(error) || !isDefined(recipeOutput)) {
    return (
      <RecipeLoadingView
        recipeError={error}
        recipeName="Morpho Vault Deposit"
        goBack={() => drawerEventsBus.dispatch(EVENT_CLOSE_DRAWER)}
      />
    );
  }

  const relayAdaptShieldERC20Recipients: RailgunERC20Recipient[] =
    recipeOutput.erc20AmountRecipients.map(({ tokenAddress, recipient }) => ({
      tokenAddress,
      recipientAddress: recipient,
    }));

  const sellSymbol =
    'symbol' in sellERC20Amount.token && isDefined(sellERC20Amount.token.symbol)
      ? sellERC20Amount.token.symbol
      : 'your token';
  const actionSteps = [
    `Unshield ${sellSymbol} from your RAILGUN balance`,
    `Swap ${sellSymbol} → the vault asset via 0x`,
    'Deposit the asset into the Morpho vault for shares',
    'Shield the vault shares and any surplus back to RAILGUN',
  ];

  const onSuccess = () => {
    drawerEventsBus.dispatch(EVENT_CLOSE_DRAWER);
  };

  const sharesToken: ERC20Token = {
    address: vaultAddress,
    name: 'Morpho Vault Shares',
    symbol: 'shares',
    decimals: shareDecimals,
    isBaseToken: false,
  };
  const expectedSharesAmount =
    recipeOutput.erc20AmountRecipients.find(
      recipient =>
        recipient.tokenAddress.toLowerCase() === vaultAddress.toLowerCase(),
    )?.amount ?? 0n;
  const sharesERC20Amount: ERC20Amount = {
    token: sharesToken,
    amountString: expectedSharesAmount.toString(),
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
      sellERC20Amount,
      sharesERC20Amount,
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
      relayAdaptUnshieldERC20Amounts={[sellERC20Amount]}
      relayAdaptUnshieldNFTAmounts={[]}
      relayAdaptShieldERC20Recipients={relayAdaptShieldERC20Recipients}
      relayAdaptShieldNFTRecipients={[]}
      infoCalloutText="Depositing into a Morpho vault privately, in one 7702 relay-adapt batch."
      actionSteps={actionSteps}
      processingText="Depositing into Morpho vault..."
      confirmButtonText="Deposit"
      backButtonText={undefined}
      goBack={undefined}
      recipeOutput={recipeOutput}
      isRefreshingRecipeOutput={isLoading}
    />
  );
};
