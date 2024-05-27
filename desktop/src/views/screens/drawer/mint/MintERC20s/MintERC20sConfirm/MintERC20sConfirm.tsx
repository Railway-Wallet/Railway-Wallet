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
import { EVENT_CLOSE_DRAWER } from '@models/drawer-types';
import {
  AdjustedERC20AmountRecipientGroup,
  AvailableWallet,
  delay,
  ERC20Amount,
  ERC20AmountRecipient,
  executeERC20Mint,
  getERC20MintGasEstimate,
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
  tokenAmount: ERC20Amount;
};

export const MintERC20sConfirm = ({ tokenAmount }: Props) => {
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

  const transactionType = TransactionType.Mint;

  const activeWallet = wallets.active;
  if (!activeWallet || activeWallet.isViewOnlyWallet) {
    return null;
  }

  const toWalletAddress = activeWallet.ethAddress;
  const walletSecureService = new WalletSecureStorageWeb(authKey);

  const erc20AmountRecipient: ERC20AmountRecipient = {
    ...tokenAmount,
    recipientAddress: toWalletAddress,
    externalUnresolvedToWalletAddress: undefined,
  };

  const onSuccess = () => {
    drawerEventsBus.dispatch(EVENT_CLOSE_DRAWER);
  };

  const performTransaction = async (
    finalAdjustedERC20AmountRecipientGroup: AdjustedERC20AmountRecipientGroup,
    _nftAmountRecipients: NFTAmountRecipient[],
    _selectedBroadcaster: Optional<SelectedBroadcaster>,
    _broadcasterFeeERC20Amount: Optional<ERC20Amount>,
    transactionGasDetails: TransactionGasDetails,
    customNonce: Optional<number>,
    _publicWalletOverride: Optional<AvailableWallet>,
    _showSenderAddressToRecipient: boolean,
    _memoText: Optional<string>,
    success: () => void,
    error: (err: Error) => void,
  ): Promise<Optional<string>> => {
    try {
      const pKey = await walletSecureService.getWallet0xPKey(activeWallet);
      const [txResponse] = await Promise.all([
        executeERC20Mint(
          pKey,
          network.current.name,
          toWalletAddress,
          finalAdjustedERC20AmountRecipientGroup.inputs[0],
          transactionGasDetails,
          customNonce,
        ),
        delay(500),
      ]);
      const transactionService = new SavedTransactionService(dispatch);
      await transactionService.saveMintTransaction(
        txResponse.hash,
        toWalletAddress,
        finalAdjustedERC20AmountRecipientGroup.inputs[0],
        network.current,
        txResponse.nonce,
      );
      success();
      return txResponse.hash;
    } catch (cause) {
      error(new Error('Failed to execute ERC20 mint.', { cause }));
      return undefined;
    }
  };

  const mintGasEstimate = (
    _txidVersion: TXIDVersion,
    networkName: NetworkName,
    fromWalletAddress: string,
    tokenAmounts: ERC20Amount[],
  ): Promise<bigint> => {
    if (tokenAmounts.length !== 1) {
      throw new Error('Can only mint one token.');
    }
    return getERC20MintGasEstimate(
      networkName,
      toWalletAddress,
      fromWalletAddress,
      tokenAmounts[0],
    );
  };

  const infoCalloutText = `Minting tokens into a public ${network.current.publicName} address.`;
  const processingText = 'Minting tokens...';

  const balanceBucketFilter = [RailgunWalletBalanceBucket.Spendable];

  return (
    <ReviewTransactionView
      backButtonText="Cancel"
      confirmButtonText="Mint"
      getGasEstimate={mintGasEstimate}
      performTransaction={performTransaction}
      fromWalletAddress={tokenAmount.token.address}
      onSuccessCallback={onSuccess}
      isFullyPrivateTransaction={false}
      balanceBucketFilter={balanceBucketFilter}
      erc20AmountRecipients={[erc20AmountRecipient]}
      nftAmountRecipients={nftAmountRecipientsRef.current}
      infoCalloutText={infoCalloutText}
      processingText={processingText}
      transactionType={transactionType}
      useRelayAdapt={false}
      showCustomNonce={true}
    />
  );
};
