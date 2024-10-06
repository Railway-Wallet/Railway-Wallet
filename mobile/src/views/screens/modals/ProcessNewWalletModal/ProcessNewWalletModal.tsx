import { isDefined } from "@railgun-community/shared-models";
import React, { useEffect, useState } from "react";
import { Modal } from "react-native";
import { Mnemonic, randomBytes } from "ethers";
import {
  ProcessingState,
  ProcessingView,
} from "@components/views/ProcessingView/ProcessingView";
import {
  FrontendWallet,
  getWalletTransactionHistory,
  logDev,
  RailgunTransactionHistorySync,
  refreshRailgunBalances,
  useAppDispatch,
  useBalancePriceRefresh,
  useReduxSelector,
  validateMnemonic,
  WalletService,
} from "@react-shared";
import {
  ErrorDetailsModal,
  ErrorDetailsModalProps,
} from "@screens/modals/ErrorDetailsModal/ErrorDetailsModal";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { WalletSecureServiceReactNative } from "@services/wallet/wallet-secure-service-react-native";
import { Constants } from "@utils/constants";

interface ProcessNewWalletModalProps {
  show: boolean;
  mnemonic?: string;
  walletName: string;
  derivationIndex?: number;
  originalCreationTimestamp?: number;
  onSuccessClose: (wallet: FrontendWallet) => void;
  onFailClose: () => void;
  defaultProcessingText: string;
  successText: string;
  isViewOnlyWallet: boolean;
  shareableViewingKey?: string;
}

export const ProcessNewWalletModal: React.FC<ProcessNewWalletModalProps> = ({
  show,
  mnemonic,
  walletName,
  derivationIndex,
  onSuccessClose,
  onFailClose,
  defaultProcessingText,
  successText,
  originalCreationTimestamp,
  isViewOnlyWallet,
  shareableViewingKey,
}) => {
  const dispatch = useAppDispatch();
  const { network } = useReduxSelector("network");

  const [processingState, setProcessingState] = useState(
    ProcessingState.Processing
  );
  const [failure, setFailure] = useState<Optional<Error>>(undefined);
  const [processingText, setProcessingText] = useState(defaultProcessingText);
  const [successWallet, setSuccessWallet] =
    useState<Optional<FrontendWallet>>();
  const [errorModal, setErrorModal] =
    useState<Optional<ErrorDetailsModalProps>>(undefined);

  const { pullBalances } = useBalancePriceRefresh(
    refreshRailgunBalances,
    (error: Error) =>
      setErrorModal({
        show: true,
        error,
        onDismiss: () => setErrorModal(undefined),
      })
  );

  const resetState = () => {
    setProcessingState(ProcessingState.Processing);
    setFailure(undefined);
    setProcessingText(defaultProcessingText);
    setSuccessWallet(undefined);
  };

  const onFail = () => {
    onFailClose();
    resetState();
  };

  const onSuccess = (wallet: FrontendWallet) => () => {
    onSuccessClose(wallet);
    resetState();
  };

  useEffect(() => {
    let timer: Optional<NodeJS.Timeout>;
    if (show) {
      const generateWallet = async (walletMnemonic: Optional<string>) => {
        setProcessingText(defaultProcessingText);

        const startTimeMsec = Date.now();

        const walletService = new WalletService(
          dispatch,
          new WalletSecureServiceReactNative()
        );

        try {
          let wallet: FrontendWallet;
          if (isViewOnlyWallet) {
            if (!isDefined(shareableViewingKey)) {
              throw new Error("Requires shareable private key.");
            }
            wallet = await walletService.addViewOnlyWallet(
              walletName.trim(),
              shareableViewingKey,
              undefined
            );
          } else if (isDefined(walletMnemonic)) {
            const trimmedMnemonic = walletMnemonic.trim();
            const isNewWallet = !isDefined(mnemonic);
            wallet = await walletService.addFullWallet(
              walletName.trim(),
              trimmedMnemonic,
              network.current,
              derivationIndex,
              isNewWallet,
              originalCreationTimestamp
            );
          } else {
            throw new Error("No view key or mnemonic provided");
          }

          setProcessingText("Pre-scanning balances...");
          await pullBalances(wallet);

          if (isDefined(mnemonic)) {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            RailgunTransactionHistorySync.safeSyncTransactionHistory(
              dispatch,
              network.current,
              getWalletTransactionHistory
            );
          }

          const finalCallback = () => {
            if (wallet.railAddress) {
              success(wallet);
            } else {
              fail(new Error("Failed to generate wallet."));
            }
          };

          const elapsedMsec = Date.now() - startTimeMsec;
          if (elapsedMsec > Constants.PROCESSING_PROCESS_TIMEOUT) {
            finalCallback();
          } else {
            timer = setTimeout(
              finalCallback,
              Constants.PROCESSING_PROCESS_TIMEOUT - elapsedMsec
            );
          }
        } catch (cause) {
          const err = new Error("Failed to create wallet", { cause });
          logDev(err);
          fail(err);
        }
      };

      const tryCreateWallet = async () => {
        const newMnemonic = Mnemonic.fromEntropy(randomBytes(16)).phrase.trim();
        await generateWallet(newMnemonic);
      };

      const tryImportWallet = async (importedMnemonic: string) => {
        const validMnemonic = validateMnemonic(importedMnemonic);
        if (!validMnemonic) {
          fail(new Error("Invalid seed phrase"));
          return;
        }
        await generateWallet(importedMnemonic);
      };

      const tryAddViewOnlyWallet = async () => {
        await generateWallet(undefined);
      };

      const success = (wallet: FrontendWallet) => {
        triggerHaptic(HapticSurface.NotifySuccess);
        setProcessingState(ProcessingState.Success);
        setSuccessWallet(wallet);
        timer = setTimeout(
          onSuccess(wallet),
          Constants.PROCESSING_CLOSE_SCREEN_SUCCESS_TIMEOUT
        );
      };
      const fail = (cause: Error) => {
        triggerHaptic(HapticSurface.NotifyError);
        setFailure(new Error("Failed to process new wallet", { cause }));
        setProcessingState(ProcessingState.Fail);
        timer = setTimeout(
          onFail,
          Constants.PROCESSING_CLOSE_SCREEN_ERROR_TIMEOUT
        );
      };

      if (isDefined(mnemonic)) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        tryImportWallet(mnemonic);
      } else if (isViewOnlyWallet) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        tryAddViewOnlyWallet();
      } else {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        tryCreateWallet();
      }
    }

    return () => {
      timer && clearTimeout(timer);
    };
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
        onPressSuccessView={
          successWallet ? onSuccess(successWallet) : undefined
        }
        onPressFailView={onFail}
      />
      {isDefined(errorModal) && <ErrorDetailsModal {...errorModal} />}
    </Modal>
  );
};
