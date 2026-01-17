"use strict";
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("todoApi", {
  loadTodos: () => ipcRenderer.invoke("get-todos"),
  saveTodos: (todos) => ipcRenderer.invoke("save-todos", todos),
  onTodosUpdated: (callback) => {
    ipcRenderer.on("todos-updated", (_event, todos) => callback(todos));
  },
  onSettingsUpdated: (callback) => {
    ipcRenderer.on("settings-updated", (_event, settings) => callback(settings));
  },
  startTimer: (motivationWord) => ipcRenderer.invoke("start-timer", motivationWord)
});
