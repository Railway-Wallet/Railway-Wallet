import { isDefined } from '@railgun-community/shared-models';
import React, { useEffect, useState } from 'react';
import cn from 'classnames';
import { ListItem } from '@components/ListItem/ListItem';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import {
  loadRailgunWalletByID,
  StoredWallet,
  useAppDispatch,
  WalletStorageService,
} from '@react-shared';
import { EnterPasswordModal } from '@screens/modals/EnterPasswordModal/EnterPasswordModal';
import { ShowSeedPhraseModal } from '@screens/modals/ShowSeedPhraseModal/ShowSeedPhraseModal';
import { ShowShareableViewingKeyModal } from '@screens/modals/ShowShareableViewingKeyModal/ShowShareableViewingKeyModal';
import { startEngine } from '@services/engine/engine';
import { IconType, renderIcon } from '@services/util/icon-service';
import styles from './RecoveryWalletsModal.module.scss';

type Props = {
  onClose: () => void;
};

export const RecoveryWalletsModal: React.FC<Props> = ({ onClose }) => {
  const dispatch = useAppDispatch();
  const [authKey, setAuthKey] = useState<Optional<string>>();
  const [wallets, setWallets] = useState<StoredWallet[]>([]);
  const [selectedWallet, setSelectedWallet] =
    useState<Optional<StoredWallet>>();
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [showShareableViewingKey, setShowShareableViewingKey] = useState(false);

  useEffect(() => {
    const runInit = async () => {
      try {
        await startEngine(dispatch);

        const walletStorageService = new WalletStorageService(dispatch);
        const storedWallets = await walletStorageService.fetchStoredWallets();
        setWallets(storedWallets);
      } catch (error) {
        onClose();
      }
    };

    if (isDefined(authKey)) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      runInit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, authKey]);

  if (!isDefined(authKey)) {
    return <EnterPasswordModal success={setAuthKey} onDismiss={onClose} />;
  }

  const handleSelectWallet = async (wallet: StoredWallet) => {
    setSelectedWallet(wallet);
    if (wallet.isViewOnlyWallet ?? false) {
      await loadRailgunWalletByID(
        authKey,
        wallet.railWalletID,
        true,
      );
      setShowShareableViewingKey(true);
    } else {
      setShowSeedPhrase(true);
    }
  };

  const walletItem = (wallet: StoredWallet, index: number) => {
    const isLastWallet = index === wallets.length - 1;

    return (
      <div key={index}>
        <ListItem
          title={wallet.name}
          className={styles.listItem}
          description={
            wallet.isViewOnlyWallet ?? false
              ? 'Show view-only private key'
              : 'Show seed phrase'
          }
          onPress={() => handleSelectWallet(wallet)}
          descriptionClassName={styles.walletItemDescription}
          left={() => (
            <div className={styles.rightContainer}>
              {renderIcon(
                wallet.isViewOnlyWallet ?? false
                  ? IconType.Eye
                  : IconType.Wallet,
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

  return (<>
    <GenericModal onClose={onClose} title="Wallets">
      <div
        className={cn(
          styles.walletItemContainer,
          styles.recoveryWalletItemContainer,
          'hide-scroll',
        )}
      >
        {wallets.map(walletItem)}
      </div>
    </GenericModal>
    {showSeedPhrase && selectedWallet && (
      <>
        {}
        <ShowSeedPhraseModal
          onClose={() => {
            setShowSeedPhrase(false);
            setSelectedWallet(undefined);
          }}
          wallet={selectedWallet}
        />
      </>
    )}
    {showShareableViewingKey && selectedWallet && (
      <>
        {}
        <ShowShareableViewingKeyModal
          onClose={() => {
            setShowShareableViewingKey(false);
            setSelectedWallet(undefined);
          }}
          wallet={selectedWallet}
        />
      </>
    )}
  </>);
};
