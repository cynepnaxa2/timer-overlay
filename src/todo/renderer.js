const COLORS = ['#8B00FF', '#0000FF', '#00FFFF', '#00FF00', '#FFFF00', '#FF7F00', '#FF0000'];

function getColorForLevel(level) {
  if (level < 0) return COLORS[0];
  if (level >= COLORS.length) return COLORS[COLORS.length - 1];
  return COLORS[level];
}

function calculateLevel(task, todos) {
  if (!task.parentId) return 0;
  const parent = todos.find(t => t.id === task.parentId);
  if (!parent) return 0;
  return calculateLevel(parent, todos) + 1;
}

function renderTask(task, todos, container) {
  const level = calculateLevel(task, todos);
  const color = getColorForLevel(level);
  
  const taskEl = document.createElement('div');
  taskEl.className = 'task';
  taskEl.dataset.taskId = task.id;
  taskEl.style.color = color;
  
  const contentEl = document.createElement('div');
  contentEl.className = 'task-content';
  contentEl.contentEditable = 'true';
  contentEl.innerHTML = task.content || '';
  
  taskEl.appendChild(contentEl);
  container.appendChild(taskEl);
  
  const children = todos.filter(t => t.parentId === task.id && !t.completed);
  children.sort((a, b) => (a.order || 0) - (b.order || 0));
  children.forEach(child => renderTask(child, todos, container));
}

function renderTasks(todos) {
  const container = document.getElementById('todo-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  const rootTasks = todos.filter(t => !t.parentId && !t.completed);
  rootTasks.sort((a, b) => (a.order || 0) - (b.order || 0));
  
  rootTasks.forEach(task => renderTask(task, todos, container));
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { renderTasks, renderTask, calculateLevel };
} else {
  window.todoRenderer = { renderTasks, renderTask, calculateLevel };
}
