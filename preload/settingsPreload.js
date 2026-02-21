const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('settingsApi', {
  loadSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  resetStatistics: () => ipcRenderer.invoke('reset-statistics'),
  selectSyncFolder: (options) => ipcRenderer.invoke('select-sync-folder', options),
  onSettingsUpdated: (callback) => {
    ipcRenderer.on('settings-updated', (_event, settings) => callback(settings));
  },
});
