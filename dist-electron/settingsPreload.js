"use strict";
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("settingsApi", {
  loadSettings: () => ipcRenderer.invoke("get-settings"),
  saveSettings: (settings) => ipcRenderer.invoke("save-settings", settings),
  onSettingsUpdated: (callback) => {
    ipcRenderer.on("settings-updated", (_event, settings) => callback(settings));
  }
});
