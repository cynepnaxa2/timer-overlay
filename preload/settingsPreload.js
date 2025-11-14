const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('settingsApi', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  getAutostart: () => ipcRenderer.invoke('get-autostart'),
  updateSettings: (settings) => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for settings update'));
      }, 5000);
      
      const handler = () => {
        clearTimeout(timeout);
        ipcRenderer.removeListener('settings-updated', handler);
        resolve();
      };
      
      ipcRenderer.once('settings-updated', handler);
      ipcRenderer.send('update-settings', settings);
    });
  }
});



