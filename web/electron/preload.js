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
});
