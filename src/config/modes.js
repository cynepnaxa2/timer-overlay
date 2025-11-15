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
    description: 'Каждый цикл +$1'
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
    description: 'Каждый цикл +1 лайк'
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
    description: 'Каждый цикл +1 XP, каждые 60 XP = +1 уровень'
  },
  
  success: {
    id: 'success',
    name: 'Успех',
    emoji: '🚀',
    symbol: '🚀',
    color: '#FF6F00', // Оранжевый
    unit: 'клиентов',
    formula: (totalMinutes) => totalMinutes, // +1 клиент за цикл
    format: (value) => value,
    description: 'Каждый цикл +1 клиент'
  },
  
  health: {
    id: 'health',
    name: 'Здоровье',
    emoji: '⏰',
    symbol: '⏰',
    color: '#00BCD4', // Бирюзовый
    unit: 'минут омоложения',
    formula: (totalMinutes) => -totalMinutes, // -1 минута возраста за цикл
    format: (value) => Math.abs(value),
    description: 'Каждый цикл 1 минута омоложения'
  },
  
  sport: {
    id: 'sport',
    name: 'Спорт',
    emoji: '💪',
    symbol: '💪',
    color: '#2E7D32', // Темно-зеленый
    unit: 'г к силе',
    formula: (totalMinutes) => totalMinutes, // +1 грамм к силе за цикл
    format: (value) => value,
    description: 'Каждый цикл + 1 грамм к силе'
  },
  
  creativity: {
    id: 'creativity',
    name: 'Творчество',
    emoji: '🎨',
    symbol: '🎨',
    color: '#9C27B0', // Фиолетовый
    unit: 'идей',
    formula: (totalMinutes) => totalMinutes, // +1 идея за цикл
    format: (value) => value,
    description: 'Каждый цикл +1 идея'
  },
  
  learning: {
    id: 'learning',
    name: 'Обучение',
    emoji: '📚',
    symbol: '📚',
    color: '#1E88E5', // Синий
    unit: 'фактов / аргументов',
    formula: (totalMinutes) => totalMinutes, // +1 факт / аргумент за цикл
    format: (value) => value,
    description: 'Каждый цикл +1 факт / аргумент'
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

