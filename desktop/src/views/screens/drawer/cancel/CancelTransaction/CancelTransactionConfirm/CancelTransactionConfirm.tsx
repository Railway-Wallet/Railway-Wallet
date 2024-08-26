import {
  isDefined,
  NetworkName,
  NFTAmountRecipient,
  RailgunWalletBalanceBucket,
  SelectedBroadcaster,
  TransactionGasDetails,
  TXIDVersion,
} from '@railgun-community/shared-models';
import { useRef, useState } from 'react';
import { TransactionResponse } from 'ethers';
import { Text } from '@components/Text/Text';
import { EVENT_CLOSE_DRAWER } from '@models/drawer-types';
import {
  AdjustedERC20AmountRecipientGroup,
  AvailableWallet,
  baseTokenForWallet,
  delay,
  ERC20Amount,
  ERC20AmountRecipient,
  executeERC20Transfer,
  getERC20TransferGasEstimate,
  SavedTransaction,
  SavedTransactionService,
  TransactionType,
  useAppDispatch,
  useReduxSelector,
} from '@react-shared';
import { ReviewTransactionView } from '@screens/drawer/review-transaction/ReviewTransactionView';
import { EnterPasswordModal } from '@screens/modals/EnterPasswordModal/EnterPasswordModal';
import { drawerEventsBus } from '@services/navigation/drawer-events';
import { WalletSecureStorageWeb } from '@services/wallet/wallet-secure-service-web';

type Props = {
  transaction: SavedTransaction;
  txResponse: TransactionResponse;
};

export const CancelTransactionConfirm = ({
  transaction,
  txResponse,
}: Props) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');

  const dispatch = useAppDispatch();

  const [authKey, setAuthKey] = useState<Optional<string>>();

  const nftAmountRecipientsRef = useRef<NFTAmountRecipient[]>([]);

  if (!isDefined(authKey)) {
    return (
      <EnterPasswordModal
        success={setAuthKey}
        onDismiss={() => {
          drawerEventsBus.dispatch(EVENT_CLOSE_DRAWER);
        }}
      />
    );
  }

  const transactionType = TransactionType.Cancel;

  const gasToken = baseTokenForWallet(network.current.name, wallets.active);

  if (!gasToken) {
    return null;
  }
  if (!isDefined(txResponse)) {
    return (
      <Text style={{ margin: 24 }}>
        Nothing to cancel. Transaction not found.
      </Text>
    );
  }

  const toWalletAddress = transaction.publicExecutionWalletAddress;
  if (!isDefined(toWalletAddress)) {
    return null;
  }

  const activeWallet = wallets.active;
  if (!activeWallet || activeWallet.isViewOnlyWallet) {
    return null;
  }

  if (toWalletAddress !== activeWallet.ethAddress) {
    return (
      (<Text style={{ margin: 24 }}>Must cancel with public wallet active: {toWalletAddress}. This is
                currently not possible in Railway wallet.
              </Text>)
    );
  }

  const fromWalletAddress = toWalletAddress;

  const erc20AmountRecipient: ERC20AmountRecipient = {
    token: gasToken,
    amountString: '0',
    recipientAddress: toWalletAddress,
    externalUnresolvedToWalletAddress: undefined,
  };

  const walletSecureService = new WalletSecureStorageWeb(authKey);

  const onSuccess = () => {
    drawerEventsBus.dispatch(EVENT_CLOSE_DRAWER);
  };

  const getGasLimitOverrideForCancel = (): bigint => {
    return txResponse.gasLimit + 1n;
  };

  const performTransaction = async (
    finalAdjustedERC20AmountRecipientGroup: AdjustedERC20AmountRecipientGroup,
    _nftAmountRecipients: NFTAmountRecipient[],
    _selectedBroadcaster: Optional<SelectedBroadcaster>,
    _broadcasterFeeERC20Amount: Optional<ERC20Amount>,
    transactionGasDetails: TransactionGasDetails,
    _customNonce: Optional<number>,
    _publicWalletOverride: Optional<AvailableWallet>,
    _showSenderAddressToRecipient: boolean,
    _memoText: Optional<string>,
    success: () => void,
    error: (err: Error) => void,
  ): Promise<Optional<string>> => {
    try {
      const pKey = await walletSecureService.getWallet0xPKey(activeWallet);
      const [newTxResponse] = await Promise.all([
        executeERC20Transfer(
          pKey,
          network.current.name,
          toWalletAddress,
          finalAdjustedERC20AmountRecipientGroup.inputs[0],
          transactionGasDetails,
          txResponse.nonce,
          getGasLimitOverrideForCancel(),
        ),
        delay(500),
      ]);
      const transactionService = new SavedTransactionService(dispatch);
      const newTransactionID = newTxResponse.hash;
      const originalTokenAmounts = transaction.tokenAmounts;
      const originalTransactionID = txResponse.hash;
      await transactionService.saveCancelTransaction(
        newTransactionID,
        fromWalletAddress,
        originalTokenAmounts,
        network.current,
        originalTransactionID,
        newTxResponse.nonce,
      );
      success();
      return newTransactionID;
    } catch (cause) {
      error(new Error('Failed to cancel transaction', { cause }));
      return undefined;
    }
  };

  const transferGasEstimate = (
    _txidVersion: TXIDVersion,
    networkName: NetworkName,
    fromWalletAddress: string,
    tokenAmounts: ERC20Amount[],
  ) =>
    getERC20TransferGasEstimate(
      networkName,
      toWalletAddress,
      fromWalletAddress,
      tokenAmounts[0],
    );

  const txCancelGasText =
    txResponse.type === 2
      ? `Max base fee must exceed original transaction by 30% to be accepted by the network. Priority fee must exceed original by 10%.`
      : `Gas price must exceed original transaction by 30% to be accepted by the network.`;
  const infoCalloutText = `Canceling ${network.current.shortPublicName} transaction: ${txResponse.nonce}. ${txCancelGasText}`;
  const processingText = 'Submitting cancelation...';

  const balanceBucketFilter = [RailgunWalletBalanceBucket.Spendable];

  return (
    <ReviewTransactionView
      backButtonText="Back"
      confirmButtonText="Submit cancelation"
      getGasEstimate={transferGasEstimate}
      performTransaction={performTransaction}
      fromWalletAddress={erc20AmountRecipient.token.address}
      onSuccessCallback={onSuccess}
      isFullyPrivateTransaction={false}
      balanceBucketFilter={balanceBucketFilter}
      erc20AmountRecipients={[erc20AmountRecipient]}
      nftAmountRecipients={nftAmountRecipientsRef.current}
      infoCalloutText={infoCalloutText}
      processingText={processingText}
      transactionType={transactionType}
      cancelTxResponse={txResponse}
      useRelayAdapt={false}
      showCustomNonce={false}
    />
  );
};
