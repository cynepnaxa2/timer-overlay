const { ipcMain, app, dialog, globalShortcut } = require('electron');
const state = require('./state');
const { readSettings, writeSettings } = require('../store/settingsStore.js.legacy');
const { getMode, getAllModes, serializeMode } = require('../config/modes');
const { getFormattedCounter, resetDisplayCounters } = require('../utils/counters');
const fs = require('fs');
const path = require('path');
const todoService = require('../services/todoService');
const { getTodosPath, readTodos } = require('../store/todoStore.js.legacy');

function registerIpcHandlers(windowManager, timerManager, trayManager) {
  ipcMain.handle('save-todos', (_event, todos) => {
    todoService.saveTodos(todos);
    notifyTodosUpdated();
    return true;
  });

  const notifySettingsUpdated = (settings) => {
    if (state.mainWindow && !state.mainWindow.isDestroyed()) {
      state.mainWindow.webContents.send('settings-updated', settings);
    }
    if (state.settingsWindow && !state.settingsWindow.isDestroyed()) {
      state.settingsWindow.webContents.send('settings-updated', settings);
    }
    if (state.todoWindow && !state.todoWindow.isDestroyed()) {
      state.todoWindow.webContents.send('settings-updated', settings);
    }
  };

  timerManager.setNotifyCallback(notifySettingsUpdated);

  ipcMain.handle('save-settings', async (_event, settings) => {
    // 1. Get current state (on disk/memory)
    const oldSettings = state.currentSettings || readSettings();
    
    // 2. Merge root level fields
    const newSettings = { 
      ...oldSettings, 
      ...settings 
    };
    
    // 3. Deep merge for nested objects ONLY if they exist in the incoming settings
    // This prevents partial updates from wiping out other keys in these objects
    if (settings.todoHotkeys) {
      newSettings.todoHotkeys = { 
        ...oldSettings.todoHotkeys, 
        ...settings.todoHotkeys 
      };
    }
    
    if (settings.levelSettings) {
      // Handle the fact that keys might be strings "1", "2" or numbers 1, 2
      newSettings.levelSettings = { 
        ...oldSettings.levelSettings, 
        ...settings.levelSettings 
      };
    }

    console.log('Saving settings to disk:', JSON.stringify(newSettings.todoHotkeys));

    // 4. Update memory and disk
    state.currentSettings = writeSettings(newSettings);
    
    // 5. Notify all windows and apply styles
    await windowManager.applyOverlayStyles();
    notifySettingsUpdated(state.currentSettings);

    // 6. Handle side effects
    if (settings.autostart !== undefined) {
      try {
        app.setLoginItemSettings({
          openAtLogin: settings.autostart,
          openAsHidden: false
        });
      } catch {}
    }
    
    if (settings.showTray !== undefined) {
      trayManager.updateTrayVisibility(windowManager.createTodoWindow, windowManager.createSettingsWindow);
    }
    
    if (settings.durationSeconds !== undefined) {
      timerManager.startCounterTimer();
    }
    
    if (settings.resetHotkey !== undefined) {
      timerManager.registerResetHotkey();
    }

    return true;
  });

  ipcMain.handle('get-settings', () => {
    if (!state.currentSettings) {
      state.currentSettings = readSettings();
    }
    return state.currentSettings;
  });
  
  ipcMain.handle('get-autostart', () => {
    try {
      return app.getLoginItemSettings().openAtLogin;
    } catch {
      return false;
    }
  });
  
  ipcMain.handle('get-mode', () => {
    if (!state.currentSettings) state.currentSettings = readSettings();
    const mode = getMode(state.currentSettings.mode || 'money');
    return serializeMode(mode);
  });
  
  ipcMain.handle('get-modes', () => {
    const modes = getAllModes();
    return modes.map(serializeMode);
  });
  
  ipcMain.handle('get-current-counter', () => {
    if (!state.currentSettings) state.currentSettings = readSettings();
    const modeId = state.currentSettings.mode || 'money';
    if (state.currentSettings.displayCounters && state.currentSettings.displayCounters[modeId] !== undefined) {
      return {
        value: getFormattedCounter(state.currentSettings.displayCounters, modeId),
        counter: state.currentSettings.displayCounters[modeId]
      };
    }
    return null;
  });
  
  ipcMain.handle('reset-statistics', () => {
    if (!state.currentSettings) state.currentSettings = readSettings();
    state.currentSettings.counters = {};
    state.currentSettings = writeSettings(state.currentSettings);
    
    if (state.settingsWindow && !state.settingsWindow.isDestroyed()) {
      state.settingsWindow.webContents.send('counters-updated', state.currentSettings.counters);
    }
    return true;
  });
  
  ipcMain.handle('get-todos', () => {
    return todoService.getTodos();
  });
  
  const notifyTodosUpdated = () => {
    if (state.todoWindow && !state.todoWindow.isDestroyed()) {
      state.todoWindow.webContents.send('todos-updated', todoService.getTodos());
    }
  };
  
  ipcMain.handle('create-todo', (_event, content, parentId, afterId) => {
    const todo = todoService.createTodo(content, parentId, afterId);
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
    if (state.todoWindow && !state.todoWindow.isDestroyed()) {
      state.todoWindow.webContents.send('todos-updated', todos);
    }
    return todos;
  });
  
  ipcMain.handle('toggle-task-collapse', (_event, taskId) => {
    const updated = todoService.toggleCollapse(taskId);
    notifyTodosUpdated();
    return updated;
  });
  
  ipcMain.handle('toggle-subtask-type', (_event, taskId) => {
    const updated = todoService.toggleSubtaskType(taskId);
    notifyTodosUpdated();
    return updated;
  });
  
  ipcMain.handle('start-timer', (_event, motivationWord) => {
    timerManager.startCounterTimer(true);
    
    if (state.mainWindow && !state.mainWindow.isDestroyed()) {
      state.mainWindow.webContents.send('restart-cycle');
      if (motivationWord) {
        state.mainWindow.webContents.send('timer-started', { motivationWord });
      }
    }
    return true;
  });
  
  ipcMain.handle('load-todos-from-file', async () => {
    if (!state.todoWindow || state.todoWindow.isDestroyed()) {
      return { success: false, error: 'Window not available' };
    }
    
    const result = await dialog.showOpenDialog(state.todoWindow, {
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
    const demoPath = path.join(__dirname, '..', '..', 'demo-todos.json');
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
    const demoPath = path.join(__dirname, '..', '..', 'demo-todos-large.json');
    const success = todoService.loadFromFile(demoPath);
    if (success) {
      notifyTodosUpdated();
    }
    return success;
  });
  
  ipcMain.handle('capture-todo-screenshot', async () => {
    if (!state.todoWindow || state.todoWindow.isDestroyed()) return null;
    try {
      const image = await state.todoWindow.capturePage();
      return image.toPNG();
    } catch (err) {
      console.error('Failed to capture screenshot:', err);
      return null;
    }
  });
  
  ipcMain.handle('select-sync-folder', async (_event, options) => {
    if (!state.settingsWindow || state.settingsWindow.isDestroyed()) {
      return null;
    }

    const copyCurrentFile = options && options.copyCurrentFile === true;
    if (copyCurrentFile) {
      const currentPath = getTodosPath();
      if (fs.existsSync(currentPath)) {
        const currentTodos = readTodos();
        const result = await dialog.showOpenDialog(state.settingsWindow, {
          title: 'Выберите папку для синхронизации',
          properties: ['openDirectory']
        });
        if (result.canceled || result.filePaths.length === 0) {
          return null;
        }
        const newPath = result.filePaths[0];
        fs.mkdirSync(newPath, { recursive: true });
        fs.writeFileSync(
          path.join(newPath, 'todos.json'),
          JSON.stringify(currentTodos, null, 2),
          'utf8'
        );
        if (!state.currentSettings) state.currentSettings = readSettings();
        state.currentSettings.syncFolderPath = newPath;
        state.currentSettings = writeSettings(state.currentSettings);
        notifyTodosUpdated();
        return newPath;
      }
    }

    const result = await dialog.showOpenDialog(state.settingsWindow, {
      title: 'Выберите папку для синхронизации',
      properties: ['openDirectory']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const newPath = result.filePaths[0];

    // Update settings with new path
    if (!state.currentSettings) state.currentSettings = readSettings();
    state.currentSettings.syncFolderPath = newPath;
    state.currentSettings = writeSettings(state.currentSettings);

    // Notify all windows that todos might have changed
    notifyTodosUpdated();

    return newPath;
  });
}

module.exports = {
  registerIpcHandlers
};

