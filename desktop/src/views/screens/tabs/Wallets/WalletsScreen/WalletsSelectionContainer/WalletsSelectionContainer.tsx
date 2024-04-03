import { isDefined } from '@railgun-community/shared-models';
import { useState } from 'react';
import { FullScreenSpinner } from '@components/loading/FullScreenSpinner/FullScreenSpinner';
import { useSetActiveWallet } from '@hooks/useSetActiveWallet';
import { useReduxSelector } from '@react-shared';
import { EnterPasswordModal } from '@screens/modals/EnterPasswordModal/EnterPasswordModal';
import { SelectWalletModal } from '@screens/modals/SelectWalletModal/SelectWalletModal';
import { SettingsWalletsModal } from '@screens/modals/settings/SettingsWalletsModal/SettingsWalletsModal';

type Props = {
  isRailgun: boolean;
  showWalletSelectorModal: boolean;
  setShowWalletSelectorModal: (show: boolean) => void;
};

export const WalletsSelectionContainer = ({
  isRailgun,
  showWalletSelectorModal,
  setShowWalletSelectorModal,
}: Props) => {
  const { wallets } = useReduxSelector('wallets');

  const [showWalletSettings, setShowWalletSettings] = useState(false);

  const activeWallet = wallets.active;

  const {
    setActiveWallet,
    showEnterPassword,
    setShowEnterPassword,
    authKey,
    setAuthKey,
    isLoading,
  } = useSetActiveWallet();

  return (
    <>
      {showEnterPassword && !isDefined(authKey) && (
        <EnterPasswordModal
          success={async authKey => {
            setAuthKey(authKey);
            setShowEnterPassword(false);
          }}
          onDismiss={() => setShowEnterPassword(false)}
          descriptionText="Your password is required to load this encrypted wallet."
        />
      )}
      {isLoading && (
        <FullScreenSpinner text="Loading wallet and scanning transactions..." />
      )}
      {showWalletSettings && (
        <SettingsWalletsModal onClose={() => setShowWalletSettings(false)} />
      )}
      {showWalletSelectorModal && (
        <SelectWalletModal
          title="Select active wallet"
          isRailgunInitial={isRailgun}
          selectedWallet={activeWallet}
          onDismiss={async wallet => {
            setShowWalletSelectorModal(false);
            await setActiveWallet(wallet);
          }}
          onShowWalletSettings={() => setShowWalletSettings(true)}
        />
      )}
    </>
  );
};
