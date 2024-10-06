import React from "react";
import { View } from "react-native";
import { RecoveryType } from "@models/RecoveryType";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { AppStatus, styleguide } from "@react-shared";
import { SecurityModal } from "@screens/modals/SecurityModal/SecurityModal";
import { AppErrorScreen } from "@screens/pages/app-error-view/AppErrorScreen/AppErrorScreen";
import { AppReadyView } from "./AppReadyView";
import { AppRecoveryView } from "./AppRecoveryView";
import { navigationRef } from "./Navigation";
import { styles } from "./styles";

type Props = {
  appStatus: AppStatus;
  recoveryType?: RecoveryType;
  showInactiveSecurityLockScreen: boolean;
  error?: Error;
  runInit: () => void;
  needsLockScreenOnLaunch: boolean;
  setRecoveryMode: (recoveryType: RecoveryType) => void;
  resetRecoveryMode: () => void;
};

export const AppView: React.FC<Props> = ({
  appStatus,
  recoveryType,
  showInactiveSecurityLockScreen,
  error,
  runInit,
  needsLockScreenOnLaunch,
  setRecoveryMode,
  resetRecoveryMode,
}) => {
  const isErrorStatus = () => {
    switch (appStatus) {
      case AppStatus.Error:
      case AppStatus.Maintenance:
      case AppStatus.VersionOutdated:
      case AppStatus.Download:
        return true;
      case AppStatus.Loading:
      case AppStatus.Ready:
      case AppStatus.Recovery:
        return false;
    }
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={{
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: styleguide.colors.black,
        },
      }}
    >
      <SecurityModal show={showInactiveSecurityLockScreen} />
      {appStatus === AppStatus.Loading && <View style={styles.appWrapper} />}
      {isErrorStatus() && (
        <AppErrorScreen
          retry={runInit}
          appStatus={appStatus}
          error={error}
          setRecoveryMode={setRecoveryMode}
        />
      )}
      {appStatus === AppStatus.Ready && (
        <AppReadyView needsLockScreenOnLaunch={needsLockScreenOnLaunch} />
      )}
      {appStatus === AppStatus.Recovery && recoveryType && (
        <AppRecoveryView
          resetRecoveryMode={resetRecoveryMode}
          recoveryType={recoveryType}
        />
      )}
    </NavigationContainer>
  );
};
