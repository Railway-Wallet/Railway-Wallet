import { isDefined } from '@railgun-community/shared-models';
import React, { Dispatch, SetStateAction, useState } from 'react';
import { Button } from '@components/Button/Button';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { Text } from '@components/Text/Text';
import { IconType } from '@services/util/icon-service';
import { Input } from '@views/components/Input/Input';
import styles from './SlippageSelectorModal.module.scss';

type Props = {
  isRailgun: boolean;
  onClose: () => void;
  initialSlippagePercentage: number;
  setFinalSlippagePercentage: (
    slippage: number,
  ) => void | Dispatch<SetStateAction<number>>;
};

export const SlippageSelectorModal: React.FC<Props> = ({
  isRailgun,
  onClose,
  initialSlippagePercentage,
  setFinalSlippagePercentage,
}) => {
  const [error, setError] = useState<Optional<Error>>(undefined);
  const [value, setValue] = useState(
    (initialSlippagePercentage * 100).toFixed(1),
  );

  const shouldShowError = isDefined(error);
  const slippageDisclaimer = isRailgun
    ? 'Warning: Low slippage buffers may cause your swap to fail. We recommend 3-5% for private swaps, which increases the likelihood of success. Private transactions incur gas fees and RAILGUN shielding/unshielding fees, even if the underlying swap fails.'
    : 'Warning: Low slippage may cause your swap to fail. We recommend 0.5-1.0% for public swaps, which increases the likelihood of success.';

  const handleOnChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const inputValue = e.target.value;
    setValue(inputValue);

    if (inputValue === '') {
      setError(undefined);
    } else {
      const numValue = parseFloat(inputValue);
      if (isNaN(numValue)) {
        setError(new Error('Please enter a valid number'));
        return;
      } else if (numValue < 0.1) {
        setError(new Error('Slippage must be at least 0.1'));
        return;
      } else if (numValue > 20) {
        setError(new Error('Slippage must not exceed 20'));
        return;
      } else {
        setError(undefined);
      }
    }
  };

  return (
    <GenericModal
      showClose
      shouldCloseOnOverlayClick
      onClose={onClose}
      title="Slippage settings"
      accessoryView={
        <Button
          buttonClassName={styles.accessoryViewButton}
          disabled={shouldShowError}
          onClick={() => {
            setFinalSlippagePercentage(parseFloat(value) / 100);
            onClose();
          }}
          endIcon={IconType.Save}
        >
          Save
        </Button>
      }
    >
      <div>
        <Text className={styles.slippageLabel}>Slippage:</Text>
        <div className={styles.inputWrapper}>
          <Input
            type="number"
            placeholder="5"
            value={value}
            step="0.1"
            onChange={handleOnChange}
            hasError={shouldShowError}
            rightView={<Text className={styles.percentText}>{'%'}</Text>}
            autoCapitalize="none"
          />
          {shouldShowError && (
            <Text className={styles.errorText}>{error.message}</Text>
          )}
        </div>
        <Text className={styles.slippageDisclaimer}>{slippageDisclaimer}</Text>
      </div>
    </GenericModal>
  );
};
