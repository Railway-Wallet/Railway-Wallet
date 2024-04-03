import React, { Dispatch, SetStateAction, useState } from 'react';
import { Button } from '@components/Button/Button';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { IconType } from '@services/util/icon-service';
import { SlippageSelector } from '@views/components/SlippageSelector/SlippageSelector';
import styles from './LiquiditySettingsModal.module.scss';

type Props = {
  initialSlippagePercentage: number;
  setFinalSlippagePercentage: (
    slippage: number,
  ) => void | Dispatch<SetStateAction<number>>;
  onClose: () => void;
};

export const LiquiditySettingsModal: React.FC<Props> = ({
  initialSlippagePercentage,
  setFinalSlippagePercentage,
  onClose,
}) => {
  const [slippagePercentage, setSlippagePercentage] = useState(
    initialSlippagePercentage,
  );

  const slippageDisclaimer =
    'Warning: Low slippage buffers may cause this action to fail. We recommend 3-5% which increases the likelihood of success. Private transactions incur gas fees and RAILGUN shielding/unshielding fees, even if the underlying action fails.';

  return (
    <GenericModal
      showClose
      shouldCloseOnOverlayClick
      onClose={onClose}
      title="Liquidity settings"
      accessoryView={
        <Button
          buttonClassName={styles.accessoryViewButton}
          onClick={() => {
            setFinalSlippagePercentage(slippagePercentage);
            onClose();
          }}
          endIcon={IconType.Save}
        >
          Save
        </Button>
      }
    >
      <SlippageSelector
        slippagePercentage={slippagePercentage}
        slippageDisclaimer={slippageDisclaimer}
        setSlippagePercentage={setSlippagePercentage}
      />
    </GenericModal>
  );
};
