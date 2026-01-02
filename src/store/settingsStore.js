const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { getDefaultMode } = require('../config/modes');

const DEFAULT_SETTINGS = {
  diameterPx: 60,
  opacity: 0.55,
  colorHex: '#ff0000',
  durationSeconds: 60,
  stepped: false,
  autostart: false,
  showTray: true,
  mode: getDefaultMode(), // Режим мотивации
  counters: {}, // Статистика по режимам: { modeId: { value, totalMinutes } } - накапливается, не сбрасывается
  displayCounters: {}, // Отображаемые счетчики: { modeId: value } - сбрасываются при нажатии горячей клавиши
  level: 1, // Уровень отображения: 1 - базовый (круг), 2 - продвинутый (цифры), 3 - эксперт (символ+цифры+единица)
  levelSettings: {
    1: { showCircle: true, showSymbol: false, showCounter: false, showUnit: false },
    2: { showCircle: false, showSymbol: false, showCounter: true, showUnit: false },
    3: { showCircle: false, showSymbol: true, showCounter: true, showUnit: true }
  },
  resetHotkey: 'Ctrl+Shift+R', // Горячая клавиша для сброса счетчиков
  todoHotkeys: {
    addSubtask: 'Ctrl+Enter',
    addRootTask: 'Shift+Enter',
    execute: 'Ctrl+Space',
    complete: 'Delete'
  }
};

function getSettingsPath() {
  const dir = app.getPath('userData');
  return path.join(dir, 'settings.json');
}

function readSettings() {
  try {
    const file = getSettingsPath();
    if (!fs.existsSync(file)) {
      return { ...DEFAULT_SETTINGS };
    }
    const raw = fs.readFileSync(file, 'utf8');
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function writeSettings(settings) {
  const file = getSettingsPath();
  try {
    const merged = { ...DEFAULT_SETTINGS, ...settings };
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(merged, null, 2), 'utf8');
    return merged;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function isFirstRun() {
  const file = getSettingsPath();
  return !fs.existsSync(file);
}

module.exports = {
  DEFAULT_SETTINGS,
  readSettings,
  writeSettings,
  isFirstRun
};



