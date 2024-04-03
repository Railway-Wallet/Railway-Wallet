import {
  isDefined,
  MerkletreeScanStatus,
  NetworkName,
  NFTAmountRecipient,
  RailgunPopulateTransactionResponse,
  RailgunWalletBalanceBucket,
  sanitizeError,
  SelectedRelayer,
  TransactionGasDetails,
  TXIDVersion,
} from '@railgun-community/shared-models';
import { useState } from 'react';
import { keccak256, Wallet } from 'ethers';
import {
  AlertProps,
  GenericAlert,
} from '@components/alerts/GenericAlert/GenericAlert';
import { EVENT_CLOSE_DRAWER } from '@models/drawer-types';
import {
  AdjustedERC20AmountRecipientGroup,
  assertIsNotHighSevereRiskAddress,
  AvailableWallet,
  delay,
  ERC20Amount,
  ERC20AmountRecipient,
  executeWithoutRelayer,
  GetGasEstimateSelfSigned,
  getShieldPrivateKeySignatureMessage,
  hasOnlyBaseToken,
  MerkletreeType,
  refreshNFTsMetadataAfterShieldUnshield,
  SavedTransactionService,
  StorageService,
  TransactionType,
  UnauthenticatedWalletService,
  useAppDispatch,
  useReduxSelector,
} from '@react-shared';
import { ReviewTransactionView } from '@screens/drawer/review-transaction/ReviewTransactionView';
import { drawerEventsBus } from '@services/navigation/drawer-events';
import { WalletSecureStorageWeb } from '@services/wallet/wallet-secure-service-web';
import { Constants } from '@utils/constants';

type Props = {
  goBack: () => void;
  erc20AmountRecipients: ERC20AmountRecipient[];
  nftAmountRecipients: NFTAmountRecipient[];
  authKey: string;
};

export const ShieldConfirm = ({
  goBack,
  erc20AmountRecipients,
  nftAmountRecipients,
  authKey,
}: Props) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const { txidVersion } = useReduxSelector('txidVersion');
  const { merkletreeHistoryScan } = useReduxSelector('merkletreeHistoryScan');

  const [alert, setAlert] = useState<AlertProps | undefined>(undefined);

  const transactionType = TransactionType.Shield;

  const dispatch = useAppDispatch();

  const isBaseTokenShield = hasOnlyBaseToken(erc20AmountRecipients);

  const activeWallet = wallets.active;
  if (!activeWallet || activeWallet.isViewOnlyWallet) {
    return null;
  }
  const fromWalletAddress = activeWallet.ethAddress;

  const walletSecureService = new WalletSecureStorageWeb(authKey);
  const unauthenticatedWalletService = new UnauthenticatedWalletService();

  const onSuccess = async () => {
    const hasCompletedFirstShield = await StorageService.getItem(
      Constants.HAS_COMPLETED_FIRST_SHIELD,
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
        setAlert({
          title: 'Notice: Merkletree Syncing',
          message:
            'Your private balances are currently updating. Once fully synced, your private balances will appear in your RAILGUN wallet. Please view progress from the menu on the left.',
          onClose: () => {
            drawerEventsBus.dispatch(EVENT_CLOSE_DRAWER);
          },
          shouldCloseOnOverlayClick: false,
        });
      }

      await StorageService.setItem(Constants.HAS_COMPLETED_FIRST_SHIELD, '1');
      return;
    }

    drawerEventsBus.dispatch(EVENT_CLOSE_DRAWER);
  };

  const getShieldPrivateKey = async (pKey: string): Promise<string> => {
    const wallet = new Wallet(pKey);
    const shieldSignatureMessage = await getShieldPrivateKeySignatureMessage();
    const shieldPrivateKey = keccak256(
      await wallet.signMessage(shieldSignatureMessage),
    );
    return shieldPrivateKey;
  };

  const performTransaction = async (
    finalAdjustedERC20AmountRecipientGroup: AdjustedERC20AmountRecipientGroup,
    nftAmountRecipients: NFTAmountRecipient[],
    _selectedRelayer: Optional<SelectedRelayer>,
    _relayerFeeERC20Amount: Optional<ERC20Amount>,
    transactionGasDetails: TransactionGasDetails,
    customNonce: Optional<number>,
    _publicWalletOverride: Optional<AvailableWallet>,
    _showSenderAddressToRecipient: boolean,
    _memoText: Optional<string>,
    success: () => void,
    error: (err: Error) => void,
  ): Promise<Optional<string>> => {
    const pKey = await walletSecureService.getWallet0xPKey(activeWallet);
    const shieldPrivateKey = await getShieldPrivateKey(pKey);

    let populateResponse: Optional<RailgunPopulateTransactionResponse>;
    try {
      const shieldCall = isBaseTokenShield
        ? unauthenticatedWalletService.populateRailgunShieldBaseToken
        : unauthenticatedWalletService.populateRailgunShield;
      const [populateShieldResponse] = await Promise.all([
        shieldCall(
          txidVersion.current,
          network.current.name,
          shieldPrivateKey,
          finalAdjustedERC20AmountRecipientGroup.inputs,
          nftAmountRecipients,
          transactionGasDetails,
        ),
        delay(1000),
      ]);
      populateResponse = populateShieldResponse;
    } catch (cause) {
      error(new Error('Failed to populate shield.', { cause }));
      return;
    }

    try {
      await assertIsNotHighSevereRiskAddress(
        network.current.name,
        fromWalletAddress,
      );
      const txResponse = await executeWithoutRelayer(
        fromWalletAddress,
        pKey,
        populateResponse.transaction,
        network.current,
        customNonce,
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
        txResponse.nonce,
      );
      await refreshNFTsMetadataAfterShieldUnshield(
        dispatch,
        network.current.name,
        nftAmountRecipients,
      );
      success();
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
    nftAmountRecipients: NFTAmountRecipient[],
  ): Promise<bigint> => {
    const pKey = await walletSecureService.getWallet0xPKey(activeWallet);
    const shieldPrivateKey = await getShieldPrivateKey(pKey);

    const shieldGasEstimate = isBaseTokenShield
      ? unauthenticatedWalletService.getRailgunGasEstimateForShieldBaseToken
      : unauthenticatedWalletService.getRailgunGasEstimateForShield;

    return shieldGasEstimate(
      txidVersion,
      networkName,
      fromWalletAddress,
      shieldPrivateKey,
      erc20AmountRecipients,
      nftAmountRecipients,
    );
  };

  const infoCalloutText = `Shielding tokens into a private RAILGUN address.`;
  const processingText = 'Shielding tokens...';

  const balanceBucketFilter = [RailgunWalletBalanceBucket.Spendable];

  return (
    <>
      <ReviewTransactionView
        goBack={goBack}
        backButtonText="Select tokens"
        confirmButtonText="Shield"
        getGasEstimate={getGasEstimate}
        performTransaction={performTransaction}
        fromWalletAddress={fromWalletAddress}
        onSuccessCallback={onSuccess}
        isFullyPrivateTransaction={false}
        balanceBucketFilter={balanceBucketFilter}
        erc20AmountRecipients={erc20AmountRecipients}
        nftAmountRecipients={nftAmountRecipients}
        infoCalloutText={infoCalloutText}
        processingText={processingText}
        transactionType={transactionType}
        useRelayAdapt={isBaseTokenShield}
        showCustomNonce={true}
      />
      {alert && <GenericAlert {...alert} />}
    </>
  );
};
