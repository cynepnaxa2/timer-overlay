const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('overlayApi', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  getMode: () => ipcRenderer.invoke('get-mode'),
  getCurrentCounter: () => ipcRenderer.invoke('get-current-counter'),
  onCounterUpdated: (callback) => {
    ipcRenderer.on('counter-updated', (_event, data) => callback(data));
  },
  onModeUpdated: (callback) => {
    ipcRenderer.on('mode-updated', (_event, mode) => callback(mode));
  },
  onLevelUpdated: (callback) => {
    ipcRenderer.on('level-updated', (_event, level) => callback(level));
  },
  onRestartCycle: (callback) => {
    ipcRenderer.on('restart-cycle', (_event) => callback());
  }
});

