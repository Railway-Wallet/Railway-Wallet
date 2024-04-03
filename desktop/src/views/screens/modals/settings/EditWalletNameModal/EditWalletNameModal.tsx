import { useState } from 'react';
import { Button } from '@components/Button/Button';
import { Input } from '@components/Input/Input';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { SharedConstants, validateWalletName } from '@react-shared';
import styles from './EditWalletNameModal.module.scss';

type Props = {
  previousWalletName: string;
  onClose: () => void;
  onComplete: (walletName: string) => void;
};

export const EditWalletNameModal = ({
  previousWalletName,
  onComplete,
  onClose,
}: Props) => {
  const [walletName, setWalletName] = useState(previousWalletName);
  const [hasValidEntries, setHasValidEntries] = useState(true);

  const onSubmit = () => {
    if (!hasValidEntries) return;

    onComplete(walletName);
  };

  const validateEntries = (value: string) => {
    setHasValidEntries(validateWalletName(value));
  };

  const updateWalletName = (e: React.BaseSyntheticEvent) => {
    const { value } = e.target;
    setWalletName(value);
    validateEntries(value);
  };

  const hasInputError = walletName.length > 0 && !hasValidEntries;

  return (
    <GenericModal
      onClose={onClose}
      title="Edit wallet name"
      isBackChevron={true}
      accessoryView={
        <Button
          buttonClassName={styles.actionButton}
          onClick={onSubmit}
          disabled={!hasValidEntries}
        >
          Submit
        </Button>
      }
    >
      <Input
        value={walletName}
        onChange={updateWalletName}
        placeholder="Wallet Name"
        maxLength={SharedConstants.MAX_LENGTH_WALLET_NAME}
        hasError={hasInputError}
      />
    </GenericModal>
  );
};
