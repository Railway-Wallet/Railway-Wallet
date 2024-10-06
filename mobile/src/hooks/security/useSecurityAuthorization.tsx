import { isDefined } from "@railgun-community/shared-models";
import { InteractionManager } from "react-native";
import { BiometricsAuthResponse } from "@react-shared";
import { biometricsAuthenticate } from "@services/security/biometrics-service";
import { getEncryptedPin } from "@services/security/secure-app-service";
import { Constants } from "@utils/constants";

export const useSecurityAuthorization = (
  authSuccess: (key: string) => void,
  authFail: () => void
) => {
  const authenticate = async () => {
    const storedPin = await getEncryptedPin();
    if (!isDefined(storedPin)) {
      authSuccess(Constants.DEFAULT_AUTH_KEY);
      return;
    }
    if (__DEV__ && Constants.SKIP_LOCKED_SCREEN_IN_DEV) {
      authSuccess(storedPin);
      return;
    }
    const authResp = await biometricsAuthenticate();
    if (authResp === BiometricsAuthResponse.Success) {
      authSuccess(storedPin);
      return;
    }

    await InteractionManager.runAfterInteractions(authFail);
  };

  return { authenticate };
};
