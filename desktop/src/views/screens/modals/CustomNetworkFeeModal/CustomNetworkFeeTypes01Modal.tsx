import {
  TransactionGasDetailsType0,
  TransactionGasDetailsType1,
} from '@railgun-community/shared-models';
import { useState } from 'react';
import { Button } from '@components/Button/Button';
import { Input } from '@components/Input/Input';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { Text } from '@components/Text/Text';
import {
  getDecimalBalanceString,
  logDevError,
  stringEntryToBigInt,
  useReduxSelector,
} from '@react-shared';
import styles from './CustomNetworkFeeModal.module.scss';

interface CustomNetworkFeeType0ModalProps {
  onDismiss: (customGasPrice?: bigint) => void;
  defaultGasDetails: TransactionGasDetailsType0 | TransactionGasDetailsType1;
}

export const CustomNetworkFeeTypes01Modal = ({
  onDismiss,
  defaultGasDetails,
}: CustomNetworkFeeType0ModalProps) => {
  const { network } = useReduxSelector('network');

  const defaultGasPriceString = getDecimalBalanceString(
    defaultGasDetails.gasPrice,
    9,
  );

  const [gasPriceEntry, setGasPriceEntry] = useState(defaultGasPriceString);
  const [hasValidGasPriceEntry, setHasValidGasPriceEntry] = useState(true);

  const decimals = network.current.baseToken.decimals;
  if (decimals !== 18) {
    logDevError(
      new Error(
        'Base token must have 18 decimals to select custom network fee.',
      ),
    );
    return null;
  }

  const onSubmit = () => {
    if (!hasValidGasPriceEntry) {
      return;
    }
    const gasPrice = stringEntryToBigInt(gasPriceEntry, 9);
    onDismiss(gasPrice);
  };

  const validateNumEntry = (entry: string) => {
    try {
      const num = stringEntryToBigInt(entry, decimals);
      return num > 0n;
    } catch (err) {
      return false;
    }
  };

  const updateGasPrice = (e: React.BaseSyntheticEvent) => {
    const { value } = e.target;
    setGasPriceEntry(value);
    setHasValidGasPriceEntry(validateNumEntry(value));
  };

  return (
    <GenericModal
      onClose={onDismiss}
      title="Custom network fee"
      accessoryView={
        <Button
          buttonClassName={styles.actionButton}
          onClick={onSubmit}
          disabled={!hasValidGasPriceEntry}
        >
          Update
        </Button>
      }
    >
      <Text className={styles.listHeader}>Gas price (GWEI)</Text>
      <div className={styles.inputContainer}>
        <Input
          value={gasPriceEntry}
          onChange={updateGasPrice}
          placeholder={defaultGasPriceString}
          hasError={gasPriceEntry.length > 0 && !hasValidGasPriceEntry}
        />
      </div>
      <Text className={styles.disclaimerText}>
        Warning: Custom gas values risk longer wait times for transactions.
      </Text>
    </GenericModal>
  );
};
