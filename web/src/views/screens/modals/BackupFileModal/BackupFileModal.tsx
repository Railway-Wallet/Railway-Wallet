import { isDefined } from '@railgun-community/shared-models';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Input } from '@components/Input/Input';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { Text } from '@components/Text/Text';
import {
  decryptAESGCM256,
  FrontendWallet,
  FrontendWalletWithMnemonic,
  SharedConstants,
} from '@react-shared';
import { EnterPasswordModal } from '@screens/modals/EnterPasswordModal/EnterPasswordModal';
import { ProcessNewWalletModal } from '@screens/modals/ProcessNewWalletModal/ProcessNewWalletModal';
import { IconType, renderIcon } from '@services/util/icon-service';
import { createSharedKeyFromKeyword } from '@utils/export-keyword';
import styles from './BackupFileModal.module.scss';

interface BackupFileProps {
  onClose: (wallet?: FrontendWallet, authKey?: string) => void;
  showBackChevron?: boolean;
  onBack?: () => void;
  afterPasswordAuthKey?: string;
}

enum BackupErrors {
  INVALID_FILE = 'The file you selected is not a .railway file.',
  MULTIPLE_FILES = 'Please select one .railway file at a time.',
  DECRYPTION_FAILED = 'There was an error decrypting the file. Please enter the correct wallet encryption code.',
}

export const BackupFileModal = ({
  onClose,
  onBack,
  showBackChevron = true,
  afterPasswordAuthKey,
}: BackupFileProps) => {
  const [keyWord, setKeyWord] = useState<string>('');
  const [error, setError] = useState<Optional<Error>>();
  const [backupWallet, setBackupWallet] =
    useState<Optional<FrontendWalletWithMnemonic>>(undefined);
  const [authKey, setAuthKey] =
    useState<Optional<string>>(afterPasswordAuthKey);

  const onDrop = useCallback(
    async ([file]: File[]) => {
      if (!isDefined(file)) {
        setError(new Error(BackupErrors.MULTIPLE_FILES));
        return;
      }

      try {
        const reader = new FileReader();
        reader.onload = async e => {
          const exportedWalletDataJSON = JSON.parse(
            e?.target?.result as string,
          );
          const isLegacyWalletExport = !isDefined(exportedWalletDataJSON.salt);
          let salt = isLegacyWalletExport
            ? SharedConstants.LEGACY_EXPORT_WALLET_SALT
            : exportedWalletDataJSON.salt;

          const sharedKey = await createSharedKeyFromKeyword(keyWord, salt);

          const encryptedFile = isLegacyWalletExport
            ? exportedWalletDataJSON
            : exportedWalletDataJSON.encryptedFile;

          const decryptedFile = (await decryptAESGCM256(
            encryptedFile,
            sharedKey,
          )) as FrontendWalletWithMnemonic;

          if (isDefined(decryptedFile)) {
            setBackupWallet(decryptedFile);
          } else {
            setError(new Error(BackupErrors.DECRYPTION_FAILED));
          }
        };

        reader.readAsText(file);
      } catch (cause) {
        setError(new Error(BackupErrors.INVALID_FILE, { cause }));
      }
    },
    [keyWord],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    multiple: false,
    accept: {
      'text/railway': ['.railway'],
    },
  });

  if (!isDefined(authKey)) {
    return <EnterPasswordModal success={setAuthKey} onDismiss={onClose} />;
  }

  const onSuccess = (wallet: FrontendWallet) => {
    setBackupWallet(undefined);
    onClose(wallet, authKey);
  };

  const onSuccessClose = (wallet: FrontendWallet) => onSuccess(wallet);

  const onFail = () => {
    setError(undefined);
    setBackupWallet(undefined);
    setKeyWord('');
  };

  return (
    <GenericModal
      title="Import Wallet from backup file"
      onClose={onClose}
      onBack={onBack}
      isBackChevron={showBackChevron}
    >
      <Text style={{ marginTop: 20, marginBottom: 20 }}>
        Enter file encryption code:
      </Text>
      <Input
        autoComplete="new-password"
        type="password"
        value={keyWord}
        onChange={e => setKeyWord(e.target.value)}
        placeholder="File encryption code"
        autoFocus={true}
      />
      <div {...getRootProps()} className={styles.dropContainer}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the Railway file here ...</p>
        ) : error ? (
          <p className={styles.errorText}>{error.message}</p>
        ) : (
          <div>
            {renderIcon(IconType.Download, 24)}
            <p className={styles.instructionsText}>
              Drag and drop your Railway file here, or click to select it.
            </p>
          </div>
        )}
      </div>
      {backupWallet && (
        <ProcessNewWalletModal
          walletName={backupWallet.name.trim()}
          mnemonic={backupWallet.mnemonic.trim()}
          derivationIndex={
            isDefined(backupWallet.derivationIndex)
              ? Number(backupWallet.derivationIndex)
              : undefined
          }
          onSuccessClose={onSuccessClose}
          onFailClose={onFail}
          defaultProcessingText="Importing wallet..."
          successText="Imported successfully"
          authKey={authKey}
          isViewOnlyWallet={false}
          importedWalletData={backupWallet}
        />
      )}
    </GenericModal>
  );
};
