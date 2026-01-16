import { create } from 'zustand';
import { Settings } from '../types';
import { saveSettings } from '../utils/ipc';

export const DEFAULT_SETTINGS: Settings = {
  diameterPx: 60,
  opacity: 0.55,
  colorHex: '#ff0000',
  durationSeconds: 60,
  stepped: false,
  autostart: false,
  showTray: true,
  mode: 'money',
  counters: {},
  displayCounters: {},
  level: 1,
  levelSettings: {
    1: { showCircle: true, showSymbol: false, showCounter: false, showUnit: false },
    2: { showCircle: false, showSymbol: false, showCounter: true, showUnit: false },
    3: { showCircle: false, showSymbol: true, showCounter: true, showUnit: true }
  },
  resetHotkey: 'Ctrl+Shift+R',
  todoHotkeys: {
    addSubtask: 'Ctrl+Enter',
    addRootTask: 'Shift+Enter',
    addSiblingTask: 'Enter',
    execute: 'Ctrl+Space',
    complete: 'Delete',
    navNext: 'Alt+Down',
    navPrev: 'Alt+Up',
    navChild: 'Alt+Right',
    navParent: 'Alt+Left'
  },
  syncFolderPath: null
};

interface SettingsState {
  settings: Settings;
  setSettings: (settings: Settings) => void;
  updateSettings: (updates: Partial<Settings>) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  
  setSettings: (settings) => set({ settings }),
  
  updateSettings: (updates) => {
    const { settings } = get();
    const newSettings = { ...settings, ...updates };
    
    // Deep merge for hotkeys if they are in updates
    if (updates.todoHotkeys) {
      newSettings.todoHotkeys = { ...settings.todoHotkeys, ...updates.todoHotkeys };
    }
    
    // Deep merge for levelSettings if they are in updates
    if (updates.levelSettings) {
      newSettings.levelSettings = { ...settings.levelSettings, ...updates.levelSettings };
    }

    set({ settings: newSettings });
    saveSettings(newSettings);
  },
}));
