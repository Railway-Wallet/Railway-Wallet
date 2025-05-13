import {
  isDefined,
  NFTAmountRecipient,
  SelectedBroadcaster,
} from '@railgun-community/shared-models';
import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import {
  ProcessingState,
  ProcessingView,
} from '@components/ProcessingView/ProcessingView';
import {
  AvailableWallet,
  ERC20Amount,
  ERC20AmountRecipient,
  PerformGenerateProofType,
  resetProofProgress,
  useAppDispatch,
  useReduxSelector,
} from '@react-shared';
import { Constants } from '@utils/constants';
import { defaultModalStyle } from '../modalStyle';

interface GenerateProofModalProps {
  finalERC20AmountRecipients: ERC20AmountRecipient[];
  nftAmountRecipients: NFTAmountRecipient[];
  selectedBroadcaster: Optional<SelectedBroadcaster>;
  broadcasterFeeERC20Amount: Optional<ERC20Amount>;
  publicWalletOverride: Optional<AvailableWallet>;
  showSenderAddressToRecipient: boolean;
  memoText: Optional<string>;
  overallBatchMinGasPrice: Optional<bigint>;
  performGenerateProof: PerformGenerateProofType;
  onSuccessClose: () => void;
  onFailClose: (err: Error) => void;
}

export const GenerateProofModal: React.FC<GenerateProofModalProps> = ({
  finalERC20AmountRecipients,
  nftAmountRecipients,
  selectedBroadcaster,
  broadcasterFeeERC20Amount,
  publicWalletOverride,
  showSenderAddressToRecipient,
  memoText,
  overallBatchMinGasPrice,
  performGenerateProof,
  onSuccessClose,
  onFailClose,
}) => {
  Modal.setAppElement('#root');

  const { proofProgress } = useReduxSelector('proofProgress');
  const [processingState, setProcessingState] = useState(
    ProcessingState.Processing,
  );
  const [failure, setFailure] = useState<Optional<Error>>(undefined);

  const dispatch = useAppDispatch();

  useEffect(() => {
    const success = () => {
      setProcessingState(ProcessingState.Success);
      setTimeout(
        () => onSuccessClose(),
        Constants.PROCESSING_CLOSE_SCREEN_SUCCESS_TIMEOUT,
      );
    };
    const fail = (cause: Error) => {
      setFailure(new Error('Failed to generate proof.', { cause }));
      setProcessingState(ProcessingState.Fail);
      setTimeout(
        () => onFailClose(cause),
        Constants.PROCESSING_CLOSE_SCREEN_ERROR_TIMEOUT,
      );
    };

    dispatch(resetProofProgress());

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    performGenerateProof(
      finalERC20AmountRecipients,
      nftAmountRecipients,
      publicWalletOverride ? undefined : selectedBroadcaster,
      publicWalletOverride ? undefined : broadcasterFeeERC20Amount,
      publicWalletOverride,
      showSenderAddressToRecipient,
      memoText,
      overallBatchMinGasPrice,
      success,
      fail,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processingText =
    isDefined(proofProgress.status) && proofProgress.status !== ''
      ? proofProgress.status
      : 'Generating proof...';

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
        successText={`Proof generated successfully.\n\nNext, submit through ${
          publicWalletOverride ? 'the selected wallet' : 'the selected broadcaster'
        }.`}
        failure={failure}
        processingWarning="Please keep Railway open. This may take 5-10 seconds per token."
        progress={proofProgress.progress}
        onPressSuccessView={onSuccessClose}
        onPressFailView={onFailClose}
      />
    </Modal>
  );
};
