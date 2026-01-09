export enum ResourceType {
  TIME = 'TIME',
  MONEY = 'MONEY',
  HEALTH = 'HEALTH',
  COMFORT = 'COMFORT',
  EMOTIONS = 'EMOTIONS',
  NETWORK = 'NETWORK',
  MEANING = 'MEANING'
}

export enum TransactionType {
  LOSS = 'LOSS',
  COST = 'COST',
  PROFIT = 'PROFIT'
}

export const RESOURCES = {
  [ResourceType.TIME]: { key: ResourceType.TIME, name: 'ВРЕМЯ', emoji: '⏳', color: '#F1FA8C' },
  [ResourceType.MONEY]: { key: ResourceType.MONEY, name: 'ДЕНЬГИ', emoji: '💰', color: '#F1FA8C' },
  [ResourceType.HEALTH]: { key: ResourceType.HEALTH, name: 'ЗДОРОВЬЕ', emoji: '🧬', color: '#F1FA8C' },
  [ResourceType.COMFORT]: { key: ResourceType.COMFORT, name: 'КОМФОРТ', emoji: '🛋️', color: '#F1FA8C' },
  [ResourceType.EMOTIONS]: { key: ResourceType.EMOTIONS, name: 'ЭМОЦИИ', emoji: '❤️', color: '#F1FA8C' },
  [ResourceType.NETWORK]: { key: ResourceType.NETWORK, name: 'СВЯЗИ', emoji: '🤝', color: '#F1FA8C' },
  [ResourceType.MEANING]: { key: ResourceType.MEANING, name: 'СМЫСЛ', emoji: '⭐', color: '#F1FA8C' },
};

export const TRANSACTIONS = {
  [TransactionType.LOSS]: { key: TransactionType.LOSS, name: 'ШТРАФ', color: '#A05A2C' },
  [TransactionType.COST]: { key: TransactionType.COST, name: 'ЗАТРАТЫ', color: '#FF5555' },
  [TransactionType.PROFIT]: { key: TransactionType.PROFIT, name: 'ПРОФИТ', color: '#50FA7B' },
};

export const RESOURCE_TOOLTIPS = {
  [ResourceType.TIME]: {
    [TransactionType.LOSS]: { 0: 'Ничего', 1: 'Минута', 2: '15 мин', 3: '2 часа', 4: '2 дня', 5: 'Неделя', 6: 'Квартал', 7: '2 года', 8: '20 лет', 9: 'Вечность' },
    [TransactionType.COST]: { 0: 'Мгновенно', 1: '5 мин', 2: '30 мин', 3: '3 часа', 4: '2 дня', 5: 'Неделя', 6: '3 месяца', 7: '3 года', 8: '20 лет', 9: 'Жизнь' },
    [TransactionType.PROFIT]: { 0: 'Ничего', 1: 'Минута', 2: '15 мин', 3: '2 часа', 4: 'Пару дней', 5: 'Неделя', 6: 'Квартал', 7: 'Годы', 8: '20 лет', 9: 'Бессмертие' }
  },
  [ResourceType.MONEY]: {
    [TransactionType.LOSS]: { 0: '0', 1: '10', 2: '100', 3: '1k', 4: '10k', 5: '100k', 6: '1m', 7: '10m', 8: '100m', 9: '1b' },
    [TransactionType.COST]: { 0: '0', 1: '10', 2: '100', 3: '1k', 4: '10k', 5: '100k', 6: '1m', 7: '10m', 8: '100m', 9: '1b' },
    [TransactionType.PROFIT]: { 0: '0', 1: '10', 2: '100', 3: '1k', 4: '10k', 5: '100k', 6: '1m', 7: '10m', 8: '100m', 9: '1b' }
  },
  [ResourceType.HEALTH]: {
    [TransactionType.LOSS]: { 0: 'Нет', 1: 'Затекла шея', 2: 'Усталость', 3: 'Похмелье', 4: 'Грипп', 5: 'Перелом', 6: 'Хроника', 7: 'Инвалидность', 8: 'Кома', 9: 'Смерть' },
    [TransactionType.COST]: { 0: 'Не устану', 1: 'Встать', 2: 'Прогулка', 3: 'Попотеть', 4: 'Изнеможение', 5: 'Травматизм', 6: 'На износ', 7: 'Орган', 8: 'Жертва', 9: 'Миссия' },
    [TransactionType.PROFIT]: { 0: 'Нет', 1: 'Потянулся', 2: 'Душ', 3: 'Бодрость', 4: 'Лечение', 5: 'Санаторий', 6: 'Излечение', 7: 'Спасение', 8: 'Олимп', 9: 'Киборг' }
  },
  [ResourceType.COMFORT]: {
    [TransactionType.LOSS]: { 0: 'Ок', 1: 'Соринка', 2: 'Жмет', 3: 'Шум', 4: 'Стресс', 5: 'Страдание', 6: 'Нет жилья', 7: 'Улица', 8: 'Пытка', 9: 'Ад' },
    [TransactionType.COST]: { 0: 'Приятно', 1: 'Лень', 2: 'Звонок', 3: 'Час', 4: 'День', 5: 'Неделя', 6: 'Аскеза', 7: 'Казарма', 8: 'Пытка', 9: 'Муки' },
    [TransactionType.PROFIT]: { 0: 'Нет', 1: 'Очки', 2: 'Фикс', 3: 'Апгрейд', 4: 'Климат', 5: 'Быт', 6: 'Квартира', 7: 'Люкс', 8: 'Яхта', 9: 'Рай' }
  },
  [ResourceType.EMOTIONS]: {
    [TransactionType.LOSS]: { 0: 'Ок', 1: 'Игнор', 2: 'Обида', 3: 'Ссора', 4: 'Конфликт', 5: 'Разрыв', 6: 'Развод', 7: 'Вражда', 8: 'Месть', 9: 'Одиночество' },
    [TransactionType.COST]: { 0: 'Радость', 1: 'Смайлик', 2: 'Звонок', 3: 'Уступить', 4: 'Вина', 5: 'Уход', 6: 'Труд', 7: 'Карьера', 8: 'Отречение', 9: 'Жертва' },
    [TransactionType.PROFIT]: { 0: 'Нет', 1: 'Внимание', 2: 'Тепло', 3: 'Близость', 4: 'Событие', 5: 'Этап', 6: 'Союз', 7: 'Семья', 8: 'Клан', 9: 'Любовь' }
  },
  [ResourceType.NETWORK]: {
    [TransactionType.LOSS]: { 0: 'Пофиг', 1: 'Забудут', 2: 'Неловкость', 3: 'Подвел', 4: 'Доверие', 5: 'Скандал', 6: 'Разрыв', 7: 'Метка', 8: 'Изгнание', 9: 'Враг' },
    [TransactionType.COST]: { 0: 'Нет', 1: 'Напомнить', 2: 'Услуга', 3: 'Напрячь', 4: 'Должник', 5: 'Блат', 6: 'Риск', 7: 'Ва-банк', 8: 'Шантаж', 9: 'Душа' },
    [TransactionType.PROFIT]: { 0: 'Никто', 1: 'Знакомый', 2: 'Врач', 3: 'Менеджер', 4: 'Владелец', 5: 'Власть', 6: 'Элита', 7: 'Правитель', 8: 'Геополитик', 9: 'Мир' }
  },
  [ResourceType.MEANING]: {
    [TransactionType.LOSS]: { 0: 'Пофиг', 1: 'Скука', 2: 'Мысль', 3: 'Совесть', 4: 'Застой', 5: 'Квалификация', 6: 'Крах', 7: 'Кризис', 8: 'Смысл', 9: 'Распад' },
    [TransactionType.COST]: { 0: 'Автомат', 1: 'Запись', 2: 'Подумать', 3: 'Поток', 4: 'Штурм', 5: 'Кранч', 6: 'Напряжение', 7: 'Аскеза', 8: 'Идея', 9: 'Сожжение' },
    [TransactionType.PROFIT]: { 0: 'Нет', 1: 'Идея', 2: 'Действие', 3: 'Результат', 4: 'Продукт', 5: 'Успех', 6: 'Прорыв', 7: 'Наследие', 8: 'История', 9: 'Мир' }
  }
};

export const INITIAL_RESOURCE_MATRIX = {
  [TransactionType.LOSS]: { [ResourceType.TIME]: 0, [ResourceType.MONEY]: 0, [ResourceType.HEALTH]: 0, [ResourceType.COMFORT]: 0, [ResourceType.EMOTIONS]: 0, [ResourceType.NETWORK]: 0, [ResourceType.MEANING]: 0 },
  [TransactionType.COST]: { [ResourceType.TIME]: 0, [ResourceType.MONEY]: 0, [ResourceType.HEALTH]: 0, [ResourceType.COMFORT]: 0, [ResourceType.EMOTIONS]: 0, [ResourceType.NETWORK]: 0, [ResourceType.MEANING]: 0 },
  [TransactionType.PROFIT]: { [ResourceType.TIME]: 0, [ResourceType.MONEY]: 0, [ResourceType.HEALTH]: 0, [ResourceType.COMFORT]: 0, [ResourceType.EMOTIONS]: 0, [ResourceType.NETWORK]: 0, [ResourceType.MEANING]: 0 }
};
