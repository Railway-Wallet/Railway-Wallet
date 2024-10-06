import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { getActiveRootNavigation } from "@root/Navigation";
import { hasPinSet } from "@services/security/secure-app-service";

export const useInactiveSecurityLockScreen = () => {
  const [showInactiveSecurityLockScreen, setShowInactiveSecurityLockScreen] =
    useState<boolean>(false);

  const appState = useRef(AppState.currentState);

  useEffect(() => {
    AppState.addEventListener("change", async (nextAppState) => {
      if (
        (nextAppState === "inactive" || nextAppState === "background") &&
        !global.preventSecurityScreen
      ) {
        setShowInactiveSecurityLockScreen(true);
      } else {
        setShowInactiveSecurityLockScreen(false);
      }

      if (appState.current === "active" && nextAppState === "background") {
        const pinSet = await hasPinSet();
        if (pinSet) {
          getActiveRootNavigation()?.navigate("LockedModal", {
            goBackOnDismiss: true,
            skipAuthOnMount: true,
          });
        }
      }

      if (nextAppState === "background" || nextAppState === "active") {
        appState.current = nextAppState;
      }
    });
  }, []);

  return {
    showInactiveSecurityLockScreen,
  };
};
