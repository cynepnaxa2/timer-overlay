const path = require('path');
const { app, BrowserWindow, screen, ipcMain, Tray, Menu, nativeImage } = require('electron');
const { computeWindowBoundsForRightEdge } = require('./src/utils/positioning');
const { readSettings, writeSettings } = require('./src/store/settingsStore');
const { buildOverlayCssVariables } = require('./src/utils/style');

let mainWindow = null;
let settingsWindow = null;
let tray = null;
let overlayCssKey = null;
let currentSettings = null;

function getOverlayWidth() {
  if (!currentSettings) currentSettings = readSettings();
  return Math.max(10, Math.min(200, currentSettings.diameterPx || 20));
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
      devTools: false
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
    width: 360,
    height: 380,
    resizable: false,
    minimizable: false,
    maximizable: false,
    show: false,
    title: 'Overlay Settings',
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
  try {
    // Use the current executable icon as tray icon (works in packaged app; fine in dev)
    const icon = nativeImage.createFromPath(process.execPath);
    tray = new Tray(icon);
  } catch {
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

function registerIpc() {
  ipcMain.handle('get-settings', () => {
    if (!currentSettings) currentSettings = readSettings();
    return currentSettings;
  });
  ipcMain.on('update-settings', async (_event, patch) => {
    if (!currentSettings) currentSettings = readSettings();
    currentSettings = writeSettings({ ...currentSettings, ...patch });
    await applyOverlayStyles();
    // Notify settings window that update succeeded
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.webContents.send('settings-updated');
    }
  });
}

app.whenReady().then(() => {
  currentSettings = readSettings();
  createWindow();
  createTray();
  registerIpc();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Quit on all platforms since this is a background overlay
  app.quit();
});


