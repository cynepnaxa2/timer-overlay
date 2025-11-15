/**
 * Конфигурация режимов мотивации
 * Каждый режим имеет символ, иконку, цвет, формулу подсчета и единицы измерения
 */

const MODES = {
  money: {
    id: 'money',
    name: 'Деньги',
    emoji: '💵',
    symbol: '$', // Символ для отображения
    color: '#00C853', // Зеленый
    unit: '$',
    formula: (totalMinutes) => totalMinutes, // +$1 за минуту
    format: (value) => value,
    description: 'Каждая минута = +$1'
  },
  
  popularity: {
    id: 'popularity',
    name: 'Популярность',
    emoji: '👍',
    symbol: '👍',
    color: '#E91E63', // Розовый/Красный
    unit: '👍',
    formula: (totalMinutes) => totalMinutes, // +1 лайк за минуту
    format: (value) => value,
    description: 'Каждая минута = +1 лайк'
  },
  
  selfDevelopment: {
    id: 'selfDevelopment',
    name: 'Саморазвитие',
    emoji: '⬆️',
    symbol: '⬆️',
    color: '#3F51B5', // Синий
    unit: 'Level',
    formula: (totalMinutes) => {
      const xp = totalMinutes;
      const level = Math.floor(xp / 60) + 1;
      return { xp, level };
    },
    format: (value) => {
      if (typeof value === 'object' && value.xp !== undefined) {
        return value.level;
      }
      // Fallback для числового значения
      const level = Math.floor((value || 0) / 60) + 1;
      return level;
    },
    description: 'Каждая минута = +1 XP, каждые 60 XP = +1 уровень'
  },
  
  success: {
    id: 'success',
    name: 'Успех',
    emoji: '🚀',
    symbol: '🚀',
    color: '#FF6F00', // Оранжевый
    unit: 'Очков успеха',
    formula: (totalMinutes) => totalMinutes, // +1 очко за минуту
    format: (value) => value,
    description: 'Каждая минута = +1 очко успеха'
  },
  
  health: {
    id: 'health',
    name: 'Здоровье',
    emoji: '⏰',
    symbol: '⏰',
    color: '#00BCD4', // Бирюзовый
    unit: 'мин',
    formula: (totalMinutes) => -totalMinutes, // -1 минута возраста за минуту работы
    format: (value) => Math.abs(value),
    description: 'Каждая минута = -1 минута возраста (помолодел)'
  },
  
  sport: {
    id: 'sport',
    name: 'Спорт',
    emoji: '💪',
    symbol: '💪',
    color: '#2E7D32', // Темно-зеленый
    unit: 'г',
    formula: (totalMinutes) => totalMinutes, // +1 грамм мышц за минуту
    format: (value) => value,
    description: 'Каждая минута = +1 грамм мышц'
  },
  
  creativity: {
    id: 'creativity',
    name: 'Творчество',
    emoji: '🎨',
    symbol: '🎨',
    color: '#9C27B0', // Фиолетовый
    unit: 'Мастерство',
    formula: (totalMinutes) => totalMinutes, // +1 единица мастерства за минуту
    format: (value) => value,
    description: 'Каждая минута = +1 единица мастерства'
  },
  
  learning: {
    id: 'learning',
    name: 'Обучение',
    emoji: '📚',
    symbol: '📚',
    color: '#1E88E5', // Синий
    unit: 'Знаний',
    formula: (totalMinutes) => totalMinutes, // +1 знание за минуту
    format: (value) => value,
    description: 'Каждая минута = +1 знание'
  }
};

/**
 * Получить режим по ID
 */
function getMode(modeId) {
  return MODES[modeId] || MODES.money;
}

/**
 * Получить все режимы
 */
function getAllModes() {
  return Object.values(MODES);
}

/**
 * Получить режим по умолчанию
 */
function getDefaultMode() {
  return MODES.money.id;
}

module.exports = {
  MODES,
  getMode,
  getAllModes,
  getDefaultMode
};

