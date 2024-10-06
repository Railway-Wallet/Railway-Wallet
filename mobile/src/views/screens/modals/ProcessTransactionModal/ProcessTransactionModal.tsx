import {
  NFTAmountRecipient,
  SelectedBroadcaster,
  TransactionGasDetails,
} from "@railgun-community/shared-models";
import React, { useEffect, useState } from "react";
import { Modal } from "react-native";
import {
  ProcessingState,
  ProcessingView,
} from "@components/views/ProcessingView/ProcessingView";
import {
  AdjustedERC20AmountRecipientGroup,
  AvailableWallet,
  ERC20Amount,
  PerformTransactionType,
} from "@react-shared";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { Constants } from "@utils/constants";

interface ProcessTransactionModalProps {
  finalAdjustedERC20AmountRecipientGroup: AdjustedERC20AmountRecipientGroup;
  nftAmountRecipients: NFTAmountRecipient[];
  performTransaction: PerformTransactionType;
  selectedBroadcaster: Optional<SelectedBroadcaster>;
  broadcasterFeeERC20Amount: Optional<ERC20Amount>;
  transactionGasDetails: Optional<TransactionGasDetails>;
  showSenderAddressToRecipient: boolean;
  memoText: Optional<string>;
  onSuccessClose: () => void;
  onFailClose: (err: Error, isBroadcasterError?: boolean) => void;
  processingText: string;
  successText: string;
  showKeepAppOpenText?: boolean;
  customNonce: Optional<number>;
  publicWalletOverride: Optional<AvailableWallet>;
  show: boolean;
}

export const ProcessTransactionModal: React.FC<
  ProcessTransactionModalProps
> = ({
  finalAdjustedERC20AmountRecipientGroup,
  nftAmountRecipients,
  performTransaction,
  selectedBroadcaster,
  broadcasterFeeERC20Amount,
  transactionGasDetails,
  onSuccessClose,
  onFailClose,
  processingText,
  successText,
  showKeepAppOpenText = false,
  customNonce,
  publicWalletOverride,
  showSenderAddressToRecipient,
  memoText,
  show,
}) => {
  const [processingState, setProcessingState] = useState(
    ProcessingState.Processing
  );
  const [failure, setFailure] = useState<Optional<Error>>(undefined);

  useEffect(() => {
    if (show) {
      const success = () => {
        triggerHaptic(HapticSurface.NotifySuccess);
        setProcessingState(ProcessingState.Success);
        setTimeout(
          () => onSuccessClose(),
          Constants.PROCESSING_CLOSE_SCREEN_SUCCESS_TIMEOUT
        );
      };
      const error = (cause: Error, isBroadcasterError?: boolean) => {
        triggerHaptic(HapticSurface.NotifyError);
        setFailure(new Error("Failed to process transaction.", { cause }));
        setProcessingState(ProcessingState.Fail);
        setTimeout(
          () => onFailClose(cause, isBroadcasterError),
          Constants.PROCESSING_CLOSE_SCREEN_ERROR_TIMEOUT
        );
      };

      if (!transactionGasDetails) {
        error(new Error("No gas details for this transaction."));
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
        error
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  return (
    <Modal
      animationType="slide"
      visible={show}
      presentationStyle="overFullScreen"
      transparent
      onDismiss={() => {
        setProcessingState(ProcessingState.Processing);
      }}
    >
      <ProcessingView
        processingState={processingState}
        processingText={processingText}
        successText={successText}
        failure={failure}
        processingWarning={
          showKeepAppOpenText ? "Please keep the app open" : ""
        }
        onPressSuccessView={onSuccessClose}
        onPressFailView={onFailClose}
      />
    </Modal>
  );
};
