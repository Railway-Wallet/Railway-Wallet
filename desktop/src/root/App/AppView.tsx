import React, { useMemo } from 'react';
import { AppStatus } from '@react-shared';
import { AppErrorScreen } from '@screens/pages/app-error-view/AppErrorScreen/AppErrorScreen';
import { AppLoadingScreen } from '@screens/pages/app-loading-view/AppLoadingScreen.tsx/AppLoadingScreen';
import { DesktopOnlyScreen } from '@views/screens/pages/app-error-view/DesktopOnlyScreen/DesktopOnlyScreen';
import { AppReadyView } from './AppReadyView';

type Props = {
  appStatus: AppStatus;
  error?: Error;
  runInit: () => void;
  triggerAppStatus: (appStatus: AppStatus, err?: Error) => void;
};

export const AppView: React.FC<Props> = ({
  appStatus,
  error,
  runInit,
  triggerAppStatus,
}) => {
  return useMemo(() => {
    switch (appStatus) {
      case AppStatus.Loading:
        return <AppLoadingScreen />;
      case AppStatus.Error:
      case AppStatus.VersionOutdated:
      case AppStatus.Maintenance:
        return (
          <AppErrorScreen retry={runInit} appStatus={appStatus} error={error} />
        );
      case AppStatus.Download:
        return <DesktopOnlyScreen />;
      case AppStatus.Recovery:
        return null;
      case AppStatus.Ready:
        return <AppReadyView triggerAppStatus={triggerAppStatus} />;
    }
  }, [appStatus, error, runInit, triggerAppStatus]);
};
