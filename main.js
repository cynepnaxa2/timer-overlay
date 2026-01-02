const path = require('path');
const { app, BrowserWindow, screen, ipcMain, Tray, Menu, globalShortcut, dialog } = require('electron');
const { computeWindowBoundsForRightEdge } = require('./src/utils/positioning');
const { readSettings, writeSettings, isFirstRun } = require('./src/store/settingsStore');
const { buildOverlayCssVariables } = require('./src/utils/style');
const { createTrayIcon } = require('./src/utils/trayIcon');
const { getMode, getAllModes } = require('./src/config/modes');
const { updateCounter, getFormattedCounter, resetDisplayCounters } = require('./src/utils/counters');
const todoService = require('./src/services/todoService');

let mainWindow = null;
let settingsWindow = null;
let todoWindow = null;
let tray = null;
let overlayCssKey = null;
let currentSettings = null;
let counterInterval = null;
let cycleStartTime = null;
let resetHotkeyRegistered = false;

function getOverlayWidth() {
  if (!currentSettings) currentSettings = readSettings();
  const symbolSize = Math.max(10, Math.min(200, currentSettings.diameterPx || 60));
  const level = currentSettings.level || 1;
  
  // Для уровня 3 (эксперт) нужно место: символ + цифры (без единицы измерения)
  if (level === 3) {
    // Ширина символа + ширина цифр (до 6 цифр для больших чисел) + отступы
    const textWidth = symbolSize * 0.6 + symbolSize * 0.7 * 6 + 20;
    return Math.max(symbolSize + 50, textWidth);
  }
  
  // Для уровня 2 нужно место для цифр (до 6 цифр)
  if (level === 2) {
    return symbolSize + symbolSize * 0.7 * 6 + 30; // Место для больших чисел
  }
  
  // Для уровня 1 (круг) нужен размер круга + отступы
  // Учитываем right: 10px из .symbol-container и padding-right: 4px из #overlay
  return symbolSize + 20; // Отступы для полного отображения круга
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
      
      // Send mode update
      const mode = getMode(currentSettings.mode || 'money');
      const modeData = {
        id: mode.id,
        name: mode.name,
        emoji: mode.emoji,
        symbol: mode.symbol,
        color: mode.color,
        unit: mode.unit,
        description: mode.description
      };
      if (level === 3) {
        mainWindow.webContents.send('mode-updated', modeData);
      }
      
      // Send current counter value (используем displayCounters для отображения)
      const modeId = currentSettings.mode || 'money';
      const formatted = getFormattedCounter(
        currentSettings.displayCounters || {}, 
        modeId
      );
      mainWindow.webContents.send('counter-updated', {
        mode: modeData,
        value: formatted,
        counter: currentSettings.displayCounters?.[modeId] || { value: 0, totalMinutes: 0 }
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
    title: 'Настройки It\'s time!',
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

function createTodoWindow() {
  if (todoWindow && !todoWindow.isDestroyed()) {
    todoWindow.focus();
    return;
  }
  todoWindow = new BrowserWindow({
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
      preload: path.join(__dirname, 'preload', 'todoPreload.js'),
      spellcheck: false,
      devTools: true
    }
  });
  todoWindow.once('ready-to-show', async () => {
    todoService.ensureDemo();
    todoWindow.maximize();
    todoWindow.show();
    
    todoWindow.webContents.once('did-finish-load', () => {
      setTimeout(() => {
        todoWindow.webContents.openDevTools();
      }, 500);
    });
    
    globalShortcut.register('F12', () => {
      if (todoWindow && !todoWindow.isDestroyed()) {
        if (todoWindow.webContents.isDevToolsOpened()) {
          todoWindow.webContents.closeDevTools();
        } else {
          todoWindow.webContents.openDevTools();
        }
      }
    });
    
    globalShortcut.register('CommandOrControl+Shift+I', () => {
      if (todoWindow && !todoWindow.isDestroyed()) {
        if (todoWindow.webContents.isDevToolsOpened()) {
          todoWindow.webContents.closeDevTools();
        } else {
          todoWindow.webContents.openDevTools();
        }
      }
    });
    
    if (process.env.CAPTURE_SCREENSHOT) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        await todoWindow.webContents.executeJavaScript(`
          (async () => {
            if (window.todoApi) {
              await window.todoApi.loadLargeDemo();
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          })()
        `);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const image = await todoWindow.capturePage();
        const buffer = image.toPNG();
        const screenshotPath = path.join(__dirname, 'test-screenshots', 'hierarchy-visualization.png');
        const fs = require('fs');
        await fs.promises.mkdir(path.dirname(screenshotPath), { recursive: true });
        await fs.promises.writeFile(screenshotPath, buffer);
        console.log('Screenshot saved to:', screenshotPath);
      } catch (err) {
        console.error('Failed to capture screenshot:', err);
      }
      
      setTimeout(() => {
        app.quit();
      }, 500);
    } else if (process.env.INTEGRATION_TEST) {
      setTimeout(() => {
        app.quit();
      }, 300);
    }
  });
  todoWindow.on('closed', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.close();
    }
    todoWindow = null;
  });
  todoWindow.loadFile(path.join(__dirname, 'todo.html'));
}

function createTray() {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Открыть Todo',
      click: () => {
        if (!todoWindow || todoWindow.isDestroyed()) {
          createTodoWindow();
        } else {
          todoWindow.focus();
        }
      }
    },
    {
      label: 'DevTools Todo',
      click: () => {
        if (todoWindow && !todoWindow.isDestroyed()) {
          if (todoWindow.webContents.isDevToolsOpened()) {
            todoWindow.webContents.closeDevTools();
          } else {
            todoWindow.webContents.openDevTools();
          }
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Настройки',
      click: () => {
        if (!settingsWindow || settingsWindow.isDestroyed()) {
          createSettingsWindow();
        } else {
          settingsWindow.focus();
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
  tray.setToolTip('It\'s time!');
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
    const mode = getMode(currentSettings.mode || 'money');
    // Возвращаем только сериализуемые данные (без функций)
    return {
      id: mode.id,
      name: mode.name,
      emoji: mode.emoji,
      symbol: mode.symbol,
      color: mode.color,
      unit: mode.unit,
      description: mode.description
    };
  });
  
  ipcMain.handle('get-modes', () => {
    const modes = getAllModes();
    // Возвращаем только сериализуемые данные (без функций)
    return modes.map(mode => ({
      id: mode.id,
      name: mode.name,
      emoji: mode.emoji,
      symbol: mode.symbol,
      color: mode.color,
      unit: mode.unit,
      description: mode.description
    }));
  });
  
  ipcMain.handle('get-current-counter', () => {
    if (!currentSettings) currentSettings = readSettings();
    const modeId = currentSettings.mode || 'money';
    if (currentSettings.displayCounters && currentSettings.displayCounters[modeId] !== undefined) {
      return {
        value: getFormattedCounter(currentSettings.displayCounters, modeId),
        counter: currentSettings.displayCounters[modeId]
      };
    }
    return null;
  });
  
  ipcMain.handle('reset-statistics', () => {
    if (!currentSettings) currentSettings = readSettings();
    // Сбрасываем статистику (counters), но не отображаемые счетчики (displayCounters)
    currentSettings.counters = {};
    currentSettings = writeSettings(currentSettings);
    
    // Обновляем settings window
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.webContents.send('counters-updated', currentSettings.counters);
    }
    
    return true;
  });
  
  ipcMain.handle('get-todos', () => {
    return todoService.getTodos();
  });
  
  function notifyTodosUpdated() {
    if (todoWindow && !todoWindow.isDestroyed()) {
      todoWindow.webContents.send('todos-updated', todoService.getTodos());
    }
  }
  
  ipcMain.handle('create-todo', (_event, content, parentId) => {
    const todo = todoService.createTodo(content, parentId);
    notifyTodosUpdated();
    return todo;
  });
  
  ipcMain.handle('update-todo', (_event, id, updates) => {
    const todo = todoService.updateTodo(id, updates);
    notifyTodosUpdated();
    return todo;
  });
  
  ipcMain.handle('delete-todo', (_event, id) => {
    todoService.deleteTodo(id);
    notifyTodosUpdated();
    return true;
  });
  
  ipcMain.handle('reorder-todos', (_event, todoIds) => {
    const todos = todoService.reorderTodos(todoIds);
    if (todoWindow && !todoWindow.isDestroyed()) {
      todoWindow.webContents.send('todos-updated', todos);
    }
    return todos;
  });
  
  ipcMain.handle('toggle-task-collapse', (_event, taskId) => {
    const updated = todoService.toggleCollapse(taskId);
    notifyTodosUpdated();
    return updated;
  });
  
  ipcMain.handle('start-timer', (_event, motivationWord) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('restart-cycle');
      if (motivationWord) {
        mainWindow.webContents.send('timer-started', { motivationWord });
      }
    }
    return true;
  });
  
  ipcMain.handle('load-todos-from-file', async () => {
    if (!todoWindow || todoWindow.isDestroyed()) {
      return { success: false, error: 'Window not available' };
    }
    
    const result = await dialog.showOpenDialog(todoWindow, {
      title: 'Выберите файл с задачами',
      filters: [
        { name: 'JSON файлы', extensions: ['json'] },
        { name: 'Все файлы', extensions: ['*'] }
      ],
      properties: ['openFile']
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: 'File not selected' };
    }
    
    const filePath = result.filePaths[0];
    const success = todoService.loadFromFile(filePath);
    if (success) {
      notifyTodosUpdated();
    }
    return { success, error: success ? null : 'Failed to load file' };
  });
  
  ipcMain.handle('load-demo-todos', () => {
    const demoPath = path.join(__dirname, 'demo-todos.json');
    const success = todoService.loadFromFile(demoPath);
    if (success) {
      notifyTodosUpdated();
    } else {
      todoService.ensureDemo();
      notifyTodosUpdated();
    }
    return success || true;
  });
  
  ipcMain.handle('load-large-demo', () => {
    const demoPath = path.join(__dirname, 'demo-todos-large.json');
    const success = todoService.loadFromFile(demoPath);
    if (success) {
      notifyTodosUpdated();
    }
    return success;
  });
  
  ipcMain.handle('capture-todo-screenshot', async () => {
    if (!todoWindow || todoWindow.isDestroyed()) {
      return null;
    }
    try {
      const image = await todoWindow.capturePage();
      return image.toPNG();
    } catch (err) {
      console.error('Failed to capture screenshot:', err);
      return null;
    }
  });
  
  ipcMain.handle('get-todo-hotkeys', () => {
    if (!currentSettings) currentSettings = readSettings();
    return currentSettings.todoHotkeys;
  });
  
  ipcMain.handle('set-todo-hotkeys', (_event, hotkeys) => {
    if (!currentSettings) currentSettings = readSettings();
    currentSettings.todoHotkeys = hotkeys;
    currentSettings = writeSettings(currentSettings);
    return currentSettings.todoHotkeys;
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
      // Пересчитываем размер окна при изменении уровня
      updateWindowSize();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('level-updated', level);
        // При изменении уровня также отправляем режим и счетчик
        const mode = getMode(currentSettings.mode || 'money');
        const modeData = {
          id: mode.id,
          name: mode.name,
          emoji: mode.emoji,
          symbol: mode.symbol,
          color: mode.color,
          unit: mode.unit,
          description: mode.description
        };
        if (level === 3) {
          mainWindow.webContents.send('mode-updated', modeData);
        }
        const modeId = currentSettings.mode || 'money';
        const formatted = getFormattedCounter(
          currentSettings.displayCounters || {},
          modeId
        );
        mainWindow.webContents.send('counter-updated', {
          mode: modeData,
          value: formatted,
          counter: currentSettings.displayCounters?.[modeId] || { value: 0, totalMinutes: 0 }
        });
      }
    }
    
    // Send mode update if changed
    if ('mode' in patch) {
      const mode = getMode(currentSettings.mode);
      // Отправляем только сериализуемые данные (без функций)
      const modeData = {
        id: mode.id,
        name: mode.name,
        emoji: mode.emoji,
        symbol: mode.symbol,
        color: mode.color,
        unit: mode.unit,
        description: mode.description
      };
      if (mainWindow && !mainWindow.isDestroyed()) {
        // Отправляем mode-updated для всех уровней
        mainWindow.webContents.send('mode-updated', modeData);
        // Также отправляем counter-updated с текущим значением (используем displayCounters)
        const modeId = currentSettings.mode || 'money';
        const formatted = getFormattedCounter(
          currentSettings.displayCounters || {},
          modeId
        );
        mainWindow.webContents.send('counter-updated', {
          mode: modeData,
          value: formatted,
          counter: currentSettings.displayCounters?.[modeId] || { value: 0, totalMinutes: 0 }
        });
      }
    }
    
    // Notify windows that update succeeded
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.webContents.send('settings-updated');
      settingsWindow.webContents.send('counters-updated', currentSettings.counters);
    }
    if (todoWindow && !todoWindow.isDestroyed()) {
      todoWindow.webContents.send('settings-updated', currentSettings);
    }
  });
}

function startCounterTimer() {
  if (counterInterval) {
    clearInterval(counterInterval);
  }
  
  if (!currentSettings) currentSettings = readSettings();
  if (!currentSettings.counters) currentSettings.counters = {};
  if (!currentSettings.displayCounters) currentSettings.displayCounters = {};
  
  cycleStartTime = Date.now();
  
  // Обновляем счетчик каждую минуту
  counterInterval = setInterval(() => {
    if (!currentSettings || !mainWindow || mainWindow.isDestroyed()) return;
    
    const modeId = currentSettings.mode || 'money';
    const mode = getMode(modeId);
    const elapsedMinutes = 1; // Каждый цикл = 1 минута
    
    // Обновляем статистику (накапливается, не сбрасывается)
    updateCounter(currentSettings.counters, modeId, elapsedMinutes);
    
    // Обновляем отображаемый счетчик (сбрасывается при нажатии горячей клавиши)
    if (!currentSettings.displayCounters[modeId]) {
      currentSettings.displayCounters[modeId] = { value: 0, totalMinutes: 0 };
    }
    const currentDisplayTotalMinutes = (currentSettings.displayCounters[modeId].totalMinutes || 0) + elapsedMinutes;
    const newDisplayValue = mode.formula(currentDisplayTotalMinutes);
    if (typeof newDisplayValue === 'object' && newDisplayValue.xp !== undefined) {
      currentSettings.displayCounters[modeId].value = newDisplayValue;
    } else {
      currentSettings.displayCounters[modeId].value = newDisplayValue;
    }
    currentSettings.displayCounters[modeId].totalMinutes = currentDisplayTotalMinutes;
    
    // Сохраняем настройки
    currentSettings = writeSettings(currentSettings);
    
    // Отправляем обновление в overlay (используем displayCounters)
    if (mainWindow && !mainWindow.isDestroyed()) {
      const formatted = getFormattedCounter(currentSettings.displayCounters, modeId);
      const modeData = {
        id: mode.id,
        name: mode.name,
        emoji: mode.emoji,
        symbol: mode.symbol,
        color: mode.color,
        unit: mode.unit,
        description: mode.description
      };
      mainWindow.webContents.send('counter-updated', {
        mode: modeData,
        value: formatted,
        counter: currentSettings.displayCounters[modeId] || { value: 0, totalMinutes: 0 }
      });
    }
    
    // Отправляем обновление в settings window (используем counters для статистики)
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

      // Сбрасываем только отображаемые счетчики (статистика не трогается)
      currentSettings.displayCounters = resetDisplayCounters();
      currentSettings = writeSettings(currentSettings);
      
      // Сбрасываем время начала цикла, чтобы счетчик инкрементировался в начале следующего цикла
      cycleStartTime = Date.now();
      
      // Перезапускаем таймер, чтобы следующий инкремент был в начале нового цикла
      startCounterTimer();
      
      // Обновляем overlay
      if (mainWindow && !mainWindow.isDestroyed()) {
        const modeId = currentSettings.mode || 'money';
        const formatted = getFormattedCounter(currentSettings.displayCounters || {}, modeId);
        const mode = getMode(modeId);
        const modeData = {
          id: mode.id,
          name: mode.name,
          emoji: mode.emoji,
          symbol: mode.symbol,
          color: mode.color,
          unit: mode.unit,
          description: mode.description
        };
        mainWindow.webContents.send('counter-updated', {
          mode: modeData,
          value: formatted,
          counter: currentSettings.displayCounters?.[modeId] || 0
        });
        mainWindow.webContents.send('restart-cycle');
      }
      
      // Обновляем settings window (статистика не меняется)
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
  createTodoWindow();
  createTray();
  
  startCounterTimer();
  registerResetHotkey();
  
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


