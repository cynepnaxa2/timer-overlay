const { getMode } = require('./config/modes');

function serializeMode(mode) {
  if (!mode) return null;
  return {
    id: mode.id,
    name: mode.name,
    emoji: mode.emoji,
    symbol: mode.symbol,
    color: mode.color,
    unit: mode.unit,
    description: mode.description
  };
}

module.exports = {
  serializeMode
};

