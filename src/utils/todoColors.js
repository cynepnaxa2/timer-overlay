const COLORS = [
  '#8B00FF',
  '#0000FF',
  '#00FFFF',
  '#00FF00',
  '#FFFF00',
  '#FF7F00',
  '#FF0000'
];

function getColorForLevel(level) {
  if (level < 0) return COLORS[0];
  if (level >= COLORS.length) return COLORS[COLORS.length - 1];
  return COLORS[level];
}

module.exports = {
  getColorForLevel,
  COLORS
};
