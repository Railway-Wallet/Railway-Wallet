import { setCookbookDebugger } from '@railgun-community/cookbook';
import { isDefined } from '@railgun-community/shared-models';
import { useRef, useState } from 'react';
import debug from 'debug';
import {
  AppStatus,
  logDev,
  logDevError,
  ReactConfig,
  SharedConstants,
  StorageService,
  useAppDispatch,
} from '@react-shared';
import { WorkerBridgeService } from '@services/bridge/worker-bridge-service';
import { AppStartService } from '@services/core/app-start-service';
import { needsVersionUpdate } from '@services/core/version-service';
import { RemoteConfigService } from '@services/remote-config/remote-config-service';
import { LocalForageWrapper } from '@services/storage/local-forage';
import { Constants } from '@utils/constants';
import { isElectron } from '@utils/user-agent';
import { AppView } from './AppView';

export const AppNavigator = () => {
  const dispatch = useAppDispatch();
  const [appStatus, setAppStatus] = useState(AppStatus.Loading);
  const [error, setError] = useState<Optional<Error>>();

  const hasSeenDesktopWarning = useRef<boolean>(false);
  const hasStarted = useRef<boolean>(false);

  ReactConfig.IS_DEV =
    (Constants.DEV_MODE || Constants.STAG_MODE) &&
    !Constants.OVERRIDE_PROD_TEST_FOR_DEV;

  debug.enable(ReactConfig.IS_DEV ? 'railway:*' : '');

  LocalForageWrapper.init();
  StorageService.init(LocalForageWrapper);

  SharedConstants.SHOW_DEV_LOGS_REDUX = false;
  SharedConstants.USE_COINGECKO_PRICES_FOR_TESTNETS_IN_DEV = false;

  if (ReactConfig.IS_DEV) {
    setCookbookDebugger({ log: logDev, error: logDevError });
  }

  const appStartService = new AppStartService(dispatch);

  const triggerAppStatus = (appStatus: AppStatus, err?: Error) => {
    setAppStatus(appStatus);
    if (isDefined(err)) {
      setError(err);
    }
  };

  const runInit = async () => {
    setError(undefined);
    try {
      WorkerBridgeService.start();

      const params = new URLSearchParams(window.location.search);
      const desktop = params.get('desktop');
      if (
        !ReactConfig.IS_DEV &&
        isDefined(desktop) &&
        !isElectron() &&
        !hasSeenDesktopWarning.current
      ) {
        triggerAppStatus(AppStatus.Download);
        hasSeenDesktopWarning.current = true;
        return;
      }

      const remoteConfigService = new RemoteConfigService(dispatch);
      const remoteConfig = await remoteConfigService.getRemoteConfig();

      if (isDefined(remoteConfig.maintenanceMessage)) {
        triggerAppStatus(
          AppStatus.Maintenance,
          new Error(remoteConfig.maintenanceMessage),
        );
        return;
      }
      if (needsVersionUpdate(remoteConfig)) {
        const { minVersionNumberWeb } = remoteConfig;
        triggerAppStatus(
          AppStatus.VersionOutdated,
          new Error(
            `You are using an outdated version of Railway. Please update your app to version ${minVersionNumberWeb} to continue.`,
          ),
        );
        return;
      }

      await appStartService.runAppStartTasks(remoteConfig);

      triggerAppStatus(AppStatus.Ready);
    } catch (err) {
      logDevError(err);
      triggerAppStatus(AppStatus.Error, err);
    }
  };

  if (!hasStarted.current) {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    runInit();
    hasStarted.current = true;
  }

  return (
    <AppView
      triggerAppStatus={triggerAppStatus}
      appStatus={appStatus}
      runInit={runInit}
      error={error}
    />
  );
};
