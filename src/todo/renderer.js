function getHierarchy() {
  if (typeof window !== 'undefined' && window.todoHierarchy) {
    return window.todoHierarchy;
  }
  if (typeof require !== 'undefined') {
    return require('./hierarchy');
  }
  throw new Error('todoHierarchy not found');
}

function getDragDrop() {
  if (typeof window !== 'undefined' && window.todoDragDrop) {
    return window.todoDragDrop;
  }
  if (typeof require !== 'undefined') {
    return require('./dragDrop');
  }
  throw new Error('todoDragDrop not found');
}

function getRichEditor() {
  if (typeof window !== 'undefined' && window.richEditor) {
    return window.richEditor;
  }
  if (typeof require !== 'undefined') {
    return require('../utils/richEditor');
  }
  throw new Error('richEditor not found');
}

function getHierarchyLines() {
  if (typeof window !== 'undefined' && window.todoHierarchyLines) {
    return window.todoHierarchyLines;
  }
  if (typeof require !== 'undefined') {
    return require('./hierarchyLines');
  }
  throw new Error('todoHierarchyLines not found');
}

function updateExpanderIcon(iconEl, task, todos) {
  const hierarchy = getHierarchy();
  const hasChildrenTasks = hierarchy.hasChildren(task, todos);
  if (!hasChildrenTasks) {
    iconEl.textContent = '●';
    iconEl.style.fontSize = '10px';
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
  const hierarchy = getHierarchy();
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

function createTaskActions(taskId, state, refreshTodos, focusTask) {
  const actionsEl = document.createElement('div');
  actionsEl.className = 'task-actions';
  
  const buttons = [
    { text: '+', title: 'Добавить подзадачу', action: async () => {
      const newTask = await window.todoApi.createTodo('', taskId);
      await refreshTodos();
      if (newTask) focusTask(newTask.id, state);
    }},
    { text: '▶', title: 'Выполнить', action: () => {
      const task = state.currentTodos.find(t => t.id === taskId);
      if (window.todoApi && task) {
        window.todoApi.startTimer(task.motivationWord || null);
      }
    }},
    { text: '✓', title: 'Выполнено', action: async () => {
      await window.todoApi.updateTodo(taskId, { completed: true, completedAt: Date.now() });
      await refreshTodos();
    }}
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
        document.querySelectorAll('.task').forEach(t => t.classList.remove('active'));
        taskEl.classList.add('active');
        state.activeTaskId = taskId;
        state.focusedElement = contentEl;
      }
    }
  }, 100);
}

function renderTask(task, todos, container, state, refreshTodos, renderTasks) {
  const hierarchy = getHierarchy();
  const dragDrop = getDragDrop();
  const richEditor = getRichEditor();
  const hierarchyLines = getHierarchyLines();
  
  let taskEl = container.querySelector(`[data-task-id="${task.id}"]`);
  
  if (!taskEl) {
    taskEl = document.createElement('div');
    taskEl.className = 'task';
    taskEl.dataset.taskId = task.id;
    
    dragDrop.setupDragDrop(taskEl, task, todos, state, refreshTodos);
    
    const expanderEl = createTaskExpander(task, todos, state, renderTasks);
    
    const contentEl = document.createElement('div');
    contentEl.className = 'task-content';
    contentEl.contentEditable = 'true';
    contentEl.spellcheck = false;
    contentEl.innerHTML = task.content || '';
    
    const activateTask = () => {
      document.querySelectorAll('.task').forEach(t => t.classList.remove('active'));
      taskEl.classList.add('active');
      state.activeTaskId = task.id;
    };
    contentEl.setAttribute('data-click-handler', 'true');
    contentEl.addEventListener('click', (e) => {
      e.stopPropagation();
      activateTask();
    });
    
    const actionsEl = createTaskActions(task.id, state, refreshTodos, focusTask);
    
    taskEl.appendChild(expanderEl);
    taskEl.appendChild(contentEl);
    taskEl.appendChild(actionsEl);
    container.appendChild(taskEl);
    
    richEditor.setupRichEditor(contentEl, task.id, state, hierarchyLines.drawHierarchyLines);
    requestAnimationFrame(() => {
      richEditor.autoResize(contentEl);
      setTimeout(() => {
        if (state.currentTodos) hierarchyLines.drawHierarchyLines(state.currentTodos, container);
      }, 0);
    });
  } else {
    if (!taskEl.hasAttribute('draggable')) {
      dragDrop.setupDragDrop(taskEl, task, todos, state, refreshTodos);
    }
    const contentEl = taskEl.querySelector('.task-content');
    if (contentEl && contentEl !== state.focusedElement) {
      if (contentEl.contentEditable === 'true') {
        contentEl.spellcheck = false;
      }
      contentEl.innerHTML = task.content || '';
      requestAnimationFrame(() => {
        richEditor.autoResize(contentEl);
      });
    }
    let expanderEl = taskEl.querySelector('.task-expander');
    if (!expanderEl) {
      expanderEl = createTaskExpander(task, todos, state, renderTasks);
      const contentEl = taskEl.querySelector('.task-content');
      if (contentEl) {
        taskEl.insertBefore(expanderEl, contentEl);
      }
    } else {
      expanderEl.style.marginLeft = `${8 + hierarchy.calculateLevel(task, todos) * 9}px`;
      const iconEl = expanderEl.querySelector('.task-expander-icon');
      if (iconEl) {
        updateExpanderIcon(iconEl, task, todos);
      }
    }
    let actionsEl = taskEl.querySelector('.task-actions');
    if (!actionsEl) {
      actionsEl = createTaskActions(task.id, state, refreshTodos, focusTask);
      taskEl.appendChild(actionsEl);
    }
    if (contentEl && !contentEl.hasAttribute('data-click-handler')) {
      const activateTask = () => {
        document.querySelectorAll('.task').forEach(t => t.classList.remove('active'));
        taskEl.classList.add('active');
        state.activeTaskId = task.id;
      };
      contentEl.setAttribute('data-click-handler', 'true');
      contentEl.addEventListener('click', (e) => {
        e.stopPropagation();
        activateTask();
      });
    }
    if (state.activeTaskId === task.id) {
      taskEl.classList.add('active');
    }
  }
  
  if (!task.collapsed) {
    todos.filter(t => t.parentId === task.id && !t.completed && hierarchy.isTaskVisible(t, todos))
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .forEach(child => renderTask(child, todos, container, state, refreshTodos, renderTasks));
  }
}

function renderTasks(todos, preserveExisting, state) {
  const hierarchy = getHierarchy();
  const richEditor = getRichEditor();
  const hierarchyLines = getHierarchyLines();
  
  state.currentTodos = todos;
  const container = document.getElementById('todo-container');
  if (!container) return;
  
  if (!preserveExisting) {
    const svg = container.querySelector('#hierarchy-svg');
    container.innerHTML = '';
    if (svg) container.appendChild(svg);
    state.activeTaskId = null;
  } else {
    const currentIds = new Set(todos.filter(t => !t.completed).map(t => t.id));
    container.querySelectorAll('[data-task-id]').forEach(el => {
      if (!currentIds.has(el.dataset.taskId)) {
        el.remove();
        if (state.activeTaskId === el.dataset.taskId) state.activeTaskId = null;
      }
    });
  }
  
  todos.filter(t => !t.parentId && !t.completed && hierarchy.isTaskVisible(t, todos))
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .forEach(task => renderTask(task, todos, container, state, refreshTodos, renderTasks));
  
  requestAnimationFrame(() => {
    container.querySelectorAll('.task-content').forEach(el => {
      if (el !== state.focusedElement) richEditor.autoResize(el);
    });
    setTimeout(() => hierarchyLines.drawHierarchyLines(todos, container), 50);
  });
}

async function refreshTodos(state) {
  if (!window.todoApi) {
    console.error('window.todoApi is not available');
    return;
  }
  const todos = await window.todoApi.getTodos();
  renderTasks(todos, true, state);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    renderTasks,
    renderTask,
    createTaskExpander,
    createTaskActions,
    focusTask,
    refreshTodos,
    updateExpanderIcon
  };
} else {
  window.todoRenderer = {
    renderTasks,
    renderTask,
    createTaskExpander,
    createTaskActions,
    focusTask,
    refreshTodos,
    updateExpanderIcon
  };
}
