import {
  isDefined,
  NetworkName,
  NFTAmountRecipient,
  RailgunWalletBalanceBucket,
  SelectedRelayer,
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
  executeERC20Approval,
  getERC20ApprovalGasEstimate,
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
  approveERC20Amount: ERC20Amount;
  spender: string;
  spenderName: string;
  authKey?: string;
  transactionType:
    | TransactionType.ApproveShield
    | TransactionType.ApproveSpender;
};

export const ApproveERC20Confirm: React.FC<Props> = ({
  goBack,
  backButtonText,
  infoCalloutText,
  approveERC20Amount,
  spender,
  spenderName,
  authKey: defaultAuthKey,
  transactionType,
}) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');

  const dispatch = useAppDispatch();

  const nftAmountRecipientsRef = useRef<NFTAmountRecipient[]>([]);

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

  const approveERC20AmountRecipient: ERC20AmountRecipient = {
    ...approveERC20Amount,
    recipientAddress: spender,
    externalUnresolvedToWalletAddress: undefined,
  };

  const fromWalletAddress = activeWallet.ethAddress;

  const onSuccess = () => {
    goBack();
  };

  const performTransaction = async (
    finalAdjustedERC20AmountRecipientGroup: AdjustedERC20AmountRecipientGroup,
    _nftAmountRecipients: NFTAmountRecipient[],
    _selectedRelayer: Optional<SelectedRelayer>,
    _relayerTokenFeeAmount: Optional<ERC20Amount>,
    transactionGasDetails: TransactionGasDetails,
    customNonce: Optional<number>,
    _publicWalletOverride: Optional<AvailableWallet>,
    _showSenderAddressToRecipient: boolean,
    _memoText: Optional<string>,
    success: () => void,
    error: (err: Error) => void,
  ): Promise<Optional<string>> => {
    try {
      if (finalAdjustedERC20AmountRecipientGroup.inputs.length !== 1) {
        throw new Error('Can only approve one token.');
      }
      const walletSecureService = new WalletSecureStorageWeb(authKey);
      const pKey = await walletSecureService.getWallet0xPKey(activeWallet);
      const [txResponse] = await Promise.all([
        executeERC20Approval(
          pKey,
          network.current.name,
          spender,
          finalAdjustedERC20AmountRecipientGroup.inputs[0],
          transactionGasDetails,
          customNonce,
        ),
        delay(1000),
      ]);
      const transactionService = new SavedTransactionService(dispatch);
      await transactionService.saveApproveTransaction(
        txResponse.hash,
        fromWalletAddress,
        finalAdjustedERC20AmountRecipientGroup.inputs,
        [], network.current,
        spender,
        spenderName,
        txResponse.nonce,
      );
      success();
      return txResponse.hash;
    } catch (cause) {
      error(new Error('Failed to execute ERC20 approval', { cause }));
      return undefined;
    }
  };

  const approvalGasEstimate = (
    _txidVersion: TXIDVersion,
    networkName: NetworkName,
    fromWalletAddress: string,
    tokenAmounts: ERC20Amount[],
  ): Promise<bigint> => {
    if (tokenAmounts.length !== 1) {
      throw new Error('Can only approve one token.');
    }
    return getERC20ApprovalGasEstimate(
      networkName,
      spender,
      fromWalletAddress,
      tokenAmounts[0],
    );
  };

  const processingText = 'Approving token...';

  const balanceBucketFilter = [RailgunWalletBalanceBucket.Spendable];

  return (
    <ReviewTransactionView
      goBack={goBack}
      backButtonText={backButtonText}
      confirmButtonText="Approve token"
      getGasEstimate={approvalGasEstimate}
      performTransaction={performTransaction}
      fromWalletAddress={fromWalletAddress}
      onSuccessCallback={onSuccess}
      isFullyPrivateTransaction={false}
      balanceBucketFilter={balanceBucketFilter}
      erc20AmountRecipients={[approveERC20AmountRecipient]}
      nftAmountRecipients={nftAmountRecipientsRef.current}
      infoCalloutText={infoCalloutText}
      processingText={processingText}
      hideTokenAmounts={true}
      transactionType={transactionType}
      useRelayAdapt={false}
      showCustomNonce={true}
    />
  );
};
