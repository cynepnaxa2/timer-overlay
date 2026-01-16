const path = require('path');
const { BrowserWindow, screen, globalShortcut, app, dialog } = require('electron');
const state = require('./state');
const { computeWindowBoundsForRightEdge } = require('../utils/positioning');
const { readSettings, writeSettings } = require('../store/settingsStore.js.legacy');
const { buildOverlayCssVariables } = require('../utils/style');
const { getMode, serializeMode } = require('../config/modes');
const { getFormattedCounter } = require('../utils/counters');
const todoService = require('../services/todoService');

function getOverlayWidth() {
  if (!state.currentSettings) state.currentSettings = readSettings();
  const settings = state.currentSettings;
  const symbolSize = Math.max(10, Math.min(200, settings.diameterPx || 60));
  const level = settings.level || 1;
  
  if (level === 3) {
    const textWidth = symbolSize * 0.6 + symbolSize * 0.7 * 6 + 20;
    return Math.max(symbolSize + 50, textWidth);
  }
  
  if (level === 2) {
    return symbolSize + symbolSize * 0.7 * 6 + 30;
  }
  
  return symbolSize + 20;
}

function updateWindowSize() {
  if (!state.mainWindow || state.mainWindow.isDestroyed()) return;
  const primaryDisplay = screen.getPrimaryDisplay();
  const width = getOverlayWidth();
  const bounds = computeWindowBoundsForRightEdge(primaryDisplay.bounds, width);
  state.mainWindow.setBounds({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height
  });
}

function createOverlayWindow() {
  if (!state.currentSettings) state.currentSettings = readSettings();
  const primaryDisplay = screen.getPrimaryDisplay();
  const width = getOverlayWidth();
  const bounds = computeWindowBoundsForRightEdge(primaryDisplay.bounds, width);

  state.mainWindow = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    hasShadow: false,
    focusable: false,
    alwaysOnTop: true,
    show: false,
    backgroundColor: '#00000000',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: false,
      preload: path.resolve(__dirname, '../../dist-electron/overlayPreload.js')
    }
  });

  state.mainWindow.setAlwaysOnTop(true, 'screen-saver');
  state.mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  state.mainWindow.setIgnoreMouseEvents(true, { forward: true });

  state.mainWindow.once('ready-to-show', () => {
    state.mainWindow.showInactive();
    if (process.env.INTEGRATION_TEST) {
      console.log('READY');
      setTimeout(() => app.quit(), 300);
    }
  });

  state.mainWindow.webContents.once('dom-ready', async () => {
    await new Promise(resolve => setTimeout(resolve, 50));
    await applyOverlayStyles();
  });
  
  state.mainWindow.webContents.once('did-finish-load', async () => {
    await applyOverlayStyles();
  });

  state.mainWindow.on('closed', () => {
    state.mainWindow = null;
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    state.mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    state.mainWindow.loadFile(path.join(__dirname, '..', '..', 'dist', 'index.html'));
  }
}

async function applyOverlayStyles() {
  if (!state.mainWindow || state.mainWindow.isDestroyed()) return;
  try {
    if (!state.currentSettings) state.currentSettings = readSettings();
    updateWindowSize();
    
    if (state.overlayCssKey) {
      try {
        await state.mainWindow.webContents.removeInsertedCSS(state.overlayCssKey);
      } catch {}
      state.overlayCssKey = null;
    }

    const css = buildOverlayCssVariables(state.currentSettings);
    state.overlayCssKey = await state.mainWindow.webContents.insertCSS(css);
    
    const level = state.currentSettings.level || 1;
    if (state.mainWindow && !state.mainWindow.isDestroyed()) {
      state.mainWindow.webContents.send('level-updated', level);
      
      const mode = getMode(state.currentSettings.mode || 'money');
      const modeData = serializeMode(mode);
      
      if (level === 3) {
        state.mainWindow.webContents.send('mode-updated', modeData);
      }
      
      const modeId = state.currentSettings.mode || 'money';
      const formatted = getFormattedCounter(
        state.currentSettings.displayCounters || {}, 
        modeId
      );
      state.mainWindow.webContents.send('counter-updated', {
        mode: modeData,
        value: formatted,
        counter: state.currentSettings.displayCounters?.[modeId] || { value: 0, totalMinutes: 0 }
      });
    }
  } catch (err) {
    console.error('Failed to apply overlay styles:', err);
  }
}

function createSettingsWindow() {
  if (state.settingsWindow && !state.settingsWindow.isDestroyed()) {
    state.settingsWindow.focus();
    return;
  }
  state.settingsWindow = new BrowserWindow({
    width: 520,
    height: 680,
    resizable: true,
    minimizable: true,
    maximizable: false,
    minWidth: 480,
    minHeight: 600,
    show: false,
    title: 'Настройки It\'s time!',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: process.env.VITE_DEV_SERVER_URL
        ? path.join(process.cwd(), 'dist-electron', 'settingsPreload.js')
        : path.join(__dirname, 'settingsPreload.js')
    }
  });
  state.settingsWindow.once('ready-to-show', () => state.settingsWindow.show());
  state.settingsWindow.on('closed', () => {
    state.settingsWindow = null;
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    state.settingsWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}settings.html`);
  } else {
    state.settingsWindow.loadFile(path.join(__dirname, '..', '..', 'dist', 'settings.html'));
  }
}

function createTodoWindow() {
  if (state.todoWindow && !state.todoWindow.isDestroyed()) {
    state.todoWindow.focus();
    return;
  }
  state.todoWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    resizable: true,
    minimizable: true,
    maximizable: true,
    show: false,
    title: 'Todo List',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: process.env.VITE_DEV_SERVER_URL
        ? path.join(process.cwd(), 'dist-electron', 'todoPreload.js')
        : path.join(__dirname, 'todoPreload.js'),
      spellcheck: false,
      devTools: true
    }
  });
  
  state.todoWindow.once('ready-to-show', async () => {
    todoService.ensureDemo();
    state.todoWindow.maximize();
    state.todoWindow.show();
    
    state.todoWindow.webContents.once('did-finish-load', () => {
      setTimeout(() => {
        state.todoWindow.webContents.openDevTools();
      }, 500);
    });
    
    // Register shortcuts locally for todo window if needed, 
    // but in main.js they were global. Keeping them global for now as per original.
    
    if (process.env.CAPTURE_SCREENSHOT) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        await state.todoWindow.webContents.executeJavaScript(`
          (async () => {
            if (window.todoApi) {
              await window.todoApi.loadLargeDemo();
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          })()
        `);
        await new Promise(resolve => setTimeout(resolve, 1000));
        const image = await state.todoWindow.capturePage();
        const buffer = image.toPNG();
        const screenshotPath = path.join(__dirname, '..', '..', 'test-screenshots', 'hierarchy-visualization.png');
        const fs = require('fs');
        await fs.promises.mkdir(path.dirname(screenshotPath), { recursive: true });
        await fs.promises.writeFile(screenshotPath, buffer);
        console.log('Screenshot saved to:', screenshotPath);
      } catch (err) {
        console.error('Failed to capture screenshot:', err);
      }
      setTimeout(() => app.quit(), 500);
    } else if (process.env.INTEGRATION_TEST) {
      setTimeout(() => app.quit(), 300);
    }
  });

  state.todoWindow.on('closed', () => {
    if (state.mainWindow && !state.mainWindow.isDestroyed()) {
      state.mainWindow.close();
    }
    state.todoWindow = null;
  });
  
  if (process.env.VITE_DEV_SERVER_URL) {
    state.todoWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}todo.html`);
  } else {
    state.todoWindow.loadFile(path.join(__dirname, '..', '..', 'dist', 'todo.html'));
  }
}

module.exports = {
  createOverlayWindow,
  createSettingsWindow,
  createTodoWindow,
  applyOverlayStyles,
  updateWindowSize
};

