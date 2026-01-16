const state = require('./state');
const { getMode, serializeMode } = require('../config/modes');
const { updateCounter, getFormattedCounter, resetDisplayCounters } = require('../utils/counters');
const { writeSettings, readSettings } = require('../store/settingsStore.js.legacy');
const { globalShortcut } = require('electron');

function startCounterTimer() {
  if (state.counterInterval) {
    clearInterval(state.counterInterval);
  }
  
  if (!state.currentSettings) state.currentSettings = readSettings();
  if (!state.currentSettings.counters) state.currentSettings.counters = {};
  if (!state.currentSettings.displayCounters) state.currentSettings.displayCounters = {};
  
  state.cycleStartTime = Date.now();
  
  state.counterInterval = setInterval(() => {
    if (!state.currentSettings || !state.mainWindow || state.mainWindow.isDestroyed()) return;
    
    const modeId = state.currentSettings.mode || 'money';
    const mode = getMode(modeId);
    const elapsedMinutes = 1;
    
    updateCounter(state.currentSettings.counters, modeId, elapsedMinutes);
    
    if (!state.currentSettings.displayCounters[modeId]) {
      state.currentSettings.displayCounters[modeId] = { value: 0, totalMinutes: 0 };
    }
    const currentDisplayTotalMinutes = (state.currentSettings.displayCounters[modeId].totalMinutes || 0) + elapsedMinutes;
    const newDisplayValue = mode.formula(currentDisplayTotalMinutes);
    
    state.currentSettings.displayCounters[modeId].value = newDisplayValue;
    state.currentSettings.displayCounters[modeId].totalMinutes = currentDisplayTotalMinutes;
    
    state.currentSettings = writeSettings(state.currentSettings);
    
    if (state.mainWindow && !state.mainWindow.isDestroyed()) {
      const formatted = getFormattedCounter(state.currentSettings.displayCounters, modeId);
      const modeData = serializeMode(mode);
      state.mainWindow.webContents.send('counter-updated', {
        mode: modeData,
        value: formatted,
        counter: state.currentSettings.displayCounters[modeId] || { value: 0, totalMinutes: 0 }
      });
    }
    
    if (state.settingsWindow && !state.settingsWindow.isDestroyed()) {
      state.settingsWindow.webContents.send('counters-updated', state.currentSettings.counters);
    }
  }, state.currentSettings.durationSeconds * 1000);
}

function registerResetHotkey() {
  if (!state.currentSettings) state.currentSettings = readSettings();
  const hotkey = state.currentSettings.resetHotkey || 'Ctrl+Shift+R';
  
  if (state.resetHotkeyRegistered) {
    try {
      globalShortcut.unregister(hotkey);
      state.resetHotkeyRegistered = false;
    } catch {}
  }
  
  try {
    const registered = globalShortcut.register(hotkey, () => {
      if (!state.currentSettings) state.currentSettings = readSettings();

      state.currentSettings.displayCounters = resetDisplayCounters();
      state.currentSettings = writeSettings(state.currentSettings);
      
      state.cycleStartTime = Date.now();
      startCounterTimer();
      
      if (state.mainWindow && !state.mainWindow.isDestroyed()) {
        const modeId = state.currentSettings.mode || 'money';
        const formatted = getFormattedCounter(state.currentSettings.displayCounters || {}, modeId);
        const mode = getMode(modeId);
        const modeData = serializeMode(mode);
        state.mainWindow.webContents.send('counter-updated', {
          mode: modeData,
          value: formatted,
          counter: state.currentSettings.displayCounters?.[modeId] || 0
        });
        state.mainWindow.webContents.send('restart-cycle');
      }
      
      if (state.settingsWindow && !state.settingsWindow.isDestroyed()) {
        state.settingsWindow.webContents.send('counters-updated', state.currentSettings.counters);
      }
    });
    
    if (registered) {
      state.resetHotkeyRegistered = true;
    }
  } catch (err) {
    console.error('Error registering reset hotkey:', err);
  }
}

module.exports = {
  startCounterTimer,
  registerResetHotkey
};

