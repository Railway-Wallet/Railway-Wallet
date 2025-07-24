import React, { useState } from 'react';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { TextButton } from '@components/TextButton/TextButton';
import { FrontendWallet } from '@react-shared';
import { SettingsWalletsModal } from '@screens/modals/settings/SettingsWalletsModal/SettingsWalletsModal';
import { IconType } from '../../../../services/util/icon-service';
import { Button } from '../../../components/Button/Button';
import { SelectWalletList } from './SelectWalletList/SelectWalletList';
import styles from './SelectWalletModal.module.scss';

type Props = {
  title: string;
  isRailgunInitial: boolean;
  onDismiss: (
    wallet?: FrontendWallet,
    address?: string,
    removeSelectedWallet?: boolean,
  ) => void;
  onShowWalletSettings?: () => void;
  selectedWallet?: FrontendWallet;
  selectedAddress?: string;
  showBroadcasterOption?: boolean;
  showNoDestinationWalletOption?: boolean;
  showCustomAddressDestinationOption?: boolean;
  availableWalletsOnly?: boolean;
  showSavedAddresses?: boolean;
  showPublicPrivateToggle?: boolean;
};

export const SelectWalletModal: React.FC<Props> = ({
  title,
  isRailgunInitial,
  onDismiss,
  onShowWalletSettings,
  selectedWallet,
  selectedAddress,
  showBroadcasterOption,
  showNoDestinationWalletOption,
  showCustomAddressDestinationOption,
  availableWalletsOnly,
  showSavedAddresses,
  showPublicPrivateToggle = false,
}) => {
  const [isRailgun, setIsRailgun] = useState(isRailgunInitial);

  const [walletSettingsOpen, setWalletSettingsOpen] = useState(false);

  return (
    <>
      {walletSettingsOpen && (
        <SettingsWalletsModal onClose={() => setWalletSettingsOpen(false)} />
      )}
      <GenericModal
        onClose={() => onDismiss()}
        title={title}
        accessoryView={
          showPublicPrivateToggle ? (
            <Button
              buttonClassName={styles.privatePublicButton}
              endIcon={isRailgun ? IconType.Shield : IconType.Public}
              alt="switch private or public"
              onClick={() => setIsRailgun(!isRailgun)}
            >
              {isRailgun ? 'Private' : 'Public'}
            </Button>
          ) : undefined
        }
      >
        <div className={styles.wrapper}>
          <SelectWalletList
            isRailgun={isRailgun}
            selectedWallet={selectedWallet}
            selectedAddress={selectedAddress}
            onSelect={onDismiss}
            showBroadcasterOption={showBroadcasterOption}
            showNoDestinationWalletOption={showNoDestinationWalletOption}
            showCustomAddressDestinationOption={
              showCustomAddressDestinationOption
            }
            availableWalletsOnly={availableWalletsOnly}
            showSavedAddresses={showSavedAddresses}
          />
          {onShowWalletSettings && (
            <div className={styles.footer}>
              <div className={styles.footerContent}>
                {}
                <div className={styles.footerTextButtonWrapper}>
                  <TextButton
                    textClassName={styles.footerTextButton}
                    text="Open wallet settings"
                    action={onShowWalletSettings}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </GenericModal>
    </>
  );
};
