import { isDefined } from '@railgun-community/shared-models';
import { getRandomBytes } from '@railgun-community/wallet';
import { useState } from 'react';
import { GenericAlert } from '@components/alerts/GenericAlert/GenericAlert';
import { DownloadableFileExtension } from '@models/file-extensions';
import {
  encryptAESGCM256,
  FrontendWallet,
  FrontendWalletWithMnemonic,
} from '@react-shared';
import { EnterPasswordModal } from '@screens/modals/EnterPasswordModal/EnterPasswordModal';
import { WalletSecureStorageWeb } from '@services/wallet/wallet-secure-service-web';
import { downloadFile } from '@utils/download-file';
import { createSharedKeyFromKeyword } from '@utils/export-keyword';
import styles from './ExportWalletAlert.module.scss';

interface ExportWalletProps {
  wallet: FrontendWallet;
  onClose: () => void;
}

const exportWalletMessage = `Export your wallet, including its seed phrase and other settings, into an encrypted .railway file.\n\nPlease use a strong, memorable File Encryption Code. This can be the same as your wallet password, or a different string. This code is required to import your wallet into a new device.`;

export const ExportWalletAlert = ({ onClose, wallet }: ExportWalletProps) => {
  const [authKey, setAuthKey] = useState<Optional<string>>();

  if (!isDefined(authKey)) {
    return <EnterPasswordModal success={setAuthKey} onDismiss={onClose} />;
  }

  const createBackupFile = async (keyWord: string) => {
    if (!authKey) {
      return;
    }

    const walletSecureService = new WalletSecureStorageWeb(authKey);
    const mnemonic = await walletSecureService.getWalletMnemonic(wallet);
    const salt = await getRandomBytes(16);
    const sharedKey = await createSharedKeyFromKeyword(keyWord, salt);
    const walletData: FrontendWalletWithMnemonic = {
      ...wallet,
      mnemonic,
    };
    const encryptedFile = await encryptAESGCM256(walletData, sharedKey);
    const exportJSON = {
      encryptedFile,
      salt,
    };
    const file = new Blob([JSON.stringify(exportJSON)], {
      type: 'application/json',
    });
    downloadFile(file, wallet.name, DownloadableFileExtension.RAILWAY);
  };

  return (
    <GenericAlert
      showInput
      onClose={onClose}
      title="Export Wallet"
      message={exportWalletMessage}
      inputPlaceholder="File encryption code"
      maxLength={20}
      messageClassName={styles.message}
      inputType="password"
      disableInputAutoComplete={true}
      submitTitle="Export Wallet"
      onSubmit={(inputValue?: string) => {
        if (isDefined(inputValue)) {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          createBackupFile(inputValue);
        }
      }}
    />
  );
};
