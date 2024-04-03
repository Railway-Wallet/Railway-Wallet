import React, { useEffect, useState } from 'react';
import {
  AlertProps,
  GenericAlert,
} from '@components/alerts/GenericAlert/GenericAlert';
import { Button } from '@components/Button/Button';
import { Text } from '@components/Text/Text';
import { useAppDispatch, WalletStorageService } from '@react-shared';
import { RecoveryWalletsModal } from '@screens/modals/recovery/RecoveryWalletsModal/RecoveryWalletsModal';
import { IconType } from '@services/util/icon-service';
import { createExternalSiteAlert } from '@utils/alerts';
import { Constants } from '@utils/constants';
import styles from './DesktopOnlyScreen.module.scss';

type DesktopOnlyScreenProps = {};

export const DesktopOnlyScreen: React.FC<DesktopOnlyScreenProps> = () => {
  const dispatch = useAppDispatch();
  const [hasWallets, setHasWallets] = useState<boolean>(false);
  const [showRecoveryMode, setShowRecoveryMode] = useState(false);
  const [alert, setAlert] = useState<AlertProps | undefined>(undefined);

  useEffect(() => {
    const checkWallets = async () => {
      const walletStorageService = new WalletStorageService(dispatch);
      const storedWallets = await walletStorageService.fetchStoredWallets();
      if (storedWallets.length > 0) {
        setHasWallets(true);
      }
    };

    void checkWallets();
  }, []);

  const handleDesktopDownload = () => {
    createExternalSiteAlert(
      Constants.ELECTRON_DOWNLOAD_URL,
      setAlert,
      dispatch,
    );
  };

  return (<>
    <div className={styles.textWrapper}>
      <>
        <Text className={styles.errorText}>
          Please use the Railway desktop application.
        </Text>
        <div className={styles.buttonContainer}>
          <Button
            startIcon={IconType.Download}
            children="Download Desktop App"
            onClick={handleDesktopDownload}
            buttonClassName={styles.buttonStyles}
          />
        </div>
        {hasWallets && (
          <div className={styles.buttonContainer}>
            <Button
              startIcon={IconType.Wallet}
              children="View Existing Wallets"
              onClick={() => setShowRecoveryMode(true)}
              buttonClassName={styles.buttonStyles}
            />
          </div>
        )}
      </>
    </div>
    {showRecoveryMode && (
      <>
        {}
        <RecoveryWalletsModal
          onClose={() => {
            setShowRecoveryMode(false);
          }}
        />
      </>
    )}
    {alert && <GenericAlert {...alert} />}
  </>);
};
