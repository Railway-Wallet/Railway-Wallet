import {
  NFTAmountRecipient,
  SelectedBroadcaster,
  TransactionGasDetails,
} from '@railgun-community/shared-models';
import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import {
  ProcessingState,
  ProcessingView,
} from '@components/ProcessingView/ProcessingView';
import { useUnload } from '@hooks/useUnload';
import {
  AdjustedERC20AmountRecipientGroup,
  AvailableWallet,
  ERC20Amount,
  PerformTransactionType,
} from '@react-shared';
import { Constants } from '@utils/constants';
import { defaultModalStyle } from '../modalStyle';

interface ProcessTransactionModalProps {
  finalAdjustedERC20AmountRecipientGroup: AdjustedERC20AmountRecipientGroup;
  nftAmountRecipients: NFTAmountRecipient[];
  performTransaction: PerformTransactionType;
  selectedBroadcaster: Optional<SelectedBroadcaster>;
  broadcasterFeeERC20Amount: Optional<ERC20Amount>;
  publicWalletOverride: Optional<AvailableWallet>;
  transactionGasDetails: Optional<TransactionGasDetails>;
  showSenderAddressToRecipient: boolean;
  memoText: Optional<string>;
  onSuccessClose: () => void;
  onFailClose: (err: Error, isBroadcasterError?: boolean) => void;
  processingText: string;
  successText: string;
  showKeepAppOpenText?: boolean;
  customNonce: Optional<number>;
}

export const ProcessTransactionModal: React.FC<
  ProcessTransactionModalProps
> = ({
  finalAdjustedERC20AmountRecipientGroup,
  nftAmountRecipients,
  performTransaction,
  selectedBroadcaster,
  broadcasterFeeERC20Amount,
  publicWalletOverride,
  transactionGasDetails,
  showSenderAddressToRecipient,
  memoText,
  onSuccessClose,
  onFailClose,
  processingText,
  successText,
  showKeepAppOpenText = false,
  customNonce,
}) => {
  Modal.setAppElement('#root');
  const [processingState, setProcessingState] = useState(
    ProcessingState.Processing,
  );
  const [failure, setFailure] = useState<Optional<Error>>(undefined);

  const success = () => {
    setProcessingState(ProcessingState.Success);
    setTimeout(
      () => onSuccessClose(),
      Constants.PROCESSING_CLOSE_SCREEN_SUCCESS_TIMEOUT,
    );
  };
  const error = (cause: Error, isBroadcasterError?: boolean) => {
    setFailure(new Error('Failed to process transaction.', { cause }));
    setProcessingState(ProcessingState.Fail);
    setTimeout(
      () => onFailClose(cause, isBroadcasterError),
      Constants.PROCESSING_CLOSE_SCREEN_ERROR_TIMEOUT,
    );
  };

  useEffect(() => {
    if (!transactionGasDetails) {
      error(new Error('No gas details for this transaction.'));
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    performTransaction(
      finalAdjustedERC20AmountRecipientGroup,
      nftAmountRecipients,
      publicWalletOverride ? undefined : selectedBroadcaster,
      publicWalletOverride ? undefined : broadcasterFeeERC20Amount,
      transactionGasDetails,
      customNonce,
      publicWalletOverride,
      showSenderAddressToRecipient,
      memoText,
      success,
      error,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useUnload(e => {
    const confirmationMessage =
      'Are you sure you want to leave? Your transaction may not process.';
    (e ?? window.event).returnValue = confirmationMessage;
    return confirmationMessage;
  });

  return (
    // @ts-expect-error ignore this
    <Modal
      isOpen={true}
      shouldCloseOnOverlayClick={false}
      style={defaultModalStyle}
    >
      <ProcessingView
        processingState={processingState}
        processingText={processingText}
        successText={successText}
        failure={failure}
        processingWarning={
          showKeepAppOpenText ? 'Please keep Railway open' : ''
        }
        onPressSuccessView={onSuccessClose}
        onPressFailView={onFailClose}
      />
    </Modal>
  );
};
