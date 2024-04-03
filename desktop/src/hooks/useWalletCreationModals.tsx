import { WalletCreationType } from '@railgun-community/shared-models';
import { useState } from 'react';
import { FrontendWallet } from '@react-shared';
import { AddViewOnlyWalletModal } from '@screens/modals/AddViewOnlyWalletModal/AddViewOnlyWalletModal';
import { BackupFileModal } from '@screens/modals/BackupFileModal/BackupFileModal';
import { CreatePasswordModal } from '@screens/modals/CreatePasswordModal/CreatePasswordModal';
import { CreateWalletModal } from '@screens/modals/CreateWalletModal/CreateWalletModal';
import { ImportWalletModal } from '@screens/modals/ImportWalletModal/ImportWalletModal';
import { NewWalletSuccessModal } from '@screens/pages/new-wallet-success/NewWalletSuccess';
import { SeedPhraseCallout } from '@screens/pages/seed-phrase-callout/SeedPhraseCallout';
import { ViewingKeyCallout } from '@screens/pages/viewing-key-callout/ViewingKeyCallout';

type NewWalletData = {
  wallet: FrontendWallet;
  authKey: Optional<string>;
};

export const useWalletCreationModals = (showBackChevron = true) => {
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showCreateWallet, setShowCreateWallet] = useState(false);
  const [showImportWallet, setShowImportWallet] = useState(false);
  const [showImportWalletFromBackup, setShowImportWalletFromBackup] =
    useState(false);
  const [showAddViewOnlyWallet, setShowAddViewOnlyWallet] = useState(false);
  const [showSeedPhraseCallout, setShowSeedPhraseCallout] = useState(false);
  const [showViewingKeyCallout, setShowViewingKeyCallout] = useState(false);
  const [showNewWalletSuccess, setShowNewWalletSuccess] = useState(false);
  const [newWalletData, setNewWalletData] = useState<NewWalletData>();
  const [
    walletCreationStepAfterPasswordModal,
    setwalletCreationStepAfterPasswordModal,
  ] = useState<Optional<WalletCreationType>>();
  const [afterPasswordAuthKey, setAfterPasswordAuthKey] =
    useState<Optional<string>>();

  const clearStates = () => {
    setShowCreateWallet(false);
    setShowImportWallet(false);
    setShowImportWalletFromBackup(false);
    setShowAddViewOnlyWallet(false);
    setAfterPasswordAuthKey(undefined);
  };

  const handleCloseCreateWallet = (
    wallet?: FrontendWallet,
    walletCreationType?: WalletCreationType,
    authKey?: string,
  ) => {
    clearStates();
    maybeNewWalletSuccess(wallet, walletCreationType, authKey);
  };

  const maybeNewWalletSuccess = (
    wallet?: FrontendWallet,
    walletCreationType?: WalletCreationType,
    authKey?: string,
  ) => {
    if (!wallet) {
      return;
    }
    setNewWalletData({ wallet, authKey });
    if (!walletCreationType) {
      return;
    }
    switch (walletCreationType) {
      case WalletCreationType.Create:
        setShowSeedPhraseCallout(true);
        break;
      case WalletCreationType.Import:
      case WalletCreationType.ImportFromBackup:
        setShowViewingKeyCallout(true);
        break;
      case WalletCreationType.AddViewOnly:
        setShowNewWalletSuccess(true);
        break;
    }
  };

  const afterPasswordModal = (authKey: string) => {
    setAfterPasswordAuthKey(authKey);
    if (walletCreationStepAfterPasswordModal) {
      switch (walletCreationStepAfterPasswordModal) {
        case WalletCreationType.Import:
          setShowImportWallet(true);
          break;
        case WalletCreationType.ImportFromBackup:
          setShowImportWalletFromBackup(true);
          break;
        case WalletCreationType.Create:
          setShowCreateWallet(true);
          break;
        case WalletCreationType.AddViewOnly:
          setShowAddViewOnlyWallet(true);
          break;
      }
    }
  };

  return {
    showCreatePassword: (
      walletCreationStepAfterPasswordModal: WalletCreationType,
    ) => {
      setShowCreatePassword(true);
      setwalletCreationStepAfterPasswordModal(
        walletCreationStepAfterPasswordModal,
      );
    },
    showCreateWallet: () => setShowCreateWallet(true),
    showImportWallet: () => setShowImportWallet(true),
    showImportWalletFromBackup: () => setShowImportWalletFromBackup(true),
    showAddViewOnlyWallet: () => setShowAddViewOnlyWallet(true),

    createPasswordModal: showCreatePassword && (
      <CreatePasswordModal
        onComplete={(authKey: string) => {
          setShowCreatePassword(false);
          afterPasswordModal(authKey);
        }}
        onClose={() => setShowCreatePassword(false)}
      />
    ),
    createWalletModal: showCreateWallet && (
      <CreateWalletModal
        onClose={(wallet, authKey) => {
          handleCloseCreateWallet(wallet, WalletCreationType.Create, authKey);
        }}
        showBackChevron={showBackChevron}
        onBack={clearStates}
        afterPasswordAuthKey={afterPasswordAuthKey}
      />
    ),
    importWalletModal: showImportWallet && (
      <ImportWalletModal
        onClose={(wallet, authKey) => {
          handleCloseCreateWallet(wallet, WalletCreationType.Import, authKey);
        }}
        onBack={clearStates}
        showBackChevron={showBackChevron}
        afterPasswordAuthKey={afterPasswordAuthKey}
      />
    ),
    importWalletFromBackupModal: showImportWalletFromBackup && (
      <BackupFileModal
        onClose={(wallet, authKey) => {
          handleCloseCreateWallet(
            wallet,
            WalletCreationType.ImportFromBackup,
            authKey,
          );
        }}
        onBack={clearStates}
        showBackChevron={showBackChevron}
        afterPasswordAuthKey={afterPasswordAuthKey}
      />
    ),
    addViewOnlyWalletModal: showAddViewOnlyWallet && (
      <AddViewOnlyWalletModal
        onClose={(wallet, authKey) => {
          handleCloseCreateWallet(
            wallet,
            WalletCreationType.AddViewOnly,
            authKey,
          );
        }}
        onBack={clearStates}
        showBackChevron={showBackChevron}
        afterPasswordAuthKey={afterPasswordAuthKey}
      />
    ),
    seedPhraseCalloutModal: showSeedPhraseCallout && newWalletData && (
      <SeedPhraseCallout
        wallet={newWalletData.wallet}
        newWalletAuthKey={newWalletData.authKey}
        onNext={() => {
          delete newWalletData.authKey;
          setNewWalletData(newWalletData);
          setShowSeedPhraseCallout(false);
          setShowViewingKeyCallout(true);
        }}
      />
    ),
    viewingKeyCalloutModal: showViewingKeyCallout && newWalletData && (
      <ViewingKeyCallout
        wallet={newWalletData.wallet}
        onNext={() => {
          setShowViewingKeyCallout(false);
          setShowNewWalletSuccess(true);
        }}
      />
    ),
    newWalletSuccessModal: showNewWalletSuccess && newWalletData && (
      <NewWalletSuccessModal
        onClose={() => setShowNewWalletSuccess(false)}
        wallet={newWalletData.wallet}
      />
    ),
  };
};
