import React from 'react';
import { Button } from '@components/Button/Button';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { Text } from '@components/Text/Text';
import styles from './DeleteWalletModal.module.scss';

type Props = {
  onRequestClose: (option?: string) => void;
  handleDeleteWallet: () => void;
};

export const DeleteWalletModal: React.FC<Props> = ({
  handleDeleteWallet,
  onRequestClose,
}) => {
  const warningText =
    'This action is permanent. Please document your seed phrase in order to recover your funds.';

  return (
    <>
      <GenericModal onClose={onRequestClose} title="Delete this wallet?">
        <Text className={styles.warningText}>{warningText}</Text>
        <div className={styles.buttonContainer}>
          <Button
            onClick={() => {
              onRequestClose();
            }}
            textClassName={styles.buttonText}
            buttonClassName={styles.cancelButton}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteWallet}
            textClassName={styles.dangerText}
            buttonClassName={styles.deleteButton}
          >
            Delete Wallet
          </Button>
        </div>
      </GenericModal>
    </>
  );
};
