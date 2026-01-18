import { create } from 'zustand';
import { Settings } from '../types';
import { saveSettings, loadSettings } from '../utils/ipc';

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
    addSiblingTask: 'Shift+Enter', // Создать задачу того же уровня
    addSubtask: 'Ctrl+Enter',      // Создать подзадачу
    addRootTask: 'Ctrl+Shift+Enter', // Создать основную задачу
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
  isInitialized: boolean;
  setSettings: (settings: Settings) => void;
  updateSettings: (updates: Partial<Settings>) => void;
  loadSettingsAction: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isInitialized: false,
  
  setSettings: (settings) => set({ settings, isInitialized: true }),

  loadSettingsAction: async () => {
    const settings = await loadSettings();
    if (settings) {
      set({ settings, isInitialized: true });
    }
  },
  
  updateSettings: (updates) => {
    const { settings } = get();
    const newSettings = { ...settings, ...updates };
    
    // Deep merge for hotkeys
    if (updates.todoHotkeys) {
      newSettings.todoHotkeys = { ...settings.todoHotkeys, ...updates.todoHotkeys };
    }
    
    // Deep merge for levelSettings
    if (updates.levelSettings) {
      newSettings.levelSettings = { ...settings.levelSettings, ...updates.levelSettings };
    }

    set({ settings: newSettings });
    
    // CRITICAL: We only save to disk if this is the settings window 
    // or if we explicitly want to persist. 
    // In React version, we should rely on IPC to tell main process to save.
    saveSettings(newSettings);
  },
}));
