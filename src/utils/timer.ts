export const calculateModeValue = (modeId: string, totalMinutes: number): any => {
  switch (modeId) {
    case 'money':
    case 'popularity':
    case 'success':
    case 'creativity':
    case 'learning':
    case 'sport':
      return totalMinutes;
    case 'health':
      return totalMinutes; // Legacy used -totalMinutes then Math.abs
    case 'selfDevelopment': {
      const xp = totalMinutes;
      const level = Math.floor(xp / 60) + 1;
      return { xp, level };
    }
    default:
      return totalMinutes;
  }
};

export const formatCounterValue = (modeId: string, value: any): string => {
  if (modeId === 'selfDevelopment' && typeof value === 'object') {
    return String(value.level);
  }
  return String(value);
};
