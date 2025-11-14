const { hexToRgb } = require('./color');

function buildOverlayCssVariables(settings) {
  const diameterPx = Number.isFinite(settings.diameterPx) ? settings.diameterPx : 20;
  const durationSeconds = Number.isFinite(settings.durationSeconds) ? settings.durationSeconds : 60;
  const opacity = Number.isFinite(settings.opacity) ? settings.opacity : 0.55;
  const { r, g, b } = hexToRgb(settings.colorHex || '#ff0000');
  const timing = settings.stepped ? 'steps(60, end)' : 'linear';

  const css = [
    ':root {',
    `  --dot-size: ${Math.max(1, diameterPx)}px !important;`,
    `  --dot-color: rgba(${r}, ${g}, ${b}, ${Math.min(1, Math.max(0, opacity))}) !important;`,
    `  --duration: ${Math.max(1, durationSeconds)}s !important;`,
    `  --timing: ${timing} !important;`,
    '}',
    'html {',
    `  --dot-size: ${Math.max(1, diameterPx)}px !important;`,
    `  --dot-color: rgba(${r}, ${g}, ${b}, ${Math.min(1, Math.max(0, opacity))}) !important;`,
    `  --duration: ${Math.max(1, durationSeconds)}s !important;`,
    `  --timing: ${timing} !important;`,
    '}'
  ].join('\n');
  return css;
}

module.exports = {
  buildOverlayCssVariables
};



