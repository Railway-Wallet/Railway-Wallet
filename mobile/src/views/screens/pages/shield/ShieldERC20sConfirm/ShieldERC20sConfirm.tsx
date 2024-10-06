import {
  isDefined,
  MerkletreeScanStatus,
  NetworkName,
  NFTAmountRecipient,
  RailgunWalletBalanceBucket,
  sanitizeError,
  SelectedBroadcaster,
  TransactionGasDetails,
  TXIDVersion,
} from "@railgun-community/shared-models";
import React from "react";
import { Alert } from "react-native";
import { ContractTransaction, keccak256, Wallet } from "ethers";
import { ReviewTransactionView } from "@components/views/ReviewTransactionView/ReviewTransactionView";
import { TokenStackParamList } from "@models/navigation-models";
import {
  CommonActions,
  NavigationProp,
  RouteProp,
} from "@react-navigation/native";
import {
  AdjustedERC20AmountRecipientGroup,
  assertIsNotHighSevereRiskAddress,
  AvailableWallet,
  delay,
  ERC20Amount,
  ERC20AmountRecipient,
  executeWithoutBroadcaster,
  gasEstimateForShield,
  gasEstimateForShieldBaseToken,
  GetGasEstimateSelfSigned,
  getShieldPrivateKeySignatureMessage,
  hasOnlyBaseToken,
  MerkletreeType,
  populateShield,
  populateShieldBaseToken,
  refreshNFTsMetadataAfterShieldUnshield,
  SavedTransactionService,
  StorageService,
  TransactionType,
  useAppDispatch,
  useReduxSelector,
} from "@react-shared";
import { WalletSecureServiceReactNative } from "@services/wallet/wallet-secure-service-react-native";
import { Constants } from "@utils/constants";

type Props = {
  navigation: NavigationProp<TokenStackParamList, "ShieldERC20sConfirm">;
  route: RouteProp<
    { params: TokenStackParamList["ShieldERC20sConfirm"] },
    "params"
  >;
};

export const ShieldERC20sConfirm: React.FC<Props> = ({ navigation, route }) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");
  const { txidVersion } = useReduxSelector("txidVersion");
  const { merkletreeHistoryScan } = useReduxSelector("merkletreeHistoryScan");

  const { erc20AmountRecipients, nftAmountRecipients } = route.params;

  const dispatch = useAppDispatch();

  const transactionType = TransactionType.Shield;

  const isBaseTokenShield = hasOnlyBaseToken(erc20AmountRecipients);

  const walletSecureService = new WalletSecureServiceReactNative();

  const activeWallet = wallets.active;
  if (!activeWallet || activeWallet.isViewOnlyWallet) {
    return null;
  }
  const fromWalletAddress = activeWallet.ethAddress;

  const onSuccess = async () => {
    const hasCompletedFirstShield = await StorageService.getItem(
      Constants.HAS_COMPLETED_FIRST_SHIELD
    );

    if (!isDefined(hasCompletedFirstShield)) {
      const currentScanStatus =
        merkletreeHistoryScan.forNetwork[network.current.name]?.forType[
          MerkletreeType.UTXO
        ];
      const railgunBalancesUpdating =
        currentScanStatus?.status === MerkletreeScanStatus.Started ||
        currentScanStatus?.status === MerkletreeScanStatus.Updated;

      if (railgunBalancesUpdating) {
        Alert.alert(
          "Notice: Merkletree Syncing",
          "Your private balances are currently updating. Once fully synced, your private balances will appear in your RAILGUN wallet. Please view progress from the main Wallets page.",
          [
            {
              text: "Okay",
              onPress: () => {
                navigation.dispatch(CommonActions.navigate("WalletsScreen"));
              },
            },
          ]
        );
      }

      await StorageService.setItem(Constants.HAS_COMPLETED_FIRST_SHIELD, "1");
      return;
    }

    navigation.dispatch(CommonActions.navigate("WalletsScreen"));
  };

  const getShieldPrivateKey = async (pKey: string): Promise<string> => {
    const wallet = new Wallet(pKey);
    const shieldSignatureMessage = await getShieldPrivateKeySignatureMessage();
    const shieldPrivateKey = keccak256(
      await wallet.signMessage(shieldSignatureMessage)
    );
    return shieldPrivateKey;
  };

  const performTransaction = async (
    finalAdjustedERC20AmountRecipientGroup: AdjustedERC20AmountRecipientGroup,
    nftAmountRecipients: NFTAmountRecipient[],
    _selectedBroadcaster: Optional<SelectedBroadcaster>,
    _broadcasterFeeERC20Amount: Optional<ERC20Amount>,
    transactionGasDetails: TransactionGasDetails,
    customNonce: Optional<number>,
    _publicWalletOverride: Optional<AvailableWallet>,
    _showSenderAddressToRecipient: boolean,
    _memoText: Optional<string>,
    success: () => void,
    error: (err: Error) => void
  ): Promise<Optional<string>> => {
    const pKey = await walletSecureService.getWallet0xPKey(activeWallet);
    const shieldPrivateKey = await getShieldPrivateKey(pKey);

    let populatedTransaction: Optional<ContractTransaction>;
    try {
      const shieldCall = isBaseTokenShield
        ? populateShieldBaseToken
        : populateShield;

      const [{ transaction }] = await Promise.all([
        shieldCall(
          txidVersion.current,
          network.current.name,
          shieldPrivateKey,
          finalAdjustedERC20AmountRecipientGroup.inputs,
          nftAmountRecipients,
          transactionGasDetails
        ),
        delay(1000),
      ]);
      populatedTransaction = transaction;
    } catch (cause) {
      error(new Error("Failed to populate shield.", { cause }));
      return;
    }

    try {
      await assertIsNotHighSevereRiskAddress(
        network.current.name,
        fromWalletAddress
      );

      const pKey = await walletSecureService.getWallet0xPKey(activeWallet);
      const txResponse = await executeWithoutBroadcaster(
        fromWalletAddress,
        pKey,
        populatedTransaction,
        network.current,
        customNonce
      );

      const transactionService = new SavedTransactionService(dispatch);
      await transactionService.saveShieldTransactions(
        txidVersion.current,
        txResponse.hash,
        fromWalletAddress,
        finalAdjustedERC20AmountRecipientGroup.fees,
        finalAdjustedERC20AmountRecipientGroup.outputs,
        nftAmountRecipients,
        network.current,
        isBaseTokenShield,
        txResponse.nonce
      );
      success();
      await refreshNFTsMetadataAfterShieldUnshield(
        dispatch,
        network.current.name,
        nftAmountRecipients
      );
      return txResponse.hash;
    } catch (cause) {
      error(sanitizeError(cause));
      return undefined;
    }
  };

  const getGasEstimate: GetGasEstimateSelfSigned = async (
    txidVersion: TXIDVersion,
    networkName: NetworkName,
    fromWalletAddress: string,
    erc20AmountRecipients: ERC20AmountRecipient[],
    nftAmountRecipients: NFTAmountRecipient[]
  ): Promise<bigint> => {
    const pKey = await walletSecureService.getWallet0xPKey(activeWallet);
    const shieldPrivateKey = await getShieldPrivateKey(pKey);

    const shieldGasEstimate = isBaseTokenShield
      ? gasEstimateForShieldBaseToken
      : gasEstimateForShield;

    return shieldGasEstimate(
      txidVersion,
      networkName,
      fromWalletAddress,
      shieldPrivateKey,
      erc20AmountRecipients,
      nftAmountRecipients
    );
  };

  const infoCalloutText = "Shielding tokens into a private RAILGUN address.";
  const processingText = "Shielding tokens...";

  return (
    <ReviewTransactionView
      navigation={navigation}
      confirmButtonText="Shield"
      getGasEstimate={getGasEstimate}
      performTransaction={performTransaction}
      fromWalletAddress={fromWalletAddress}
      onSuccessCallback={onSuccess}
      isFullyPrivateTransaction={false}
      erc20AmountRecipients={erc20AmountRecipients}
      nftAmountRecipients={nftAmountRecipients}
      infoCalloutText={infoCalloutText}
      processingText={processingText}
      transactionType={transactionType}
      useRelayAdapt={isBaseTokenShield}
      showCustomNonce={true}
      balanceBucketFilter={[RailgunWalletBalanceBucket.Spendable]}
    />
  );
};
