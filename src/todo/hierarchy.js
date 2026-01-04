function calculateLevel(task, todos) {
  if (!task.parentId) return 0;
  const parent = todos.find(t => t.id === task.parentId);
  return parent ? calculateLevel(parent, todos) + 1 : 0;
}

function isTaskVisible(task, todos, showCompleted = false) {
  if (!task.parentId) {
    return showCompleted || !task.completed;
  }
  const parent = todos.find(t => t.id === task.parentId);
  // Задача видима, если родитель существует, не свернут и (мы показываем выполненные ИЛИ задача не завершена)
  const isSelfVisible = showCompleted || !task.completed;
  return isSelfVisible && (!parent || (!parent.collapsed && (showCompleted || !parent.completed) && isTaskVisible(parent, todos, showCompleted)));
}

function hasChildren(task, todos, showCompleted = false) {
  return todos.some(t => t.parentId === task.id && (showCompleted || !t.completed));
}

function getLastVisibleDescendant(task, todos, showCompleted = false) {
  if (task.collapsed) return task;
  const children = todos.filter(t => t.parentId === task.id && (showCompleted || !t.completed) && isTaskVisible(t, todos, showCompleted))
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  return children.length === 0 ? task : getLastVisibleDescendant(children[children.length - 1], todos, showCompleted);
}

function getAllDescendants(taskId, todos) {
  const descendants = [];
  const children = todos.filter(t => t.parentId === taskId && !t.completed);
  children.forEach(child => {
    descendants.push(child.id);
    descendants.push(...getAllDescendants(child.id, todos));
  });
  return descendants;
}

function isDescendant(ancestorId, taskId, todos) {
  const task = todos.find(t => t.id === taskId);
  if (!task || !task.parentId) return false;
  if (task.parentId === ancestorId) return true;
  return isDescendant(ancestorId, task.parentId, todos);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateLevel,
    isTaskVisible,
    hasChildren,
    getLastVisibleDescendant,
    getAllDescendants,
    isDescendant
  };
} else {
  window.todoHierarchy = {
    calculateLevel,
    isTaskVisible,
    hasChildren,
    getLastVisibleDescendant,
    getAllDescendants,
    isDescendant
  };
}

