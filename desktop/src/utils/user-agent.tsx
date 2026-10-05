export const isElectron = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.indexOf(' electron/') !== -1;
};

export const isMacOS = () => navigator.userAgent.includes('Macintosh');

export type BiometricStatus = {
  available: boolean;
  enrolled: boolean;
};

export type BiometricOperationResult = {
  success: boolean;
  key?: string;
  error?: string;
};

export type ElectronRendererWindow = Window & {
  electronBridge: {
    addFocusListener: (listener: () => void) => void;
    removeFocusListener: (listener: () => void) => void;
    wipeDeviceData: () => void;
    getBiometricStatus: () => Promise<BiometricStatus>;
    enrollBiometricKey: (
      authKey: string,
    ) => Promise<BiometricOperationResult>;
    retrieveBiometricKey: () => Promise<BiometricOperationResult>;
    deleteBiometricKey: () => Promise<BiometricOperationResult>;
  };
};
