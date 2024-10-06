import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { ToastWrapperView } from "@components/views/ToastWrapperView/ToastWrapperView";
import { RecoveryType } from "@models/RecoveryType";
import { useAppDispatch, useReduxSelector } from "@react-shared";
import { AppStartService } from "@services/core/app-start-service";
import { RecoveryNavigationStack } from "./RecoveryNavigation";
import { styles } from "./styles";

type Props = {
  recoveryType: RecoveryType;
  resetRecoveryMode: () => void;
};

export const AppRecoveryView: React.FC<Props> = ({
  recoveryType,
  resetRecoveryMode,
}) => {
  const { backGestures } = useReduxSelector("backGestures");

  const [needsLockScreenOnLaunch, setNeedsLockScreenOnLaunch] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);

  const dispatch = useAppDispatch();

  const recoveryMode = true;
  const appStartService = new AppStartService(dispatch, recoveryMode);

  const runInit = async () => {
    await appStartService.runAppStartTasks();
    switch (recoveryType) {
      case RecoveryType.Networks:
        break;
      case RecoveryType.Wallets:
        setNeedsLockScreenOnLaunch(appStartService.needsLockScreenOnLaunch);
        break;
    }
    setRecoveryReady(true);
  };

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    runInit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.appWrapper}>
      {recoveryReady && (
        <RecoveryNavigationStack
          showLockedScreen={needsLockScreenOnLaunch}
          showNetworksScreen={recoveryType === RecoveryType.Networks}
          backGesturesEnabled={backGestures.enabled}
          resetRecoveryMode={resetRecoveryMode}
        />
      )}
      <ToastWrapperView />
    </View>
  );
};
