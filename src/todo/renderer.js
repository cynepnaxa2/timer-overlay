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
      await createAndFocusTask(taskId, state, refreshTodos);
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
        activateTask(taskEl, taskId, state);
        state.focusedElement = contentEl;
      }
    }
  }, 100);
}

function renderTask(task, todos, container, state, refreshTodos, renderTasks) {
  const innerContainer = container.id === 'todo-container-inner' ? container : container.querySelector('#todo-container-inner');
  const targetContainer = innerContainer || container;
  
  let taskEl = targetContainer.querySelector(`[data-task-id="${task.id}"]`);
  const isNew = !taskEl;
  
  if (isNew) {
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
    
    contentEl.addEventListener('click', (e) => {
      e.stopPropagation();
      activateTask(taskEl, task.id, state);
    });
    
    contentEl.addEventListener('focus', () => {
      activateTask(taskEl, task.id, state);
    });
    
    const actionsEl = createTaskActions(task.id, state, refreshTodos, focusTask);
    
    taskEl.appendChild(expanderEl);
    taskEl.appendChild(contentEl);
    taskEl.appendChild(actionsEl);
  }

  // Positioning logic for flat DOM
  const svg = targetContainer.querySelector('#hierarchy-svg');
  
  if (task.parentId) {
    const parentEl = targetContainer.querySelector(`[data-task-id="${task.parentId}"]`);
    if (parentEl) {
      const siblingTasks = todos.filter(t => t.parentId === task.parentId && t.id !== task.id);
      const predecessors = siblingTasks.filter(t => t.order < task.order);
      
      let anchorEl = parentEl;
      if (predecessors.length > 0) {
        const lastPred = predecessors.sort((a,b) => b.order - a.order)[0];
        const lastPredDesc = hierarchy.getLastVisibleDescendant(lastPred, todos);
        const lastPredEl = targetContainer.querySelector(`[data-task-id="${lastPredDesc.id}"]`);
        if (lastPredEl) anchorEl = lastPredEl;
      }
      
      if (taskEl.previousElementSibling !== anchorEl) {
        anchorEl.after(taskEl);
      }
    }
  } else {
    // Root task positioning
    const rootTasks = todos.filter(t => !t.parentId && t.id !== task.id).sort((a,b) => a.order - b.order);
    const predecessors = rootTasks.filter(t => t.order < task.order);
    
    if (predecessors.length > 0) {
      const lastPred = predecessors[predecessors.length - 1];
      const lastPredDesc = hierarchy.getLastVisibleDescendant(lastPred, todos);
      const lastPredEl = targetContainer.querySelector(`[data-task-id="${lastPredDesc.id}"]`);
      if (lastPredEl && taskEl.previousElementSibling !== lastPredEl) {
        lastPredEl.after(taskEl);
      }
    } else {
      // First root task - should be after SVG if it exists, or at start
      if (svg) {
        if (taskEl.previousElementSibling !== svg) {
          svg.after(taskEl);
        }
      } else if (targetContainer.firstChild) {
        if (taskEl !== targetContainer.firstChild) {
          targetContainer.insertBefore(taskEl, targetContainer.firstChild);
        }
      } else {
        targetContainer.appendChild(taskEl);
      }
    }
  }

  if (isNew) {
    const contentEl = taskEl.querySelector('.task-content');
    richEditor.setupRichEditor(contentEl, task.id, state, (todos) => hierarchyLines.drawHierarchyLines(todos, targetContainer));
    requestAnimationFrame(() => {
      richEditor.autoResize(contentEl);
      setTimeout(() => {
        if (state.currentTodos) hierarchyLines.drawHierarchyLines(state.currentTodos, targetContainer);
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
      contentEl.setAttribute('data-click-handler', 'true');
      contentEl.addEventListener('click', (e) => {
        e.stopPropagation();
        activateTask(taskEl, task.id, state);
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
  state.currentTodos = todos;
  const outerContainer = document.getElementById('todo-container');
  const container = document.getElementById('todo-container-inner') || outerContainer;
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
