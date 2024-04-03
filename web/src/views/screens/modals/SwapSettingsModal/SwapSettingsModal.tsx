import React, { useState } from 'react';
import { Button } from '@components/Button/Button';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { IconType } from '@services/util/icon-service';
import { SlippageSelector } from '@views/components/SlippageSelector/SlippageSelector';
import styles from './SwapSettingsModal.module.scss';

export type SwapSettings = {
  slippagePercentage: number;
};

type Props = {
  isRailgun: boolean;
  currentSettings: SwapSettings;
  onDismiss: (settings?: SwapSettings) => void;
};

export const SwapSettingsModal: React.FC<Props> = ({
  isRailgun,
  currentSettings,
  onDismiss,
}) => {
  const [slippagePercentage, setSlippagePercentage] = useState(
    currentSettings.slippagePercentage,
  );

  const slippageDisclaimer = isRailgun
    ? 'Warning: Low slippage buffers may cause your swap to fail. We recommend 3-5% for private swaps, which increases the likelihood of success. Private transactions incur gas fees and RAILGUN shielding/unshielding fees, even if the underlying swap fails.'
    : 'Warning: Low slippage may cause your swap to fail. We recommend 0.5-1.0% for public swaps, which increases the likelihood of success.';

  return (
    <GenericModal
      shouldCloseOnOverlayClick={true}
      onClose={() => onDismiss(undefined)}
      title="Swap settings"
      showClose={true}
      accessoryView={
        <Button
          buttonClassName={styles.accessoryViewButton}
          onClick={() => onDismiss({ slippagePercentage })}
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
