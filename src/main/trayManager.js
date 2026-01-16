const { Tray, Menu, nativeImage, app } = require('electron');
const state = require('./state');
const { createTrayIcon } = require('../utils/trayIcon');
const { readSettings } = require('../store/settingsStore.js.legacy');

function createTray(createTodoWindow, createSettingsWindow) {
  if (!state.currentSettings) state.currentSettings = readSettings();
  if (!state.currentSettings.showTray) return;

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Открыть Todo',
      click: () => {
        if (!state.todoWindow || state.todoWindow.isDestroyed()) {
          createTodoWindow();
        } else {
          state.todoWindow.focus();
        }
      }
    },
    {
      label: 'DevTools Todo',
      click: () => {
        if (state.todoWindow && !state.todoWindow.isDestroyed()) {
          if (state.todoWindow.webContents.isDevToolsOpened()) {
            state.todoWindow.webContents.closeDevTools();
          } else {
            state.todoWindow.webContents.openDevTools();
          }
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Настройки',
      click: () => {
        if (!state.settingsWindow || state.settingsWindow.isDestroyed()) {
          createSettingsWindow();
        } else {
          state.settingsWindow.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Выход',
      click: () => {
        app.quit();
      }
    }
  ]);
  
  try {
    const icon = createTrayIcon();
    state.tray = new Tray(icon);
  } catch (err) {
    console.error('Failed to create tray icon:', err);
    state.tray = new Tray(nativeImage.createEmpty());
  }
  
  state.tray.setToolTip('It\'s time!');
  state.tray.setContextMenu(contextMenu);
  state.tray.on('click', () => createSettingsWindow());
}

function updateTrayVisibility(createTodoWindow, createSettingsWindow) {
  if (!state.currentSettings) state.currentSettings = readSettings();
  
  if (state.currentSettings.showTray) {
    if (!state.tray) {
      createTray(createTodoWindow, createSettingsWindow);
    }
  } else {
    if (state.tray) {
      state.tray.destroy();
      state.tray = null;
    }
  }
}

module.exports = {
  createTray,
  updateTrayVisibility
};

