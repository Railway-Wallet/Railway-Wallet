import React, { useState } from "react";
import { View } from "react-native";
import { ToastWrapperView } from "@components/views/ToastWrapperView/ToastWrapperView";
import {
  refreshRailgunBalances,
  useAppBalancePriceUpdater,
  useReduxSelector,
  useVaultFetch,
  useVaultRedeemTokenPriceUpdater,
  useWakuBroadcasterChainUpdater,
} from "@react-shared";
import {
  ErrorDetailsModal,
  ErrorDetailsModalProps,
} from "@screens/modals/ErrorDetailsModal/ErrorDetailsModal";
import { ShieldPOICountdownModal } from "@views/screens/modals/ShieldPOICountdownModal/ShieldPOICountdownModal";
import { useInactiveProviderPauser } from "../hooks/networking/useInactiveProviderPauser";
import { NavigationStack } from "./Navigation";
import { styles } from "./styles";

type Props = {
  needsLockScreenOnLaunch: boolean;
};

export const AppReadyView: React.FC<Props> = ({ needsLockScreenOnLaunch }) => {
  const { backGestures } = useReduxSelector("backGestures");
  const [errorModal, setErrorModal] =
    useState<Optional<ErrorDetailsModalProps>>(undefined);

  useAppBalancePriceUpdater(refreshRailgunBalances, (error: Error) =>
    setErrorModal({
      show: true,
      error,
      onDismiss: () => setErrorModal(undefined),
    })
  );

  useWakuBroadcasterChainUpdater();
  useInactiveProviderPauser();

  useVaultFetch();

  useVaultRedeemTokenPriceUpdater();

  return (
    <View style={styles.appWrapper}>
      <NavigationStack
        showLockedScreen={needsLockScreenOnLaunch}
        backGesturesEnabled={backGestures.enabled}
      />
      {errorModal && <ErrorDetailsModal {...errorModal} />}
      <ShieldPOICountdownModal />
      <ToastWrapperView />
    </View>
  );
};
