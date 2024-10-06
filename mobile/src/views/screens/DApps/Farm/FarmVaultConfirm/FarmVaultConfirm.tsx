import {
  isDefined,
  NFTAmountRecipient,
  RailgunERC20Recipient,
} from "@railgun-community/shared-models";
import React, { useMemo, useRef } from "react";
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
  CookbookFarmRecipeType,
  createERC20TokenFromRecipeERC20Info,
  ERC20Amount,
  ERC20AmountRecipient,
  ERC20Token,
  getVaultDisplayName,
  SavedTransactionService,
  SharedConstants,
  TransactionType,
  useAdjustedRecipeUnshieldERC20Amount,
  useAppDispatch,
  useMemoCustomCompare,
  useMountTimer,
  useReduxSelector,
  useUpdatingERC20Amount,
  useVaultRecipe,
} from "@react-shared";
import { RecipeLoadingView } from "../../../../components/views/RecipeLoadingView/RecipeLoadingView";

type Props = {
  navigation: NavigationProp<DAppsStackParamList, "FarmVaultConfirm">;
  route: RouteProp<
    { params: DAppsStackParamList["FarmVaultConfirm"] },
    "params"
  >;
};

export const FarmVaultConfirm: React.FC<Props> = ({ navigation, route }) => {
  const { selectedTokenAmount, selectedVault, cookbookFarmRecipeType } =
    route.params;

  const { wallets } = useReduxSelector("wallets");
  const { network } = useReduxSelector("network");
  const { txidVersion } = useReduxSelector("txidVersion");

  const dispatch = useAppDispatch();

  const relayAdaptUnshieldNFTAmountsRef = useRef<NFTAmountRecipient[]>([]);
  const relayAdaptShieldNFTRecipientsRef = useRef<NFTAmountRecipient[]>([]);

  const {
    currentERC20Amount: currentBroadcasterFeeTokenAmount,
    onERC20AmountUpdate: onBroadcasterFeeUpdate,
  } = useUpdatingERC20Amount();

  const isFarmDeposit =
    cookbookFarmRecipeType === CookbookFarmRecipeType.Deposit;
  const vaultDisplayName = getVaultDisplayName(selectedVault.type);
  const transactionType = isFarmDeposit
    ? TransactionType.FarmDeposit
    : TransactionType.FarmRedeem;

  const selectedTokenAmountRecipient: ERC20AmountRecipient = useMemo(
    () => ({
      ...selectedTokenAmount,
      recipientAddress: selectedVault.name,
      externalUnresolvedToWalletAddress: undefined,
    }),
    [selectedTokenAmount, selectedVault.name]
  );

  const { unshieldERC20AmountAdjusted } = useAdjustedRecipeUnshieldERC20Amount(
    selectedTokenAmountRecipient,
    currentBroadcasterFeeTokenAmount
  );

  const { recipeError, recipeOutput, isLoadingRecipeOutput } = useVaultRecipe(
    cookbookFarmRecipeType,
    selectedVault,
    unshieldERC20AmountAdjusted
  );

  const unshieldERC20AmountRecipient =
    unshieldERC20AmountAdjusted ?? selectedTokenAmountRecipient;
  const relayAdaptUnshieldERC20Amounts: ERC20Amount[] = useMemoCustomCompare(
    [unshieldERC20AmountRecipient],
    compareERC20AmountArrays
  );

  const { mountTimerCompleted } = useMountTimer(
    SharedConstants.RECIPE_LOADING_VIEW_MIN_DISPLAY_TIME
  );

  if (
    !mountTimerCompleted ||
    isDefined(recipeError) ||
    !isDefined(recipeOutput)
  ) {
    return (
      <RecipeLoadingView
        recipeError={recipeError}
        recipeName={`${vaultDisplayName} ${cookbookFarmRecipeType}`}
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

  const receivedTokenAddress = isFarmDeposit
    ? selectedVault.redeemERC20Address
    : selectedVault.depositERC20Address;
  const receivedRecipeERC20Amount = recipeOutput.erc20AmountRecipients.find(
    (recipeERC20Amount) =>
      compareTokenAddress(recipeERC20Amount.tokenAddress, receivedTokenAddress)
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
    recipientAddress: selectedVault.name,
    externalUnresolvedToWalletAddress: undefined,
  };

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
    await transactionService.saveFarmVaultTransaction(
      txidVersion.current,
      transactionType,
      txHash,
      railgunAddress,
      publicExecutionWalletAddress,
      selectedVault,
      unshieldERC20AmountRecipient ?? selectedTokenAmountRecipient,
      receivedERC20AmountRecipient,
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

  const confirmButtonText = isFarmDeposit ? "Deposit" : "Redeem";
  const infoCalloutText = isFarmDeposit
    ? `Depositing shielded tokens into ${selectedVault.name} ${vaultDisplayName}. The received ${selectedVault.redeemERC20Symbol} tokens will accrue value over time. As the value increases, they will be redeemable for additional ${selectedVault.depositERC20Symbol}.`
    : `Redeeming shielded tokens from ${selectedVault.name} ${vaultDisplayName}.`;
  const processingText = isFarmDeposit
    ? `Depositing tokens into ${vaultDisplayName}...`
    : `Redeeming tokens from ${vaultDisplayName}...`;

  return (
    <CrossContractReviewTransactionView
      navigation={navigation}
      vault={selectedVault}
      recipeOutput={recipeOutput}
      isRefreshingRecipeOutput={isLoadingRecipeOutput}
      confirmButtonText={confirmButtonText}
      infoCalloutText={infoCalloutText}
      processingText={processingText}
      transactionType={transactionType}
      crossContractCalls={recipeOutput.crossContractCalls}
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
