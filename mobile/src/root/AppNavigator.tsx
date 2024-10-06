import { isDefined } from "@railgun-community/shared-models";
import React, { useEffect, useState } from "react";
import SplashScreen from "react-native-splash-screen";
import debug from "debug";
import { useInactiveSecurityLockScreen } from "@hooks/security/useInactiveSecurityLockScreen";
import { RecoveryType } from "@models/RecoveryType";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AppStatus,
  logDevError,
  ReactConfig,
  SharedConstants,
  StorageService,
  useAppDispatch,
} from "@react-shared";
import { NodeBridgeService } from "@services/bridge/node-bridge-service";
import { AppStartService } from "@services/core/app-start-service";
import {
  minVersionForPlatform,
  needsVersionUpdate,
} from "@services/core/version-service";
import { RemoteConfigService } from "@services/remote-config/remote-config-service";
import { isAndroid } from "@services/util/platform-os-service";
import { AppView } from "./AppView";

export const AppNavigator = () => {
  const dispatch = useAppDispatch();
  const [appStatus, setAppStatus] = useState(AppStatus.Loading);
  const [recoveryType, setRecoveryType] =
    useState<Optional<RecoveryType>>(undefined);
  const [needsLockScreenOnLaunch, setNeedsLockScreenOnLaunch] = useState(false);
  const [error, setError] = useState<Optional<Error>>();

  ReactConfig.IS_DEV = __DEV__;
  ReactConfig.ENABLE_V3 = ReactConfig.IS_DEV;

  ReactConfig.IS_ANDROID = isAndroid();

  debug.enable(ReactConfig.IS_DEV ? "railway:*" : "");

  ReactConfig.SHOULD_DISABLE_USER_AGENT = true;

  StorageService.init(AsyncStorage);

  SharedConstants.SHOW_DEV_LOGS_REDUX = true;

  ReactConfig.ENABLE_NFTS = false;

  const appStartService = new AppStartService(dispatch);

  const triggerAppStatus = (appStatus: AppStatus, err?: Error) => {
    setAppStatus(appStatus);
    if (isDefined(err)) {
      setError(err);
    }
    SplashScreen.hide();
  };

  const runInit = async () => {
    setError(undefined);
    try {
      NodeBridgeService.start();
      const remoteConfigService = new RemoteConfigService(dispatch);
      const remoteConfig = await remoteConfigService.getRemoteConfig();

      if (isDefined(remoteConfig.maintenanceMessage)) {
        triggerAppStatus(
          AppStatus.Maintenance,
          new Error(remoteConfig.maintenanceMessage)
        );
        return;
      }
      if (needsVersionUpdate(remoteConfig)) {
        triggerAppStatus(
          AppStatus.VersionOutdated,
          new Error(
            `You are using an outdated version of Railway. Please update your app to v${minVersionForPlatform(
              remoteConfig
            )} to continue.`
          )
        );
        return;
      }

      await appStartService.runAppStartTasks(remoteConfig);
      setNeedsLockScreenOnLaunch(appStartService.needsLockScreenOnLaunch);
      triggerAppStatus(AppStatus.Ready);
    } catch (err) {
      logDevError(err);
      triggerAppStatus(AppStatus.Error, err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    runInit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { showInactiveSecurityLockScreen } = useInactiveSecurityLockScreen();

  return (
    <AppView
      appStatus={appStatus}
      recoveryType={recoveryType}
      showInactiveSecurityLockScreen={showInactiveSecurityLockScreen}
      runInit={runInit}
      error={error}
      needsLockScreenOnLaunch={needsLockScreenOnLaunch}
      setRecoveryMode={(recoveryType: RecoveryType) => {
        setRecoveryType(recoveryType);
        setAppStatus(AppStatus.Recovery);
      }}
      resetRecoveryMode={() => {
        setRecoveryType(undefined);
        setAppStatus(AppStatus.Error);
      }}
    />
  );
};
