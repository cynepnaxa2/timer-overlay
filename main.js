const path = require('path');
const { app, BrowserWindow, screen, ipcMain, Tray, Menu, globalShortcut } = require('electron');
const { computeWindowBoundsForRightEdge } = require('./src/utils/positioning');
const { readSettings, writeSettings, isFirstRun } = require('./src/store/settingsStore');
const { buildOverlayCssVariables } = require('./src/utils/style');
const { createTrayIcon } = require('./src/utils/trayIcon');
const { getMode, getAllModes } = require('./src/config/modes');
const { updateCounter, getFormattedCounter, resetAllCounters } = require('./src/utils/counters');

let mainWindow = null;
let settingsWindow = null;
let tray = null;
let overlayCssKey = null;
let currentSettings = null;
let counterInterval = null;
let cycleStartTime = null;
let resetHotkeyRegistered = false;

function getOverlayWidth() {
  if (!currentSettings) currentSettings = readSettings();
  // Увеличиваем ширину для счетчика (примерно +40px для текста)
  const symbolSize = Math.max(10, Math.min(200, currentSettings.diameterPx || 60));
  return symbolSize + 50; // Дополнительное место для счетчика
}

function updateWindowSize() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const primaryDisplay = screen.getPrimaryDisplay();
  const width = getOverlayWidth();
  const bounds = computeWindowBoundsForRightEdge(primaryDisplay.bounds, width);
  mainWindow.setBounds({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height
  });
}

function createWindow() {
  if (!currentSettings) currentSettings = readSettings();
  const primaryDisplay = screen.getPrimaryDisplay();
  const width = getOverlayWidth();
  const bounds = computeWindowBoundsForRightEdge(primaryDisplay.bounds, width);

  mainWindow = new BrowserWindow({
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
      preload: path.join(__dirname, 'preload', 'overlayPreload.js')
    }
  });

  // Keep above everything, including full-screen windows
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // Do not intercept mouse/keyboard events
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  mainWindow.once('ready-to-show', () => {
    mainWindow.showInactive(); // show without focusing
    if (process.env.INTEGRATION_TEST) {
      // Signal to tests and exit soon after
      // eslint-disable-next-line no-console
      console.log('READY');
      setTimeout(() => {
        app.quit();
      }, 300);
    }
  });

  mainWindow.webContents.once('dom-ready', async () => {
    // Small delay to ensure DOM is fully ready
    await new Promise(resolve => setTimeout(resolve, 50));
    await applyOverlayStyles();
  });
  
  mainWindow.webContents.once('did-finish-load', async () => {
    // Also apply on did-finish-load as backup
    await applyOverlayStyles();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

async function applyOverlayStyles() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  try {
    if (!currentSettings) currentSettings = readSettings();
    // Update window size if diameter changed
    updateWindowSize();
    // Remove old CSS if exists
    if (overlayCssKey) {
      try {
        await mainWindow.webContents.removeInsertedCSS(overlayCssKey);
      } catch {}
      overlayCssKey = null;
    }
    // Apply new CSS
    const css = buildOverlayCssVariables(currentSettings);
    overlayCssKey = await mainWindow.webContents.insertCSS(css);
    
    // Send level update to overlay
    const level = currentSettings.level || 1;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('level-updated', level);
      
      // Send mode update (only for level 3)
      if (level === 3) {
        const mode = getMode(currentSettings.mode || 'money');
        mainWindow.webContents.send('mode-updated', mode);
      }
      
      // Send current counter value
      const { getFormattedCounter } = require('./src/utils/counters');
      const modeId = currentSettings.mode || 'money';
      const formatted = getFormattedCounter(
        currentSettings.counters || {}, 
        modeId
      );
      mainWindow.webContents.send('counter-updated', {
        mode: modeId,
        value: formatted,
        counter: currentSettings.counters?.[modeId] || { value: 0, totalMinutes: 0 }
      });
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to apply overlay styles:', err);
  }
}

function createSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return;
  }
  settingsWindow = new BrowserWindow({
    width: 520,
    height: 680,
    resizable: true,
    minimizable: true,
    maximizable: false,
    minWidth: 480,
    minHeight: 600,
    show: false,
    title: 'Настройки Timer Overlay',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload', 'settingsPreload.js')
    }
  });
  settingsWindow.once('ready-to-show', () => settingsWindow.show());
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
  settingsWindow.loadFile(path.join(__dirname, 'settings.html'));
}

function createTray() {
  if (!currentSettings) currentSettings = readSettings();
  if (!currentSettings.showTray) return;
  
  try {
    const icon = createTrayIcon();
    tray = new Tray(icon);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to create tray icon:', err);
    // Fallback to empty icon
    const { nativeImage } = require('electron');
    tray = new Tray(nativeImage.createEmpty());
  }
  tray.setToolTip('Timer Overlay');
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Открыть настройки', click: () => createSettingsWindow() },
    { type: 'separator' },
    { label: 'Выйти', click: () => app.quit() }
  ]);
  tray.setContextMenu(contextMenu);
  tray.on('click', () => createSettingsWindow());
}

function updateTrayVisibility() {
  if (!currentSettings) currentSettings = readSettings();
  
  if (currentSettings.showTray) {
    if (!tray) {
      createTray();
    }
  } else {
    if (tray) {
      tray.destroy();
      tray = null;
    }
  }
}

function updateAutostart(enabled) {
  try {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      openAsHidden: false
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to update autostart:', err);
  }
}

function registerIpc() {
  ipcMain.handle('get-settings', () => {
    if (!currentSettings) currentSettings = readSettings();
    return currentSettings;
  });
  
  ipcMain.handle('get-autostart', () => {
    try {
      return app.getLoginItemSettings().openAtLogin;
    } catch {
      return false;
    }
  });
  
  ipcMain.handle('get-mode', () => {
    if (!currentSettings) currentSettings = readSettings();
    return getMode(currentSettings.mode || 'money');
  });
  
  ipcMain.handle('get-current-counter', () => {
    if (!currentSettings) currentSettings = readSettings();
    const modeId = currentSettings.mode || 'money';
    if (currentSettings.counters && currentSettings.counters[modeId]) {
      return {
        value: getFormattedCounter(currentSettings.counters, modeId),
        counter: currentSettings.counters[modeId]
      };
    }
    return null;
  });
  
  ipcMain.on('update-settings', async (_event, patch) => {
    if (!currentSettings) currentSettings = readSettings();
    const durationChanged = 'durationSeconds' in patch;
    currentSettings = writeSettings({ ...currentSettings, ...patch });
    await applyOverlayStyles();
    
    // Update autostart if changed
    if ('autostart' in patch) {
      updateAutostart(patch.autostart);
    }
    
    // Update tray visibility if changed
    if ('showTray' in patch) {
      updateTrayVisibility();
    }
    
    // Restart counter timer if duration changed
    if (durationChanged) {
      startCounterTimer();
    }
    
    // Re-register reset hotkey if changed
    if ('resetHotkey' in patch) {
      registerResetHotkey();
    }
    
    // Send level update if changed
    if ('level' in patch) {
      const level = currentSettings.level || 1;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('level-updated', level);
      }
    }
    
    // Send mode update if changed (only for level 3)
    if ('mode' in patch && (currentSettings.level || 1) === 3) {
      const mode = getMode(currentSettings.mode);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('mode-updated', mode);
      }
    }
    
    // Notify settings window that update succeeded
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.webContents.send('settings-updated');
      settingsWindow.webContents.send('counters-updated', currentSettings.counters);
    }
  });
}

function startCounterTimer() {
  if (counterInterval) {
    clearInterval(counterInterval);
  }
  
  if (!currentSettings) currentSettings = readSettings();
  if (!currentSettings.counters) currentSettings.counters = {};
  
  cycleStartTime = Date.now();
  
  // Обновляем счетчик каждую минуту
  counterInterval = setInterval(() => {
    if (!currentSettings || !mainWindow || mainWindow.isDestroyed()) return;
    
    const mode = getMode(currentSettings.mode || 'money');
    const elapsedMinutes = 1; // Каждый цикл = 1 минута
    
    // Обновляем счетчик
    updateCounter(currentSettings.counters, currentSettings.mode, elapsedMinutes);
    
    // Сохраняем настройки
    currentSettings = writeSettings(currentSettings);
    
    // Отправляем обновление в overlay
    if (mainWindow && !mainWindow.isDestroyed()) {
      const formatted = getFormattedCounter(currentSettings.counters, currentSettings.mode);
      mainWindow.webContents.send('counter-updated', {
        mode: currentSettings.mode,
        value: formatted,
        counter: currentSettings.counters[currentSettings.mode]
      });
    }
    
    // Отправляем обновление в settings window
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.webContents.send('counters-updated', currentSettings.counters);
    }
  }, currentSettings.durationSeconds * 1000); // Интервал = длительность цикла
}

function registerResetHotkey() {
  if (!currentSettings) currentSettings = readSettings();
  const hotkey = currentSettings.resetHotkey || 'Ctrl+Shift+R';
  
  // Отменяем предыдущую регистрацию
  if (resetHotkeyRegistered) {
    try {
      globalShortcut.unregisterAll();
      resetHotkeyRegistered = false;
    } catch {}
  }
  
  // Регистрируем новую горячую клавишу
  try {
    const registered = globalShortcut.register(hotkey, () => {
      if (!currentSettings) currentSettings = readSettings();
      
      // Сбрасываем все счетчики
      currentSettings.counters = resetAllCounters(currentSettings.counters || {});
      currentSettings = writeSettings(currentSettings);
      
      // Обновляем overlay
      if (mainWindow && !mainWindow.isDestroyed()) {
        const { getFormattedCounter } = require('./src/utils/counters');
        const modeId = currentSettings.mode || 'money';
        const formatted = getFormattedCounter(currentSettings.counters, modeId);
        mainWindow.webContents.send('counter-updated', {
          mode: modeId,
          value: formatted,
          counter: currentSettings.counters[modeId] || { value: 0, totalMinutes: 0 }
        });
      }
      
      // Обновляем settings window
      if (settingsWindow && !settingsWindow.isDestroyed()) {
        settingsWindow.webContents.send('counters-updated', currentSettings.counters);
      }
    });
    
    if (registered) {
      resetHotkeyRegistered = true;
    } else {
      // eslint-disable-next-line no-console
      console.error('Failed to register reset hotkey:', hotkey);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error registering reset hotkey:', err);
  }
}

app.whenReady().then(() => {
  currentSettings = readSettings();
  
  // Register IPC handlers FIRST, before creating any windows
  registerIpc();
  
  // Apply autostart setting on startup
  if (currentSettings.autostart !== undefined) {
    updateAutostart(currentSettings.autostart);
  }
  
  createWindow();
  createTray();
  
  // Start counter timer
  startCounterTimer();
  
  // Register reset hotkey
  registerResetHotkey();
  
  // Show settings on first run
  if (isFirstRun()) {
    setTimeout(() => {
      createSettingsWindow();
    }, 500);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  // Отменяем регистрацию горячих клавиш при выходе
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  // Quit on all platforms since this is a background overlay
  app.quit();
});


