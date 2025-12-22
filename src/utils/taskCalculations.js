function calculateVariantTime(variant) {
  if (!variant || !variant.steps) {
    return 0;
  }
  return variant.steps
    .filter(step => step.checked)
    .reduce((sum, step) => sum + (step.time || 0), 0);
}

function calculateTaskTime(task, todos) {
  if (!task) {
    return 0;
  }
  
  if (!task.variants || task.variants.length === 0) {
    const children = todos.filter(t => t.parentId === task.id && !t.deletedAt);
    return children.reduce((sum, child) => sum + calculateTaskTime(child, todos), 0);
  }
  
  const selectedVariant = task.variants.find(v => v.selected);
  if (selectedVariant) {
    return calculateVariantTime(selectedVariant);
  }
  
  const variantTimes = task.variants.map(v => calculateVariantTime(v));
  if (variantTimes.length === 0) {
    return 0;
  }
  return Math.min(...variantTimes);
}

function calculateROI(task, todos) {
  if (!task || !task.gain || task.gain === 0) {
    return null;
  }
  
  if (task.gainUnit !== 'money') {
    return null;
  }
  
  const totalTime = calculateTaskTime(task, todos);
  if (totalTime === 0) {
    return null;
  }
  
  return task.gain / totalTime;
}

function getGainUnit(task, todos) {
  if (!task || !task.parentId) {
    return null;
  }
  
  const parent = todos.find(t => t.id === task.parentId);
  if (!parent) {
    return null;
  }
  
  if (!parent.content) {
    return null;
  }
  
  if (parent.content.includes('💰') || parent.content.includes('Деньги')) {
    return 'money';
  }
  if (parent.content.includes('❤️') || parent.content.includes('Здоровье')) {
    return 'health';
  }
  if (parent.content.includes('😊') || parent.content.includes('Счастье')) {
    return 'happiness';
  }
  if (parent.content.includes('⏱️') || parent.content.includes('Время')) {
    return 'time';
  }
  
  return getGainUnit(parent, todos);
}

function getGainUnit(task, todos) {
  if (!task || !task.parentId) {
    return null;
  }
  
  const parent = todos.find(t => t.id === task.parentId);
  if (!parent) {
    return null;
  }
  
  if (!parent.content) {
    return null;
  }
  
  if (parent.content.includes('💰') || parent.content.includes('Деньги')) {
    return 'money';
  }
  if (parent.content.includes('❤️') || parent.content.includes('Здоровье')) {
    return 'health';
  }
  if (parent.content.includes('😊') || parent.content.includes('Счастье')) {
    return 'happiness';
  }
  if (parent.content.includes('⏱️') || parent.content.includes('Время')) {
    return 'time';
  }
  
  return getGainUnit(parent, todos);
}

module.exports = {
  calculateVariantTime,
  calculateTaskTime,
  calculateROI,
  getGainUnit
};

