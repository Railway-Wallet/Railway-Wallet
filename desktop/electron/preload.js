const { contextBridge, ipcRenderer } = require('electron/renderer');

const deferredCallbacks = new Map();
contextBridge.exposeInMainWorld('electronBridge', {
  addFocusListener: callback => {
    const deferredCallback = () => callback();
    deferredCallbacks.set(callback, deferredCallback);
    return ipcRenderer.addListener('focused', deferredCallback);
  },
  removeFocusListener: callback => {
    const deferredCallback = deferredCallbacks.get(callback);
    if (!deferredCallback) return;
    return ipcRenderer.removeListener('focused', deferredCallback);
  },
  wipeDeviceData: () => {
    ipcRenderer.send('wipe-device-data');
  },
  getBiometricStatus: () => ipcRenderer.invoke('get-biometric-status'),
  enrollBiometricKey: authKey =>
    ipcRenderer.invoke('enroll-biometric-key', authKey),
  retrieveBiometricKey: () => ipcRenderer.invoke('retrieve-biometric-key'),
  deleteBiometricKey: () => ipcRenderer.invoke('delete-biometric-key'),
});
