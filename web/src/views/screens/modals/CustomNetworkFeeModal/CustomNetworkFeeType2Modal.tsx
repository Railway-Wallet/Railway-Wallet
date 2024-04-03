import {
  isDefined,
  TransactionGasDetailsType2,
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
import { ErrorDetailsModal } from '@screens/modals/ErrorDetailsModal/ErrorDetailsModal';
import styles from './CustomNetworkFeeModal.module.scss';

interface CustomNetworkFeeType2ModalProps {
  onDismiss: (
    customMaxFeePerGas?: bigint,
    customMaxPriorityFeePerGas?: bigint,
  ) => void;
  defaultGasDetails: TransactionGasDetailsType2;
}

export const CustomNetworkFeeType2Modal = ({
  onDismiss,
  defaultGasDetails,
}: CustomNetworkFeeType2ModalProps) => {
  const { network } = useReduxSelector('network');

  const defaultMaxFeeString = getDecimalBalanceString(
    defaultGasDetails.maxFeePerGas,
    9,
  );
  const defaultMaxPriorityFeeString = getDecimalBalanceString(
    defaultGasDetails.maxPriorityFeePerGas,
    9,
  );

  const [errorDetailsOpen, setErrorDetailsOpen] = useState(false);
  const [maxFeeEntry, setMaxFeeEntry] = useState(defaultMaxFeeString);
  const [maxPriorityFeeEntry, setMaxPriorityFeeEntry] = useState(
    defaultMaxPriorityFeeString,
  );
  const [hasValidMaxFeeEntry, setHasValidMaxFeeEntry] = useState(true);
  const [hasValidMaxPriorityFeeEntry, setHasValidMaxPriorityFeeEntry] =
    useState(true);

  const [error, setError] = useState<Optional<Error>>();

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
    if (!hasValidMaxFeeEntry || !hasValidMaxPriorityFeeEntry) {
      return;
    }
    const maxFee = stringEntryToBigInt(maxFeeEntry, 9);
    const maxPriorityFee = stringEntryToBigInt(maxPriorityFeeEntry, 9);

    if (!validateMaxPriorityFeeLessThanMaxFee(maxFee, maxPriorityFee)) {
      setError(new Error('Max base fee must exceed priority fee.'));
      return;
    }

    onDismiss(maxFee, maxPriorityFee);
  };

  const validateNumEntry = (entry: string) => {
    try {
      const num = stringEntryToBigInt(entry, decimals);
      return num > 0n;
    } catch (err) {
      return false;
    }
  };

  const validateMaxPriorityFeeLessThanMaxFee = (
    maxFee: bigint,
    maxPriorityFee: bigint,
  ) => {
    return maxFee >= maxPriorityFee;
  };

  const updateMaxFee = (e: React.BaseSyntheticEvent) => {
    const { value } = e.target;
    setMaxFeeEntry(value);
    setHasValidMaxFeeEntry(validateNumEntry(value));
  };

  const updateMaxPriorityFee = (e: React.BaseSyntheticEvent) => {
    const { value } = e.target;
    setMaxPriorityFeeEntry(value);
    setHasValidMaxPriorityFeeEntry(validateNumEntry(value));
  };

  const showErrorDetails = () => {
    setErrorDetailsOpen(true);
  };
  const hideErrorDetails = () => {
    setErrorDetailsOpen(false);
  };

  return (
    <>
      <GenericModal
        onClose={onDismiss}
        title="Custom network fee"
        accessoryView={
          <Button
            buttonClassName={styles.actionButton}
            onClick={onSubmit}
            disabled={!hasValidMaxFeeEntry || !hasValidMaxPriorityFeeEntry}
          >
            Update
          </Button>
        }
      >
        <Text className={styles.listHeader}>Max base fee (GWEI)</Text>
        <div className={styles.inputContainer}>
          <Input
            value={maxFeeEntry}
            onChange={updateMaxFee}
            placeholder={defaultMaxFeeString}
            hasError={maxFeeEntry.length > 0 && !hasValidMaxFeeEntry}
          />
        </div>
        <Text className={styles.listHeader}>Priority fee (GWEI)</Text>
        <div className={styles.inputContainer}>
          <Input
            value={maxPriorityFeeEntry}
            onChange={updateMaxPriorityFee}
            placeholder={defaultMaxPriorityFeeString}
            hasError={
              maxPriorityFeeEntry.length > 0 && !hasValidMaxPriorityFeeEntry
            }
          />
        </div>
        {isDefined(error) && (
          <Text className={styles.errorText}>
            {error.message}{' '}
            <Text className={styles.errorShowMore} onClick={showErrorDetails}>
              (show more)
            </Text>
          </Text>
        )}
        <Text className={styles.disclaimerText}>
          Warning: Custom gas values risk longer wait times for transactions.
        </Text>
      </GenericModal>
      {errorDetailsOpen && isDefined(error) && (
        <ErrorDetailsModal error={error} onDismiss={hideErrorDetails} />
      )}
    </>
  );
};
