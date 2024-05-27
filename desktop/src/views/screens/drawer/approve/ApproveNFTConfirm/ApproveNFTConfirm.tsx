import {
  isDefined,
  NetworkName,
  NFTAmount,
  NFTAmountRecipient,
  RailgunWalletBalanceBucket,
  SelectedBroadcaster,
  TransactionGasDetails,
  TXIDVersion,
} from '@railgun-community/shared-models';
import React, { useRef, useState } from 'react';
import { EVENT_CLOSE_DRAWER } from '@models/drawer-types';
import {
  AdjustedERC20AmountRecipientGroup,
  AvailableWallet,
  delay,
  ERC20Amount,
  ERC20AmountRecipient,
  executeNFTApproveAll,
  getNFTApproveAllGasEstimate,
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
  goBack: () => void;
  backButtonText: string;
  infoCalloutText: string;
  approveNFTAmount: NFTAmount;
  spender: string;
  spenderName: string;
  authKey?: string;
  transactionType:
    | TransactionType.ApproveShield
    | TransactionType.ApproveSpender;
};

export const ApproveNFTConfirm: React.FC<Props> = ({
  goBack,
  backButtonText,
  infoCalloutText,
  approveNFTAmount,
  spender,
  spenderName,
  authKey: defaultAuthKey,
  transactionType,
}) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');

  const dispatch = useAppDispatch();

  const erc20AmountRecipientsRef = useRef<ERC20AmountRecipient[]>([]);

  const [authKey, setAuthKey] = useState<Optional<string>>(defaultAuthKey);
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

  const activeWallet = wallets.active;
  if (!activeWallet || activeWallet.isViewOnlyWallet) {
    return null;
  }

  const approveNFTAmountRecipient: NFTAmountRecipient = {
    ...approveNFTAmount,
    recipientAddress: spender,
  };

  const fromWalletAddress = activeWallet.ethAddress;

  const onSuccess = () => {
    goBack();
  };

  const performTransaction = async (
    _finalAdjustedERC20AmountRecipientGroup: AdjustedERC20AmountRecipientGroup,
    nftAmountRecipients: NFTAmountRecipient[],
    _selectedBroadcaster: Optional<SelectedBroadcaster>,
    _broadcasterTokenFeeAmount: Optional<ERC20Amount>,
    transactionGasDetails: TransactionGasDetails,
    customNonce: Optional<number>,
    _publicWalletOverride: Optional<AvailableWallet>,
    _showSenderAddressToRecipient: boolean,
    _memoText: Optional<string>,
    success: () => void,
    error: (err: Error) => void,
  ): Promise<Optional<string>> => {
    try {
      if (nftAmountRecipients.length !== 1) {
        throw new Error('Can only approve one NFT.');
      }
      const walletSecureService = new WalletSecureStorageWeb(authKey);
      const pKey = await walletSecureService.getWallet0xPKey(activeWallet);
      const [txResponse] = await Promise.all([
        executeNFTApproveAll(
          pKey,
          network.current.name,
          spender,
          nftAmountRecipients[0],
          transactionGasDetails,
          customNonce,
        ),
        delay(1000),
      ]);
      const transactionService = new SavedTransactionService(dispatch);
      await transactionService.saveApproveTransaction(
        txResponse.hash,
        fromWalletAddress,
        [], nftAmountRecipients,
        network.current,
        spender,
        spenderName,
        txResponse.nonce,
      );
      success();
      return txResponse.hash;
    } catch (cause) {
      error(new Error('Failed to execute NFT approval', { cause }));
      return undefined;
    }
  };

  const approvalGasEstimate = (
    _txidVersion: TXIDVersion,
    networkName: NetworkName,
    fromWalletAddress: string,
    _tokenAmounts: ERC20Amount[],
  ): Promise<bigint> => {
    return getNFTApproveAllGasEstimate(
      networkName,
      spender,
      fromWalletAddress,
      approveNFTAmount,
    );
  };

  const processingText = 'Approving NFT collection for shielding...';

  const balanceBucketFilter = [RailgunWalletBalanceBucket.Spendable];

  return (
    <ReviewTransactionView
      goBack={goBack}
      backButtonText={backButtonText}
      confirmButtonText="Approve NFT collection"
      getGasEstimate={approvalGasEstimate}
      performTransaction={performTransaction}
      fromWalletAddress={fromWalletAddress}
      onSuccessCallback={onSuccess}
      isFullyPrivateTransaction={false}
      balanceBucketFilter={balanceBucketFilter}
      erc20AmountRecipients={erc20AmountRecipientsRef.current}
      nftAmountRecipients={[approveNFTAmountRecipient]}
      infoCalloutText={infoCalloutText}
      processingText={processingText}
      hideTokenAmounts={true}
      transactionType={transactionType}
      useRelayAdapt={false}
      showCustomNonce={true}
    />
  );
};
