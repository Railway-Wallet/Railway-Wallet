export const isElectron = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.indexOf(' electron/') !== -1;
};

export type ElectronRendererWindow = Window & {
  electronBridge: {
    addFocusListener: (listener: () => void) => void;
    removeFocusListener: (listener: () => void) => void;
    wipeDeviceData: () => void;
  };
};
