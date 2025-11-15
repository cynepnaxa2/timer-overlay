const { hexToRgb } = require('./color');
const { getMode } = require('../config/modes');

function buildOverlayCssVariables(settings) {
  const diameterPx = Number.isFinite(settings.diameterPx) ? settings.diameterPx : 60;
  const durationSeconds = Number.isFinite(settings.durationSeconds) ? settings.durationSeconds : 60;
  const opacity = Number.isFinite(settings.opacity) ? settings.opacity : 0.55;
  
  // Используем цвет режима, если не задан пользовательский цвет
  const mode = getMode(settings.mode || 'money');
  const colorHex = settings.colorHex || mode.color || '#ff0000';
  const { r, g, b } = hexToRgb(colorHex);
  const timing = settings.stepped ? 'steps(60, end)' : 'linear';
  
  // Цвет для тени и счетчика
  const shadowR = Math.min(255, r + 30);
  const shadowG = Math.min(255, g + 30);
  const shadowB = Math.min(255, b + 30);

  const css = [
    ':root {',
    `  --dot-size: ${Math.max(1, diameterPx)}px !important;`,
    `  --dot-color: rgba(${r}, ${g}, ${b}, ${Math.min(1, Math.max(0, opacity))}) !important;`,
    `  --shadow-color: rgba(${shadowR}, ${shadowG}, ${shadowB}, 0.7) !important;`,
    `  --counter-color: rgba(${r}, ${g}, ${b}, 0.9) !important;`,
    `  --duration: ${Math.max(1, durationSeconds)}s !important;`,
    `  --timing: ${timing} !important;`,
    '}',
    'html {',
    `  --dot-size: ${Math.max(1, diameterPx)}px !important;`,
    `  --dot-color: rgba(${r}, ${g}, ${b}, ${Math.min(1, Math.max(0, opacity))}) !important;`,
    `  --shadow-color: rgba(${shadowR}, ${shadowG}, ${shadowB}, 0.7) !important;`,
    `  --counter-color: rgba(${r}, ${g}, ${b}, 0.9) !important;`,
    `  --duration: ${Math.max(1, durationSeconds)}s !important;`,
    `  --timing: ${timing} !important;`,
    '}'
  ].join('\n');
  return css;
}

module.exports = {
  buildOverlayCssVariables
};



