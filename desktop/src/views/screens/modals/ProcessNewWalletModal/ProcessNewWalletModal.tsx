import { isDefined } from '@railgun-community/shared-models';
import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { Mnemonic, randomBytes } from 'ethers';
import {
  ProcessingState,
  ProcessingView,
} from '@components/ProcessingView/ProcessingView';
import {
  FrontendWallet,
  FrontendWalletWithMnemonic,
  getWalletTransactionHistory,
  logDev,
  RailgunTransactionHistorySync,
  refreshRailgunBalances,
  useAppDispatch,
  useBalancePriceRefresh,
  useReduxSelector,
  validateMnemonic,
  WalletService,
} from '@react-shared';
import {
  ErrorDetailsModal,
  ErrorDetailsModalProps,
} from '@screens/modals/ErrorDetailsModal/ErrorDetailsModal';
import { WalletSecureStorageWeb } from '@services/wallet/wallet-secure-service-web';
import { Constants } from '@utils/constants';
import { defaultModalStyle } from '../modalStyle';

interface ProcessNewWalletModalProps {
  mnemonic?: string;
  walletName: string;
  derivationIndex?: number;
  onSuccessClose: (wallet: FrontendWallet) => void;
  onFailClose: () => void;
  defaultProcessingText: string;
  successText: string;
  authKey: string;
  isViewOnlyWallet: boolean;
  shareableViewingKey?: string;
  importedWalletData?: FrontendWalletWithMnemonic;
  originalCreationTimestamp?: number;
}

export const ProcessNewWalletModal: React.FC<ProcessNewWalletModalProps> = ({
  mnemonic,
  walletName,
  derivationIndex,
  onSuccessClose,
  onFailClose,
  defaultProcessingText,
  successText,
  authKey,
  isViewOnlyWallet,
  originalCreationTimestamp,
  shareableViewingKey,
  importedWalletData,
}) => {
  Modal.setAppElement('#root');

  const { network } = useReduxSelector('network');

  const [processingState, setProcessingState] = useState(
    ProcessingState.Processing,
  );
  const [failure, setFailure] = useState<Optional<Error>>(undefined);
  const [processingText, setProcessingText] = useState(defaultProcessingText);
  const [successWallet, setSuccessWallet] =
    useState<Optional<FrontendWallet>>();
  const [errorModal, setErrorModal] = useState<
    ErrorDetailsModalProps | undefined
  >(undefined);

  const dispatch = useAppDispatch();

  const { pullBalances } = useBalancePriceRefresh(
    refreshRailgunBalances,
    (error: Error) =>
      setErrorModal({
        error,
        onDismiss: () => setErrorModal(undefined),
      }),
  );

  useEffect(() => {
    let timer: Optional<NodeJS.Timeout>;
    const generateWallet = async (walletMnemonic: Optional<string>) => {
      try {
        if (!authKey) {
          throw new Error('Auth key does not exist.');
        }
        setProcessingText(defaultProcessingText);

        const startTimeMsec = Date.now();
        const walletService = new WalletService(
          dispatch,
          new WalletSecureStorageWeb(authKey),
        );

        let wallet: FrontendWallet;
        if (isViewOnlyWallet) {
          if (!isDefined(shareableViewingKey)) {
            throw new Error('Requires shareable private key.');
          }
          wallet = await walletService.addViewOnlyWallet(
            walletName,
            shareableViewingKey,
            undefined,
          );
        } else if (isDefined(walletMnemonic)) {
          const trimmedMnemonic = walletMnemonic.trim();
          const isNewWallet = !isDefined(mnemonic);
          wallet = await walletService.addFullWallet(
            walletName,
            trimmedMnemonic,
            network.current,
            derivationIndex,
            isNewWallet,
            originalCreationTimestamp,
          );
        } else {
          throw new Error('No view key or mnemonic provided');
        }
        if (importedWalletData) {
          await walletService.updateImportedWalletData(
            wallet,
            importedWalletData,
          );
        }

        try {
          setProcessingText('Pre-scanning balances...');
          await pullBalances(wallet);
        } catch (error) {
          logDev('Failed to pull balances after create wallet.');
        }

        if (isDefined(mnemonic)) {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          RailgunTransactionHistorySync.safeSyncTransactionHistory(
            dispatch,
            network.current,
            getWalletTransactionHistory,
          );
        }

        const finalCallback = () => {
          if (wallet.railAddress) {
            success(wallet);
          } else {
            fail(new Error('Failed to generate wallet.'));
          }
        };
        const elapsedMsec = Date.now() - startTimeMsec;
        if (elapsedMsec > Constants.PROCESSING_PROCESS_TIMEOUT) {
          finalCallback();
        } else {
          timer = setTimeout(
            finalCallback,
            Constants.PROCESSING_PROCESS_TIMEOUT - elapsedMsec,
          );
        }
      } catch (cause) {
        logDev(cause);
        fail(cause);
      }
    };

    const tryCreateWallet = async () => {
      const newMnemonic = Mnemonic.fromEntropy(randomBytes(16)).phrase;
      await generateWallet(newMnemonic);
    };

    const tryImportWallet = async (importedMnemonic: string) => {
      const validMnemonic = validateMnemonic(importedMnemonic);
      if (!validMnemonic) {
        fail(new Error('Invalid seed phrase'));
        return;
      }
      await generateWallet(importedMnemonic);
    };

    const tryAddViewOnlyWallet = async () => {
      await generateWallet(
        undefined,
      );
    };

    const success = (wallet: FrontendWallet) => {
      setProcessingState(ProcessingState.Success);
      setSuccessWallet(wallet);
      timer = setTimeout(
        () => onSuccessClose(wallet),
        Constants.PROCESSING_CLOSE_SCREEN_SUCCESS_TIMEOUT,
      );
    };
    const fail = (err: Error) => {
      setFailure(err);
      setProcessingState(ProcessingState.Fail);
      timer = setTimeout(
        onFailClose,
        Constants.PROCESSING_CLOSE_SCREEN_ERROR_TIMEOUT,
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

    return () => {
      timer && clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        onPressSuccessView={
          successWallet ? () => onSuccessClose(successWallet) : undefined
        }
        onPressFailView={onFailClose}
      />
      {isDefined(errorModal) && <ErrorDetailsModal {...errorModal} />}
    </Modal>
  );
};
