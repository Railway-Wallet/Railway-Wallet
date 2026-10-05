import {
  BiometricOperationResult,
  BiometricStatus,
  ElectronRendererWindow,
  isElectron,
  isMacOS,
} from '@utils/user-agent';

const unavailableStatus: BiometricStatus = {
  available: false,
  enrolled: false,
};

const failedResult: BiometricOperationResult = {
  success: false,
  error: 'unavailable',
};

export const isTouchIDPlatform = () => isElectron() && isMacOS();

const getBridge = () => {
  if (!isTouchIDPlatform()) return undefined;
  const renderer = window as unknown as ElectronRendererWindow;
  return renderer.electronBridge;
};

export const getBiometricStatus = async (): Promise<BiometricStatus> => {
  const bridge = getBridge();
  if (!bridge) return unavailableStatus;

  try {
    return await bridge.getBiometricStatus();
  } catch {
    return unavailableStatus;
  }
};

export const enrollBiometricKey = async (
  authKey: string,
): Promise<BiometricOperationResult> => {
  const bridge = getBridge();
  if (!bridge) return failedResult;

  try {
    return await bridge.enrollBiometricKey(authKey);
  } catch {
    return failedResult;
  }
};

export const retrieveBiometricKey = async (): Promise<BiometricOperationResult> => {
  const bridge = getBridge();
  if (!bridge) return failedResult;

  try {
    return await bridge.retrieveBiometricKey();
  } catch {
    return failedResult;
  }
};

export const deleteBiometricKey = async (): Promise<BiometricOperationResult> => {
  const bridge = getBridge();
  if (!bridge) return failedResult;

  try {
    return await bridge.deleteBiometricKey();
  } catch {
    return failedResult;
  }
};
