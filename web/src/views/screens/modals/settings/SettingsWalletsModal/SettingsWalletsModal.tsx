import { WalletCreationType } from '@railgun-community/shared-models';
import React, { useState } from 'react';
import cn from 'classnames';
import { ListItem } from '@components/ListItem/ListItem';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { Text } from '@components/Text/Text';
import { useWalletCreationModals } from '@hooks/useWalletCreationModals';
import {
  FrontendWallet,
  shortenWalletAddress,
  useReduxSelector,
} from '@react-shared';
import { hasPassword } from '@services/security/password-service';
import { IconType, renderIcon } from '@services/util/icon-service';
import { SettingsWalletInfoModal } from '../SettingsWalletInfoModal/SettingsWalletInfoModal';
import { AddWalletPopover } from './AddWalletPopover/AddWalletPopover';
import styles from './SettingsWalletsModal.module.scss';

type Props = {
  onClose: (closeAllModals: boolean) => void;
};

export const SettingsWalletsModal: React.FC<Props> = ({ onClose }) => {
  const { wallets } = useReduxSelector('wallets');

  const [wallet, setWallet] = useState<Optional<FrontendWallet>>();
  const [showAddWalletOptions, setShowAddWalletOptions] = useState(false);

  const {
    showCreatePassword,
    showCreateWallet,
    showImportWallet,
    showAddViewOnlyWallet,
    showImportWalletFromBackup,
    createPasswordModal,
    createWalletModal,
    importWalletModal,
    addViewOnlyWalletModal,
    seedPhraseCalloutModal,
    viewingKeyCalloutModal,
    newWalletSuccessModal,
    importWalletFromBackupModal,
  } = useWalletCreationModals();

  const handleSelectWallet = (wallet: FrontendWallet) => {
    setWallet(wallet);
  };

  const handleCloseWalletInfo = async (closeAllModals: boolean) => {
    setWallet(undefined);

    if (closeAllModals) {
      onClose(closeAllModals);
    }
  };

  const onOpenAddWallet = () => {
    if (showAddWalletOptions) {
      setShowAddWalletOptions(false);
      return;
    }
    setShowAddWalletOptions(true);
  };

  const handleShowCreateWallet = async () => {
    setShowAddWalletOptions(false);
    if (!(await hasPassword())) {
      showCreatePassword(WalletCreationType.Create);
      return;
    }
    showCreateWallet();
  };

  const handleShowImportWallet = async () => {
    setShowAddWalletOptions(false);
    if (!(await hasPassword())) {
      showCreatePassword(WalletCreationType.Import);
      return;
    }
    showImportWallet();
  };

  const handleShowImportFromBackup = async () => {
    setShowAddWalletOptions(false);
    if (!(await hasPassword())) {
      showCreatePassword(WalletCreationType.ImportFromBackup);
      return;
    }
    showImportWalletFromBackup();
  };

  const handleShowAddViewOnlyWallet = async () => {
    setShowAddWalletOptions(false);
    if (!(await hasPassword())) {
      showCreatePassword(WalletCreationType.AddViewOnly);
      return;
    }
    showAddViewOnlyWallet();
  };

  const walletDescription = (wallet: FrontendWallet) => {
    const railAddressShortened = shortenWalletAddress(wallet.railAddress);
    if (wallet.isViewOnlyWallet) {
      return `Private: ${railAddressShortened}\nView-only wallet`;
    }
    const ethAddressShortened = shortenWalletAddress(wallet.ethAddress);
    return `Private: ${railAddressShortened}\nPublic EVM: ${ethAddressShortened}`;
  };

  const walletItem = (wallet: FrontendWallet, index: number) => {
    const isLastWallet =
      index === wallets.available?.length + wallets.viewOnly?.length - 1;

    return (
      <div key={index}>
        <ListItem
          title={wallet.name}
          titleIcon={wallet.isActive ? IconType.Check : undefined}
          className={styles.listItem}
          description={walletDescription(wallet)}
          onPress={() => handleSelectWallet(wallet)}
          descriptionClassName={styles.walletItemDescription}
          left={() => (
            <div className={styles.rightContainer}>
              {renderIcon(
                wallet.isViewOnlyWallet ? IconType.Eye : IconType.Wallet,
                18,
              )}
            </div>
          )}
          right={() => (
            <div className={styles.rightContainer}>
              {renderIcon(IconType.ChevronRight, 18)}
            </div>
          )}
        />
        {!isLastWallet && <div className={styles.hr} />}
      </div>
    );
  };

  const allWallets: FrontendWallet[] = [
    ...wallets.available,
    ...wallets.viewOnly,
  ];

  return (
    <>
      <GenericModal
        onClose={() => onClose(false)}
        title="Wallets"
        accessoryView={
          <AddWalletPopover
            isOpen={showAddWalletOptions}
            onOpenAddWallet={onOpenAddWallet}
            onCloseAddWallet={() => setShowAddWalletOptions(false)}
            onCreateWallet={handleShowCreateWallet}
            onImportWallet={handleShowImportWallet}
            onAddViewOnlyWallet={handleShowAddViewOnlyWallet}
            onImportFromBackup={handleShowImportFromBackup}
          />
        }
      >
        <div className={cn(styles.settingsItemContainer, 'hide-scroll')}>
          {allWallets.map(walletItem)}
          {!wallets.available.length && (
            <Text className={styles.placeholderText}>
              Press <span className={styles.bold}>Add Wallet +</span> to create
              or import a wallet.
            </Text>
          )}
        </div>
      </GenericModal>
      {wallet && (
        <SettingsWalletInfoModal
          wallet={wallet}
          onClose={handleCloseWalletInfo}
        />
      )}
      {createPasswordModal}
      {createWalletModal}
      {importWalletModal}
      {addViewOnlyWalletModal}
      {seedPhraseCalloutModal}
      {viewingKeyCalloutModal}
      {newWalletSuccessModal}
      {importWalletFromBackupModal}
    </>
  );
};
