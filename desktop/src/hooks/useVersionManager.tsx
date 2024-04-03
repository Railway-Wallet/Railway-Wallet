import { useEffect, useState } from 'react';
import { AppStatus, useAppDispatch } from '@react-shared';
import {
  needsVersionUpdate,
  newVersionAvailable,
} from '@services/core/version-service';
import { RemoteConfigService } from '@services/remote-config/remote-config-service';
import {
  createExternalSiteAlert,
  ExternalSiteAlertMessages,
} from '@utils/alerts';
import { Constants } from '@utils/constants';
import { ElectronRendererWindow, isElectron } from '@utils/user-agent';
import {
  AlertProps,
  GenericAlert,
} from '@views/components/alerts/GenericAlert/GenericAlert';

export const useVersionManager = (
  triggerAppStatus: (appStatus: AppStatus, err?: Error) => void,
) => {
  const isDesktop = isElectron();
  const dispatch = useAppDispatch();
  const [lastCheck, setLastCheck] = useState<Date>();
  const [alert, setAlert] = useState<AlertProps | undefined>(undefined);
  const [externalSiteAlert, setExternalSiteAlert] = useState<
    AlertProps | undefined
  >(undefined);

  const showNewVersionAvailableAlert = () => {
    setAlert({
      title: 'New Railway version available',
      submitTitle: isDesktop ? 'Download' : 'Refresh',
      message: `There's a new version available. ${
        isDesktop
          ? 'You may update from the downloads page.'
          : 'Please refresh to update.'
      }`,
      onClose: () => setAlert(undefined),
      onSubmit: () => {
        if (isDesktop) {
          createExternalSiteAlert(
            Constants.ELECTRON_DOWNLOAD_URL,
            setExternalSiteAlert,
            dispatch,
            ExternalSiteAlertMessages.OPEN_EXTERNAL_TRANSACTION,
          );
        } else {
          window.location.reload();
        }
        setAlert(undefined);
      },
    });
  };

  const handleDailyCheck = async () => {
    if (lastCheck) {
      const currentTime = new Date();
      const timeDifference = Math.abs(
        lastCheck.getTime() - currentTime.getTime(),
      );
      const hoursDifference = timeDifference / (1000 * 60 * 60);

      if (hoursDifference > 24) {
        const isNewVersionAvailable = await newVersionAvailable();

        if (isNewVersionAvailable) {
          setLastCheck(currentTime);
          showNewVersionAvailableAlert();
        }

        const remoteConfigService = new RemoteConfigService(dispatch);
        const remoteConfig = await remoteConfigService.getRemoteConfig();

        if (needsVersionUpdate(remoteConfig)) {
          const { minVersionNumberWeb } = remoteConfig;
          triggerAppStatus(
            AppStatus.VersionOutdated,
            new Error(
              `You are using an outdated version of Railway. Please update your app to version ${minVersionNumberWeb} to continue.`,
            ),
          );
        }
      }
    }
  };

  useEffect(() => {
    const checkVersion = async () => {
      const isNewVersionAvailable = await newVersionAvailable();

      if (isNewVersionAvailable) {
        setLastCheck(new Date());
        showNewVersionAvailableAlert();
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    checkVersion();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isDesktop) {
      const renderer = window as unknown as ElectronRendererWindow;
      renderer.electronBridge.addFocusListener(handleDailyCheck);

      return () => {
        renderer.electronBridge.removeFocusListener(handleDailyCheck);
      };
    } else {
      const handleVisibilityChangeEvent = async () => {
        if (document.visibilityState === 'visible') {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          handleDailyCheck();
        }
      };

      document.addEventListener(
        'visibilitychange',
        handleVisibilityChangeEvent,
      );

      return () => {
        document.removeEventListener(
          'visibilitychange',
          handleVisibilityChangeEvent,
        );
      };
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    VersionManagerAlert: () => (
      <>
        {alert ? <GenericAlert {...alert} /> : null}
        {externalSiteAlert ? <GenericAlert {...externalSiteAlert} /> : null}
      </>
    ),
    lastCheck,
  };
};
