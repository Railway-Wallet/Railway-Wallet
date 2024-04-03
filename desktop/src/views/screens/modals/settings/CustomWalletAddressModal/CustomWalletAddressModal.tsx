import { useState } from 'react';
import { Button } from '@components/Button/Button';
import { Input } from '@components/Input/Input';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { validateWalletAddress } from '../../../../../utils/validation';
import styles from './CustomWalletAddressModal.module.scss';

type Props = {
  isRailgun: boolean;
  selectedAddress?: string;
  onClose: (customAddress?: string) => void;
};

export const CustomWalletAddressModal = ({
  onClose,
  isRailgun,
  selectedAddress,
}: Props) => {
  const [address, setAddress] = useState<string>(selectedAddress ?? '');
  const [hasValidEntries, setHasValidEntries] = useState(false);

  const onSubmit = async () => {
    if (!hasValidEntries) {
      return;
    }
    onClose(address);
  };

  const validateEntries = async (address: string) => {
    const isValidAddress = await validateWalletAddress(address, isRailgun);
    setHasValidEntries(isValidAddress);
  };

  const updateAddress = async (e: React.BaseSyntheticEvent) => {
    const { value: address } = e.target;
    setAddress(address);
    await validateEntries(address);
  };

  return (
    <>
      <GenericModal
        onClose={onClose}
        title={isRailgun ? 'Enter private address' : 'Enter public address'}
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
          value={address}
          onChange={updateAddress}
          placeholder="Enter address"
          hasError={address.length > 0 && !hasValidEntries}
        />
      </GenericModal>
    </>
  );
};
