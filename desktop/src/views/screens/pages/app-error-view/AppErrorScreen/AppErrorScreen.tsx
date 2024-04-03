import { isDefined } from '@railgun-community/shared-models';
import React, { useEffect, useState } from 'react';
import {
  AlertProps,
  GenericAlert,
} from '@components/alerts/GenericAlert/GenericAlert';
import { Button } from '@components/Button/Button';
import { Text } from '@components/Text/Text';
import {
  AppStatus,
  getSupportedNetworks,
  useAppDispatch,
  useReduxSelector,
  WalletStorageService,
} from '@react-shared';
import { RecoveryWalletsModal } from '@screens/modals/recovery/RecoveryWalletsModal/RecoveryWalletsModal';
import { SettingsNetworksModal } from '@screens/modals/settings/SettingsNetworksModal/SettingsNetworksModal';
import { IconType } from '@services/util/icon-service';
import { createExternalSiteAlert } from '@utils/alerts';
import { Constants } from '@utils/constants';
import { isElectron } from '@utils/user-agent';
import styles from './AppErrorScreen.module.scss';

type AppErrorScreenProps = {
  error?: Error;
  retry: () => void;
  appStatus: AppStatus;
};

export const AppErrorScreen: React.FC<AppErrorScreenProps> = ({
  error,
  appStatus,
  retry,
}) => {
  const dispatch = useAppDispatch();
  const { remoteConfig } = useReduxSelector('remoteConfig');
  const [hasWallets, setHasWallets] = useState<boolean>(false);
  const [hasNetworks, setHasNetworks] = useState<boolean>(false);
  const [showRecoveryMode, setShowRecoveryMode] = useState(false);
  const [alert, setAlert] = useState<AlertProps | undefined>(undefined);
  const [showNetworkSettings, setShowNetworkSettings] = useState(false);

  const appVersionNumber = process.env.REACT_APP_VERSION;
  const currentConfig = remoteConfig.current;

  useEffect(() => {
    const checkWallets = async () => {
      const walletStorageService = new WalletStorageService(dispatch);
      const storedWallets = await walletStorageService.fetchStoredWallets();
      if (storedWallets.length > 0) {
        setHasWallets(true);
      }
    };

    const checkNetworks = () => {
      const networksExist = getSupportedNetworks().length > 0;
      setHasNetworks(networksExist && isDefined(currentConfig));
    };

    if (isDefined(error)) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      checkWallets();
      checkNetworks();
    }
  }, [dispatch, error, currentConfig]);

  const handleUpdateVersion = () => {
    createExternalSiteAlert(
      Constants.ELECTRON_DOWNLOAD_URL,
      setAlert,
      dispatch,
    );
  };

  const showElectronUpdate =
    appStatus === AppStatus.VersionOutdated && isElectron();

  return (<>
    <div className={styles.textWrapper}>
      {!isDefined(error) && (
        <Text className={styles.loadingText}>Launching Railway...</Text>
      )}
      {isDefined(error) && (
        <>
          <Text className={styles.errorText}>{error.message}</Text>
          <div className={styles.buttonContainer}>
            {showElectronUpdate && (
              <Button
                startIcon={IconType.Download}
                children="Download newest version"
                onClick={handleUpdateVersion}
                buttonClassName={styles.buttonStyles}
              />
            )}
            {appStatus === AppStatus.Maintenance && (
              <Button
                startIcon={IconType.Refresh}
                children="Reload"
                onClick={retry}
                buttonClassName={styles.buttonStyles}
              />
            )}
            {appStatus === AppStatus.Error && (
              <Button
                startIcon={IconType.Refresh}
                children="Retry"
                onClick={retry}
                buttonClassName={styles.buttonStyles}
              />
            )}
          </div>
          {hasWallets && (
            <div className={styles.recoveryButtonContainer}>
              <Button
                startIcon={IconType.Wallet}
                children="View Wallets"
                onClick={() => setShowRecoveryMode(true)}
                buttonClassName={styles.buttonStyles}
              />
            </div>
          )}
          {hasNetworks && (
            <div className={styles.recoveryButtonContainer}>
              <Button
                startIcon={IconType.Settings}
                children="View Networks"
                onClick={() => setShowNetworkSettings(true)}
                buttonClassName={styles.buttonStyles}
              />
            </div>
          )}
        </>
      )}
    </div>
    {isDefined(error) && (
      <Text className={styles.footerText}>
        Railway • Version {appVersionNumber}
      </Text>
    )}
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
    {showNetworkSettings && (
      <SettingsNetworksModal
        onClose={() => {
          setShowNetworkSettings(false);
        }}
      />
    )}
    {alert && <GenericAlert {...alert} />}
  </>);
};
