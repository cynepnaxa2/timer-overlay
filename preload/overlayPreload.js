const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('overlayApi', {
  getMode: () => ipcRenderer.invoke('get-mode'),
  onCounterUpdated: (callback) => {
    ipcRenderer.on('counter-updated', (_event, data) => callback(data));
  },
  onModeUpdated: (callback) => {
    ipcRenderer.on('mode-updated', (_event, mode) => callback(mode));
  }
});

