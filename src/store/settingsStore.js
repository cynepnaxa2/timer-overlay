const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const DEFAULT_SETTINGS = {
  diameterPx: 60,
  opacity: 0.55,
  colorHex: '#ff0000',
  durationSeconds: 60,
  stepped: false,
  autostart: false,
  showTray: true
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



