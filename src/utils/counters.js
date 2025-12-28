const { getMode } = require('../config/modes');

/**
 * Обновить счетчик для режима
 */
function updateCounter(counters, modeId, minutes) {
  if (!counters[modeId]) {
    counters[modeId] = { value: 0, totalMinutes: 0 };
  }
  
  const mode = getMode(modeId);
  const currentTotalMinutes = (counters[modeId].totalMinutes || 0) + minutes;
  const newValue = mode.formula(currentTotalMinutes);
  
  // Для саморазвития формула возвращает объект {xp, level}
  if (typeof newValue === 'object' && newValue.xp !== undefined) {
    counters[modeId].value = newValue;
  } else {
    counters[modeId].value = newValue;
  }
  
  counters[modeId].totalMinutes = currentTotalMinutes;
  
  return counters;
}

/**
 * Получить отформатированное значение счетчика (для отображения)
 */
function getFormattedCounter(displayCounters, modeId) {
  const mode = getMode(modeId);
  
  if (!displayCounters || !displayCounters[modeId] || displayCounters[modeId].totalMinutes === 0) {
    return mode.format(0);
  }
  
  // Для саморазвития используем текущее значение напрямую
  if (modeId === 'selfDevelopment' && typeof displayCounters[modeId].value === 'object') {
    return mode.format(displayCounters[modeId].value);
  }
  
  return mode.format(displayCounters[modeId].value);
}

/**
 * Получить отформатированное значение статистики
 */
function getFormattedStats(counters, modeId) {
  const mode = getMode(modeId);
  
  if (!counters[modeId] || counters[modeId].totalMinutes === 0) {
    return mode.format(0);
  }
  
  // Для саморазвития используем текущее значение напрямую
  if (modeId === 'selfDevelopment' && typeof counters[modeId].value === 'object') {
    return mode.format(counters[modeId].value);
  }
  
  return mode.format(counters[modeId].value);
}

/**
 * Получить все счетчики с форматированием
 */
function getAllFormattedCounters(counters) {
  const { getAllModes } = require('../config/modes');
  const modes = getAllModes();
  const result = {};
  
  modes.forEach(mode => {
    result[mode.id] = {
      formatted: getFormattedCounter(counters, mode.id),
      value: counters[mode.id]?.value || 0,
      totalMinutes: counters[mode.id]?.totalMinutes || 0,
      mode: mode
    };
  });
  
  return result;
}

/**
 * Сбросить счетчик для режима
 */
function resetCounter(counters, modeId) {
  if (counters[modeId]) {
    counters[modeId] = { value: 0, totalMinutes: 0 };
  }
  return counters;
}

/**
 * Сбросить все отображаемые счетчики (статистика не трогается)
 */
function resetDisplayCounters() {
  return {};
}

module.exports = {
  updateCounter,
  getFormattedCounter,
  getFormattedStats,
  resetDisplayCounters
};

