import React, { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { ButtonWithTextAndIcon } from "@components/buttons/ButtonWithTextAndIcon/ButtonWithTextAndIcon";
import { SecurityView } from "@components/views/SecurityView.tsx/SecurityView";
import { useDisableHardwareBackButton } from "@hooks/navigation/useDisableHardwareBackButton";
import { useSecurityAuthorization } from "@hooks/security/useSecurityAuthorization";
import { RootStackParamList } from "@models/navigation-models";
import { NavigationProp, RouteProp } from "@react-navigation/native";
import { setAuthKey, useAppDispatch } from "@react-shared";
import { EnterPinModal } from "@screens/modals/EnterPinModal/EnterPinModal";
import { styles } from "./styles";

type Props = {
  navigation: NavigationProp<RootStackParamList, "LockedScreen">;
  route: RouteProp<{ params: RootStackParamList["LockedScreen"] }, "params">;
};

export const LockedScreen: React.FC<Props> = ({ navigation, route }) => {
  const [showEnterPinModal, setShowEnterPinModal] = useState(false);
  const dispatch = useAppDispatch();

  useDisableHardwareBackButton();

  const authorizeSession = (key: string) => {
    dispatch(setAuthKey(key));
    setShowEnterPinModal(false);
    if (route.params?.goBackOnDismiss) {
      navigation.goBack();
    } else if (route.params?.recoveryMode ?? false) {
      navigateToRecoveryWallets();
    } else {
      navigateToWalletProviderLoading();
    }
  };

  const { authenticate } = useSecurityAuthorization(authorizeSession, () => {
    setShowEnterPinModal(true);
  });

  useEffect(() => {
    if (!route.params?.skipAuthOnMount) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      authenticate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.skipAuthOnMount]);

  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        if (appState.current === "background" && nextAppState === "active") {
          await new Promise<void>((resolve) => {
            setTimeout(async () => {
              await authenticate();
              resolve();
            }, 50);
          });
        }

        if (nextAppState === "background" || nextAppState === "active") {
          appState.current = nextAppState;
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, [authenticate]);

  const navigateToWalletProviderLoading = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "WalletProviderLoading" }],
    });
  };

  const navigateToRecoveryWallets = () => {
    navigation.reset({
      index: 0,
      routes: [
        {
          name: "RecoveryWallets",
        },
      ],
    });
  };

  const onUnlock = async () => {
    setShowEnterPinModal(false);
    await authenticate();
  };

  return (
    <>
      <EnterPinModal
        show={showEnterPinModal}
        authorizeSession={authorizeSession}
      />
      <SecurityView>
        <ButtonWithTextAndIcon
          additionalStyles={styles.unlockButton}
          icon="lock-open-outline"
          title="Unlock"
          onPress={onUnlock}
        />
      </SecurityView>
    </>
  );
};
