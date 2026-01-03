const { app, globalShortcut } = require('electron');
const state = require('./src/main/state');
const windowManager = require('./src/main/windowManager');
const timerManager = require('./src/main/timerManager');
const trayManager = require('./src/main/trayManager');
const { registerIpcHandlers } = require('./src/main/ipcHandlers');
const { readSettings, isFirstRun } = require('./src/store/settingsStore');

// Initialize IPC handlers
registerIpcHandlers(windowManager, timerManager, trayManager);

app.whenReady().then(() => {
  state.currentSettings = readSettings();
  
  // Apply initial autostart setting
  if (state.currentSettings.autostart !== undefined) {
    try {
      app.setLoginItemSettings({
        openAtLogin: state.currentSettings.autostart,
        openAsHidden: false
      });
    } catch (err) {
      console.error('Failed to set autostart on boot:', err);
    }
  }
  
  // Create initial windows and tray
  windowManager.createOverlayWindow();
  windowManager.createTodoWindow();
  trayManager.createTray(windowManager.createTodoWindow, windowManager.createSettingsWindow);
  
  // Start background services
  timerManager.startCounterTimer();
  timerManager.registerResetHotkey();
  
  // Global shortcuts for DevTools (carried over from original main.js)
  globalShortcut.register('F12', () => {
    if (state.todoWindow && !state.todoWindow.isDestroyed()) {
      if (state.todoWindow.webContents.isDevToolsOpened()) {
        state.todoWindow.webContents.closeDevTools();
      } else {
        state.todoWindow.webContents.openDevTools();
      }
    }
  });
  
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    if (state.todoWindow && !state.todoWindow.isDestroyed()) {
      if (state.todoWindow.webContents.isDevToolsOpened()) {
        state.todoWindow.webContents.closeDevTools();
      } else {
        state.todoWindow.webContents.openDevTools();
      }
    }
  });

  if (isFirstRun()) {
    setTimeout(() => {
      windowManager.createSettingsWindow();
    }, 500);
  }

  app.on('activate', () => {
    if (state.mainWindow === null) {
      windowManager.createOverlayWindow();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  app.quit();
});
