import {
  BiometryType,
  ReactNativeBiometricsLegacy,
} from "react-native-biometrics";
import { BiometricsAuthResponse, logDev, logDevError } from "@react-shared";

export const getBiometryType = async (): Promise<Optional<BiometryType>> => {
  const result = await ReactNativeBiometricsLegacy.isSensorAvailable();
  return result.biometryType;
};

export const biometricsAuthenticate =
  async (): Promise<BiometricsAuthResponse> => {
    try {
      global.preventSecurityScreen = true;
      await ReactNativeBiometricsLegacy.isSensorAvailable();
      const { success } = await ReactNativeBiometricsLegacy.simplePrompt({
        promptMessage: "Authenticate Railway.",
      });

      logDev("Biometrics auth success:", success);

      global.preventSecurityScreen = false;
      return success
        ? BiometricsAuthResponse.Success
        : BiometricsAuthResponse.Failure;
    } catch (err) {
      global.preventSecurityScreen = false;
      logDevError(new Error("Biometrics auth error", { cause: err }));
      return BiometricsAuthResponse.Denied;
    }
  };
