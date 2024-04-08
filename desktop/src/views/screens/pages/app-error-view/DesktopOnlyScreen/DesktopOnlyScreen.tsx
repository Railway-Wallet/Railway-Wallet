import { isDefined } from '@railgun-community/shared-models';
import React, { useEffect, useState } from 'react';
import {
  AlertProps,
  GenericAlert,
} from '@components/alerts/GenericAlert/GenericAlert';
import { Button } from '@components/Button/Button';
import { Text } from '@components/Text/Text';
import {
  logDevError,
  useAppDispatch,
  WalletStorageService,
} from '@react-shared';
import { RecoveryWalletsModal } from '@screens/modals/recovery/RecoveryWalletsModal/RecoveryWalletsModal';
import { getOSType,OSType } from '@services/core/os-service';
import {
  DesktopBuild,
  fetchDesktopDownloadBuilds,
} from '@services/core/version-service';
import { IconType } from '@services/util/icon-service';
import { createExternalSiteAlert } from '@utils/alerts';
import { Constants } from '@utils/constants';
import styles from './DesktopOnlyScreen.module.scss';

type DesktopDownloadButton = {
  title: string;
  downloadUrl: string;
};

type DesktopOnlyScreenProps = {
  continueToWebApp: () => void;
};

export const DesktopOnlyScreen: React.FC<DesktopOnlyScreenProps> = ({
  continueToWebApp,
}) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState<boolean>(true);
  const [hasWallets, setHasWallets] = useState<boolean>(false);
  const [downloadButtons, setDownloadButtons] = useState<
    DesktopDownloadButton[]
  >([]);
  const [showRecoveryMode, setShowRecoveryMode] = useState(false);
  const [alert, setAlert] = useState<AlertProps | undefined>(undefined);

  useEffect(() => {
    const init = async () => {
      const osType = getOSType();

      try {
        const desktopBuilds = await fetchDesktopDownloadBuilds();

        if (osType === OSType.MacGeneric) {
          const siliconUrl = findDownloadUrlForOS(
            OSType.MacSilicon,
            desktopBuilds,
          );
          const intelUrl = findDownloadUrlForOS(OSType.MacIntel, desktopBuilds);

          if (isDefined(siliconUrl) && isDefined(intelUrl)) {
            setDownloadButtons([
              { title: 'Download for Apple Silicon', downloadUrl: siliconUrl },
              { title: 'Download for Intel', downloadUrl: intelUrl },
            ]);
          }
        } else if (osType === OSType.MacSilicon) {
          const siliconUrl = findDownloadUrlForOS(
            OSType.MacSilicon,
            desktopBuilds,
          );
          if (isDefined(siliconUrl)) {
            setDownloadButtons([
              { title: 'Download for Mac', downloadUrl: siliconUrl },
            ]);
          }
        } else if (osType === OSType.MacIntel) {
          const intelUrl = findDownloadUrlForOS(OSType.MacIntel, desktopBuilds);
          if (isDefined(intelUrl)) {
            setDownloadButtons([
              { title: 'Download for Mac', downloadUrl: intelUrl },
            ]);
          }
        } else if (osType === OSType.Windows) {
          const windowsUrl = findDownloadUrlForOS(
            OSType.Windows,
            desktopBuilds,
          );
          if (isDefined(windowsUrl)) {
            setDownloadButtons([
              { title: 'Download for Windows', downloadUrl: windowsUrl },
            ]);
          }
        } else if (osType === OSType.LinuxSnap) {
          const snapUrl = findDownloadUrlForOS(OSType.LinuxSnap, desktopBuilds);
          if (isDefined(snapUrl)) {
            setDownloadButtons([
              { title: 'Download for Linux', downloadUrl: snapUrl },
            ]);
          }
        } else if (osType === OSType.LinuxAppImage) {
          const appImageUrl = findDownloadUrlForOS(
            OSType.LinuxAppImage,
            desktopBuilds,
          );
          if (isDefined(appImageUrl)) {
            setDownloadButtons([
              { title: 'Download for Linux', downloadUrl: appImageUrl },
            ]);
          }
        } else if (osType === OSType.LinuxDebian) {
          const debUrl = findDownloadUrlForOS(
            OSType.LinuxDebian,
            desktopBuilds,
          );
          if (isDefined(debUrl)) {
            setDownloadButtons([
              { title: 'Download for Linux', downloadUrl: debUrl },
            ]);
          }
        } else if (osType === OSType.LinuxPacman) {
          const pacmanUrl = findDownloadUrlForOS(
            OSType.LinuxPacman,
            desktopBuilds,
          );
          if (isDefined(pacmanUrl)) {
            setDownloadButtons([
              { title: 'Download for Linux', downloadUrl: pacmanUrl },
            ]);
          }
        } else if (osType === OSType.LinuxRPM) {
          const rpmUrl = findDownloadUrlForOS(OSType.LinuxRPM, desktopBuilds);
          if (isDefined(rpmUrl)) {
            setDownloadButtons([
              { title: 'Download for Linux', downloadUrl: rpmUrl },
            ]);
          }
        } else if (osType === OSType.LinuxGeneric) {
          const snapUrl = findDownloadUrlForOS(OSType.LinuxSnap, desktopBuilds);
          const appImageUrl = findDownloadUrlForOS(
            OSType.LinuxAppImage,
            desktopBuilds,
          );
          const debUrl = findDownloadUrlForOS(
            OSType.LinuxDebian,
            desktopBuilds,
          );
          const pacmanUrl = findDownloadUrlForOS(
            OSType.LinuxPacman,
            desktopBuilds,
          );
          const rpmUrl = findDownloadUrlForOS(OSType.LinuxRPM, desktopBuilds);

          if (
            isDefined(snapUrl) &&
            isDefined(appImageUrl) &&
            isDefined(debUrl) &&
            isDefined(pacmanUrl) &&
            isDefined(rpmUrl)
          ) {
            setDownloadButtons([
              {
                title: 'Download for Linux (AppImage)',
                downloadUrl: appImageUrl,
              },
              { title: 'Download for Linux (Debian)', downloadUrl: debUrl },
              { title: 'Download for Linux (Snap)', downloadUrl: snapUrl },
              {
                title: 'Download for Linux (Arch Package)',
                downloadUrl: pacmanUrl,
              },
              {
                title: 'Download for Linux (RPM Package)',
                downloadUrl: rpmUrl,
              },
            ]);
          }
        }
      } catch (error) {
        logDevError('Error fetching desktop builds', error);
      }

      const walletStorageService = new WalletStorageService(dispatch);
      const storedWallets = await walletStorageService.fetchStoredWallets();
      if (storedWallets.length > 0) {
        setHasWallets(true);
      }

      setLoading(false);
    };

    void init();
  }, []);

  const findDownloadUrlForOS = (
    osType: OSType,
    desktopBuilds: DesktopBuild[],
  ): Optional<string> => {
    let desktopBuild: Optional<DesktopBuild>;

    switch (osType) {
      case OSType.MacGeneric:
        break;
      case OSType.MacSilicon:
        desktopBuild = desktopBuilds.find(build =>
          build.name.includes('mac-arm64'),
        );
        break;
      case OSType.MacIntel:
        desktopBuild = desktopBuilds.find(build =>
          build.name.includes('mac-x64'),
        );
        break;
      case OSType.Windows:
        desktopBuild = desktopBuilds.find(build => build.name.includes('.exe'));
        break;
      case OSType.LinuxGeneric:
        break;
      case OSType.LinuxSnap:
        desktopBuild = desktopBuilds.find(build =>
          build.name.includes('.snap'),
        );
        break;
      case OSType.LinuxAppImage:
        desktopBuild = desktopBuilds.find(build =>
          build.name.includes('.AppImage'),
        );
        break;
      case OSType.LinuxDebian:
        desktopBuild = desktopBuilds.find(build => build.name.includes('.deb'));
        break;
      case OSType.LinuxPacman:
        desktopBuild = desktopBuilds.find(build =>
          build.name.includes('.pacman'),
        );
        break;
      case OSType.LinuxRPM:
        desktopBuild = desktopBuilds.find(build => build.name.includes('.rpm'));
        break;
    }

    return desktopBuild?.url;
  };

  const handleDesktopDownloadLink = () => {
    createExternalSiteAlert(
      Constants.ELECTRON_DOWNLOAD_URL,
      setAlert,
      dispatch,
    );
  };

  const handleDesktopDownload = async (downloadUrl: string) => {
    createExternalSiteAlert(downloadUrl, setAlert, dispatch);
  };

  const renderDirectDownloadButtons = () => {
    if (!isDefined(downloadButtons) || downloadButtons.length === 0) {
      return;
    }

    return downloadButtons.map((buttonData, index) => (
      <div key={index} className={styles.buttonContainer}>
        <Button
          startIcon={IconType.Download}
          children={buttonData.title}
          onClick={() => handleDesktopDownload(buttonData.downloadUrl)}
          buttonClassName={styles.buttonStyles}
        />
      </div>
    ));
  };

  return (<>
    <div className={styles.textWrapper}>
      <>
        {loading && <Text className={styles.errorText}>Loading...</Text>}
        {!loading && (
          <>
            <Text className={styles.errorText}>
              Railway Wallet strives for top tier security and data protection
              for users. All Railway Wallet applications have undergone
              extensive auditing by Trail of Bits and Zokyo and the source
              code is now available at{' '}
              <a href="https://railway.xyz" target="_blank" rel="noreferrer">
                railway.xyz
              </a>
              . No vulnerabilities have been found.
            </Text>
            <Text className={styles.errorText}>
              However, because native applications are inherently more secure,
              software updates will now focus on the desktop and mobile device
              applications. We encourage you to download one of these apps to
              continue using Railway Wallet. The web application will be
              deprecated soon.
              {hasWallets
                ? ' You can view your existing wallets to import to the device of your choice.'
                : ''}
            </Text>
            {renderDirectDownloadButtons()}
            <div className={styles.buttonContainer}>
              <Button
                startIcon={IconType.Search}
                children="View all downloads"
                onClick={handleDesktopDownloadLink}
                buttonClassName={styles.buttonStyles}
              />
            </div>
            {hasWallets && (
              <div className={styles.buttonContainer}>
                <Button
                  startIcon={IconType.Wallet}
                  children="View existing wallets"
                  onClick={() => setShowRecoveryMode(true)}
                  buttonClassName={styles.buttonStyles}
                />
              </div>
            )}
            <div className={styles.buttonContainer}>
              <Button
                startIcon={IconType.Privacy}
                children="Continue to web app"
                onClick={continueToWebApp}
                buttonClassName={styles.buttonStyles}
              />
            </div>
          </>
        )}
      </>
    </div>
    {!loading && showRecoveryMode && (
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
