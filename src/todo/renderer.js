const hierarchy = typeof window !== 'undefined' && window.todoHierarchy 
  ? window.todoHierarchy 
  : require('./hierarchy');
const dragDrop = typeof window !== 'undefined' && window.todoDragDrop 
  ? window.todoDragDrop 
  : require('./dragDrop');
const richEditor = typeof window !== 'undefined' && window.richEditor 
  ? window.richEditor 
  : require('../utils/richEditor');
const hierarchyLines = typeof window !== 'undefined' && window.todoHierarchyLines 
  ? window.todoHierarchyLines 
  : require('./hierarchyLines');

function removeActiveFromAllTasks() {
  document.querySelectorAll('.task').forEach(t => t.classList.remove('active'));
}

function activateTask(taskEl, taskId, state) {
  removeActiveFromAllTasks();
  taskEl.classList.add('active');
  state.activeTaskId = taskId;
}

function updateExpanderIcon(iconEl, task, todos) {
  const hasChildrenTasks = hierarchy.hasChildren(task, todos);
  
  // Иконка самой задачи определяется типом подзадач её родителя
  const parent = task.parentId ? todos.find(t => t.id === task.parentId) : null;
  const parentSubtaskType = parent ? parent.subtaskType : 'list';

  if (!hasChildrenTasks) {
    iconEl.textContent = parentSubtaskType === 'variants' ? '⇄' : '☰';
    iconEl.style.fontSize = '12px';
  } else if (task.collapsed) {
    iconEl.textContent = '▶';
    iconEl.style.fontSize = '12px';
  } else {
    iconEl.textContent = '▼';
    iconEl.style.fontSize = '12px';
  }
  iconEl.style.lineHeight = '1';
}

function createTaskExpander(task, todos, state, renderTasks) {
  const expanderEl = document.createElement('div');
  expanderEl.className = 'task-expander';
  expanderEl.dataset.taskId = task.id;
  expanderEl.style.marginLeft = `${8 + hierarchy.calculateLevel(task, todos) * 9}px`;
  
  const iconEl = document.createElement('div');
  iconEl.className = 'task-expander-icon';
  updateExpanderIcon(iconEl, task, todos);
  expanderEl.appendChild(iconEl);
  
  if (hierarchy.hasChildren(task, todos)) {
    expanderEl.addEventListener('click', async (e) => {
      e.stopPropagation();
      await window.todoApi.toggleTaskCollapse(task.id);
      const todos = await window.todoApi.getTodos();
      renderTasks(todos, false, state);
    });
  }
  
  return expanderEl;
}

function createTaskActions(task, state, refreshTodos, focusTask) {
  const taskId = task.id;
  const actionsEl = document.createElement('div');
  actionsEl.className = 'task-actions';
  
  const buttons = [
    { text: '+', title: 'Добавить подзадачу', action: async () => {
      await createAndFocusTask(taskId, state, refreshTodos);
    }},
    { text: '▶', title: 'Выполнить', action: () => {
      const t = state.currentTodos.find(item => item.id === taskId);
      if (window.todoApi && t) {
        window.todoApi.startTimer(t.motivationWord || null);
      }
    }},
    { text: '✓', title: 'Выполнено', action: async () => {
      await window.todoApi.updateTodo(taskId, { completed: true, completedAt: Date.now() });
      await refreshTodos(state);
    }},
    { text: '↵', title: 'Создать соседнюю задачу', action: async () => {
      const parentId = task.parentId || null;
      await createAndFocusTask(parentId, state, refreshTodos);
    }},
    { 
      text: task.subtaskType === 'variants' ? '☰' : '⇄', 
      title: task.subtaskType === 'variants' ? 'Сменить на список' : 'Сменить на варианты', 
      action: async () => {
        await window.todoApi.toggleSubtaskType(taskId);
        await refreshTodos(state);
      }
    }
  ];
  
  buttons.forEach(({ text, title, action }) => {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.title = title;
    btn.onclick = (e) => {
      e.stopPropagation();
      if (window.todoApi) action();
    };
    actionsEl.appendChild(btn);
  });
  
  return actionsEl;
}

function focusTask(taskId, state) {
  setTimeout(() => {
    const taskEl = document.querySelector(`[data-task-id="${taskId}"]`);
    if (taskEl) {
      const contentEl = taskEl.querySelector('.task-content');
      if (contentEl) {
        contentEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        contentEl.focus();
        const range = document.createRange();
        range.selectNodeContents(contentEl);
        range.collapse(false);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        activateTask(taskEl, taskId, state);
        state.focusedElement = contentEl;
      }
    }
  }, 100);
}

function positionTaskInDom(task, taskEl, targetContainer, todos) {
  const svg = targetContainer.querySelector('#hierarchy-svg');
  
  if (task.parentId) {
    const parentEl = targetContainer.querySelector(`[data-task-id="${task.parentId}"]`);
    if (!parentEl) return;

    const siblings = todos.filter(t => t.parentId === task.parentId && t.id !== task.id);
    const predecessors = siblings.filter(t => t.order < task.order);
    
    let anchorEl = parentEl;
    if (predecessors.length > 0) {
      const lastPred = predecessors.sort((a,b) => b.order - a.order)[0];
      const lastPredDesc = hierarchy.getLastVisibleDescendant(lastPred, todos);
      const lastPredEl = targetContainer.querySelector(`[data-task-id="${lastPredDesc.id}"]`);
      if (lastPredEl) anchorEl = lastPredEl;
    }
    
    if (taskEl.previousElementSibling !== anchorEl) anchorEl.after(taskEl);
  } else {
    const rootTasks = todos.filter(t => !t.parentId && t.id !== task.id).sort((a,b) => a.order - b.order);
    const predecessors = rootTasks.filter(t => t.order < task.order);
    
    if (predecessors.length > 0) {
      const lastPred = predecessors[predecessors.length - 1];
      const lastPredDesc = hierarchy.getLastVisibleDescendant(lastPred, todos);
      const lastPredEl = targetContainer.querySelector(`[data-task-id="${lastPredDesc.id}"]`);
      if (lastPredEl && taskEl.previousElementSibling !== lastPredEl) lastPredEl.after(taskEl);
    } else {
      const firstChild = svg ? svg.nextSibling : targetContainer.firstChild;
      if (taskEl !== firstChild) {
        if (svg) svg.after(taskEl);
        else targetContainer.insertBefore(taskEl, targetContainer.firstChild);
      }
    }
  }
}

function renderTask(task, todos, container, state, refreshTodos, renderTasks) {
  const targetContainer = container.id === 'todo-container-inner' ? container : container.querySelector('#todo-container-inner') || container;
  let taskEl = targetContainer.querySelector(`[data-task-id="${task.id}"]`);
  const isNew = !taskEl;
  
  if (isNew) {
    taskEl = document.createElement('div');
    taskEl.className = 'task';
    taskEl.dataset.taskId = task.id;
    
    dragDrop.setupDragDrop(taskEl, task, todos, state, refreshTodos);
    
    const contentEl = document.createElement('div');
    contentEl.className = 'task-content';
    contentEl.contentEditable = 'true';
    contentEl.spellcheck = false;
    
    contentEl.addEventListener('click', (e) => { e.stopPropagation(); activateTask(taskEl, task.id, state); });
    contentEl.addEventListener('focus', () => activateTask(taskEl, task.id, state));
    
    taskEl.appendChild(createTaskExpander(task, todos, state, renderTasks));
    taskEl.appendChild(contentEl);
    taskEl.appendChild(createTaskActions(task, state, refreshTodos, focusTask));
  } else {
    if (!taskEl.hasAttribute('draggable')) dragDrop.setupDragDrop(taskEl, task, todos, state, refreshTodos);
    updateExpanderIcon(taskEl.querySelector('.task-expander-icon'), task, todos);
    const expander = taskEl.querySelector('.task-expander');
    if (expander) expander.style.marginLeft = `${8 + hierarchy.calculateLevel(task, todos) * 9}px`;
    if (state.activeTaskId === task.id) taskEl.classList.add('active');
    
    const oldActions = taskEl.querySelector('.task-actions');
    if (oldActions) {
      oldActions.replaceWith(createTaskActions(task, state, refreshTodos, focusTask));
    }
  }

  taskEl.querySelector('.task-content').innerHTML = task.content || '';
  positionTaskInDom(task, taskEl, targetContainer, todos);

  if (isNew) {
    targetContainer.appendChild(taskEl);
    richEditor.setupRichEditor(taskEl.querySelector('.task-content'), task.id, state, (ts) => hierarchyLines.drawHierarchyLines(ts, targetContainer));
    requestAnimationFrame(() => {
      richEditor.autoResize(taskEl.querySelector('.task-content'));
      if (state.currentTodos) hierarchyLines.drawHierarchyLines(state.currentTodos, targetContainer);
    });
  }
  
  if (!task.collapsed) {
    const children = todos.filter(t => t.parentId === task.id && !t.completed && hierarchy.isTaskVisible(t, todos))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    
    children.forEach(child => renderTask(child, todos, targetContainer, state, refreshTodos, renderTasks));
  }
}

function renderTasks(todos, preserveExisting, state) {
  state.currentTodos = todos;
  const container = document.getElementById('todo-container-inner') || document.getElementById('todo-container');
  if (!container) return;
  
  if (!preserveExisting) {
    const svg = container.querySelector('#hierarchy-svg');
    container.innerHTML = '';
    if (svg) container.appendChild(svg);
    state.activeTaskId = null;
  } else {
    const currentIds = new Set(todos.filter(t => !t.completed && hierarchy.isTaskVisible(t, todos)).map(t => t.id));
    container.querySelectorAll('.task').forEach(el => {
      if (!currentIds.has(el.dataset.taskId)) {
        el.remove();
        if (state.activeTaskId === el.dataset.taskId) state.activeTaskId = null;
      }
    });
  }
  
  const rootTasks = todos.filter(t => !t.parentId && !t.completed && hierarchy.isTaskVisible(t, todos))
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  rootTasks.forEach(task => renderTask(task, todos, container, state, refreshTodos, renderTasks));
  
  requestAnimationFrame(() => {
    container.querySelectorAll('.task-content').forEach(el => { if (el !== state.focusedElement) richEditor.autoResize(el); });
    setTimeout(() => hierarchyLines.drawHierarchyLines(todos, container), 50);
  });
}

async function refreshTodos(state) {
  const todos = await window.todoApi.getTodos();
  renderTasks(todos, true, state);
}

async function createAndFocusTask(parentId, state, refreshTodos) {
  if (!window.todoApi) return;
  const newTask = await window.todoApi.createTodo('', parentId || null);
  await refreshTodos(state);
  if (newTask) focusTask(newTask.id, state);
  return newTask;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    renderTasks,
    renderTask,
    createTaskExpander,
    createTaskActions,
    focusTask,
    refreshTodos,
    updateExpanderIcon,
    createAndFocusTask
  };
} else {
  window.todoRenderer = {
    renderTasks,
    renderTask,
    createTaskExpander,
    createTaskActions,
    focusTask,
    refreshTodos,
    updateExpanderIcon,
    createAndFocusTask
  };
}