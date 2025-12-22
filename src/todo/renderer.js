function parseValue(input) {
  if (!input || input.trim() === '') return 0;
  const str = input.trim().toLowerCase();
  const num = parseFloat(str.replace(/[km]/g, ''));
  if (isNaN(num)) return 0;
  if (str.includes('m')) return num * 1000000;
  if (str.includes('k')) return num * 1000;
  return num;
}

function formatValue(value) {
  if (!value || value === 0) return '';
  if (value >= 1000000) {
    const m = value / 1000000;
    return m % 1 === 0 ? m + 'm' : m.toFixed(1) + 'm';
  }
  if (value >= 1000) {
    const k = value / 1000;
    return k % 1 === 0 ? k + 'k' : k.toFixed(1) + 'k';
  }
  return value % 1 === 0 ? value.toString() : value.toFixed(1);
}

function getGainUnit(task, todos) {
  if (!task || !task.parentId) {
    return { type: null, unit: null };
  }
  
  const parent = todos.find(t => t.id === task.parentId);
  if (!parent) {
    return { type: null, unit: null };
  }
  
  if (parent.resourceUnit) {
    return { type: 'resource', unit: parent.resourceUnit };
  }
  
  if (task.gainUnitType && task.gainUnit) {
    return { type: task.gainUnitType, unit: task.gainUnit };
  }
  
  const parentContent = (parent.content || '').toLowerCase();
  if (parentContent.includes('💰') || parentContent.includes('деньги') || parentContent.includes('money')) {
    return { type: 'money', unit: '₽' };
  }
  if (parentContent.includes('❤️') || parentContent.includes('здоровье') || parentContent.includes('health')) {
    return { type: 'health', unit: '' };
  }
  if (parentContent.includes('😊') || parentContent.includes('счастье') || parentContent.includes('happiness')) {
    return { type: 'happiness', unit: '' };
  }
  if (parentContent.includes('⏱️') || parentContent.includes('время') || parentContent.includes('time')) {
    return { type: 'time', unit: 'ч' };
  }
  
  return getGainUnit(parent, todos);
}

function calculateLevel(task, todos) {
  if (!task.parentId) return 0;
  const parent = todos.find(t => t.id === task.parentId);
  return parent ? calculateLevel(parent, todos) + 1 : 0;
}

function isTaskVisible(task, todos) {
  if (!task.parentId) return true;
  const parent = todos.find(t => t.id === task.parentId);
  return !parent || (!parent.collapsed && isTaskVisible(parent, todos));
}

function autoResize(element) {
  if (!element) return;
  element.style.height = 'auto';
  element.style.height = Math.max(40, element.scrollHeight) + 'px';
}

let updateTimeout = null;
let focusedElement = null;
let activeTaskId = null;
let currentTodos = [];
let draggingTaskId = null;
let todoHotkeys = {
  addSubtask: 'Insert',
  execute: 'F5',
  complete: 'Delete'
};

function parseHotkey(hotkeyString) {
  const parts = hotkeyString.split('+').map(p => p.trim());
  const modifiers = {
    ctrl: false,
    alt: false,
    shift: false,
    meta: false
  };
  let key = null;
  
  for (const part of parts) {
    const lower = part.toLowerCase();
    if (lower === 'ctrl' || lower === 'control') {
      modifiers.ctrl = true;
    } else if (lower === 'alt') {
      modifiers.alt = true;
    } else if (lower === 'shift') {
      modifiers.shift = true;
    } else if (lower === 'meta' || lower === 'cmd') {
      modifiers.meta = true;
    } else {
      key = part;
    }
  }
  
  return { modifiers, key };
}

function matchesHotkey(event, hotkeyString) {
  const parsed = parseHotkey(hotkeyString);
  const eventKey = event.key;
  const eventCode = event.code;
  
  const keyMap = {
    'Insert': 'Insert',
    'Delete': 'Delete',
    'F5': 'F5',
    'Enter': 'Enter',
    'Space': ' ',
    'Esc': 'Escape'
  };
  
  const keyMatches = keyMap[parsed.key] ? keyMap[parsed.key] === eventKey :
    parsed.key?.length === 1 ? parsed.key.toLowerCase() === eventKey.toLowerCase() || parsed.key === eventKey || parsed.key === eventCode :
    parsed.key === eventKey || parsed.key === eventCode;
  
  return keyMatches &&
    parsed.modifiers.ctrl === event.ctrlKey &&
    parsed.modifiers.alt === event.altKey &&
    parsed.modifiers.shift === event.shiftKey &&
    parsed.modifiers.meta === event.metaKey;
}

function setupRichEditor(element, taskId) {
  element.addEventListener('focus', () => {
    focusedElement = element;
  });
  
  element.addEventListener('blur', () => {
    if (focusedElement === element) {
      focusedElement = null;
    }
  });
  
  const debouncedUpdate = () => {
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() => {
      window.todoApi.updateTodo(taskId, { content: element.innerHTML });
      const container = document.getElementById('todo-container');
      if (container && currentTodos) {
        setTimeout(() => drawHierarchyLines(currentTodos, container), 50);
      }
    }, 300);
  };
  
  element.addEventListener('input', () => {
    autoResize(element);
    if (window.todoApi) debouncedUpdate();
  });
  
  element.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    
    autoResize(element);
    if (window.todoApi) {
      window.todoApi.updateTodo(taskId, { content: element.innerHTML });
    }
  });
  
  setTimeout(() => {
    autoResize(element);
  }, 0);
}

async function refreshTodos() {
  const todos = await window.todoApi.getTodos();
  currentTodos = todos;
  renderTasks(todos, true);
}

function focusTask(taskId) {
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
        activeTaskId = taskId;
        focusedElement = contentEl;
      }
    }
  }, 100);
}

function createTaskActions(taskId) {
  const actionsEl = document.createElement('div');
  actionsEl.className = 'task-actions';
  
  const buttons = [
    { text: '+', title: 'Добавить подзадачу', action: async () => {
      const newTask = await window.todoApi.createTodo('', taskId);
      await refreshTodos();
      if (newTask) focusTask(newTask.id);
    }},
    { text: '▶', title: 'Выполнить', action: () => {
      const task = currentTodos.find(t => t.id === taskId);
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

function updateExpanderIcon(iconEl, task, todos) {
  const hasChildrenTasks = hasChildren(task, todos);
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

function createTaskExpander(task, todos) {
  const expanderEl = document.createElement('div');
  expanderEl.className = 'task-expander';
  expanderEl.dataset.taskId = task.id;
  expanderEl.style.marginLeft = `${8 + calculateLevel(task, todos) * 9}px`;
  
  const iconEl = document.createElement('div');
  iconEl.className = 'task-expander-icon';
  updateExpanderIcon(iconEl, task, todos);
  expanderEl.appendChild(iconEl);
  
  if (hasChildren(task, todos)) {
    expanderEl.addEventListener('click', async (e) => {
      e.stopPropagation();
      await window.todoApi.toggleTaskCollapse(task.id);
      renderTasks(await window.todoApi.getTodos());
    });
  }
  
  return expanderEl;
}

function hasChildren(task, todos) {
  return todos.some(t => t.parentId === task.id && !t.completed);
}

function getLastVisibleDescendant(task, todos) {
  if (task.collapsed) return task;
  const children = todos.filter(t => t.parentId === task.id && !t.completed && isTaskVisible(t, todos))
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  return children.length === 0 ? task : getLastVisibleDescendant(children[children.length - 1], todos);
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

function drawHierarchyLines(todos, container) {
  if (!container) return;
  
  let svg = container.querySelector('#hierarchy-svg');
  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'hierarchy-svg';
    container.insertBefore(svg, container.firstChild);
  }
  
  const containerRect = container.getBoundingClientRect();
  const scrollTop = container.scrollTop;
  const svgHeight = Math.max(container.scrollHeight, containerRect.height);
  const svgRect = svg.getBoundingClientRect();
  
  svg.setAttribute('width', containerRect.width);
  svg.setAttribute('height', svgHeight);
  svg.setAttribute('viewBox', `0 0 ${containerRect.width} ${svgHeight}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  Object.assign(svg.style, {
    width: '100%',
    height: `${svgHeight}px`,
    position: 'absolute',
    top: '0',
    left: '0',
    overflow: 'visible'
  });
  
  const getY = (el) => el ? el.getBoundingClientRect().bottom - svgRect.top + scrollTop : 0;
  const getX = (el) => el ? el.getBoundingClientRect().left - svgRect.left : 0;
  
  const parentTasks = todos.filter(t => 
    !t.completed && 
    isTaskVisible(t, todos) && 
    hasChildren(t, todos) && 
    !t.collapsed
  );
  
  const fragment = document.createDocumentFragment();
  
  parentTasks.forEach(parentTask => {
    const expander = container.querySelector(`.task-expander[data-task-id="${parentTask.id}"]`);
    if (!expander) return;
    
    const lineX = getX(expander);
    const lineTop = getY(expander) + 20;
    
    const lastDescendant = getLastVisibleDescendant(parentTask, todos);
    const lastTask = container.querySelector(`[data-task-id="${lastDescendant.id}"]`);
    if (!lastTask) return;
    
    const lineBottom = getY(lastTask);
    
    if (lineBottom > lineTop && lineX > 0) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', lineX);
      line.setAttribute('y1', lineTop);
      line.setAttribute('x2', lineX);
      line.setAttribute('y2', lineBottom);
      line.setAttribute('class', 'hierarchy-svg-line');
      fragment.appendChild(line);
    }
  });
  
  svg.replaceChildren();
  svg.appendChild(fragment);
}

function renderTask(task, todos, container) {
  let taskEl = container.querySelector(`[data-task-id="${task.id}"]`);
  
  if (!taskEl) {
    taskEl = document.createElement('div');
    taskEl.className = 'task';
    taskEl.dataset.taskId = task.id;
    taskEl.draggable = true;
    
    taskEl.addEventListener('dragstart', (e) => {
      if (e.target.closest('.task-content') && document.activeElement === e.target.closest('.task-content')) {
        e.preventDefault();
        return;
      }
      draggingTaskId = task.id;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', task.id);
      taskEl.classList.add('dragging');
    });
    
    taskEl.addEventListener('dragend', () => {
      taskEl.classList.remove('dragging');
      draggingTaskId = null;
      document.querySelectorAll('.task').forEach(t => {
        t.classList.remove('drag-over', 'drag-over-inside');
      });
    });
    
    taskEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (draggingTaskId && draggingTaskId !== task.id) {
        const rect = taskEl.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        if (e.clientY < midY) {
          taskEl.classList.add('drag-over');
          taskEl.classList.remove('drag-over-inside');
        } else {
          taskEl.classList.add('drag-over-inside');
          taskEl.classList.remove('drag-over');
        }
      }
    });
    
    taskEl.addEventListener('dragleave', () => {
      taskEl.classList.remove('drag-over', 'drag-over-inside');
    });
    
    taskEl.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const draggingId = draggingTaskId || e.dataTransfer.getData('text/plain');
      if (!draggingId || draggingId === task.id) return;
      
      const draggingTask = currentTodos.find(t => t.id === draggingId);
      if (!draggingTask) return;
      
      if (isDescendant(draggingId, task.id, currentTodos)) {
        return;
      }
      
      const rect = taskEl.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const isBefore = e.clientY < midY;
      
      const targetParentId = isBefore ? task.parentId : task.id;
      const allDraggingIds = [draggingId, ...getAllDescendants(draggingId, currentTodos)];
      
      const targetSiblings = currentTodos.filter(t => 
        t.parentId === targetParentId && 
        !t.completed && 
        !allDraggingIds.includes(t.id) &&
        isTaskVisible(t, currentTodos)
      ).sort((a, b) => (a.order || 0) - (b.order || 0));
      
      let insertIndex;
      if (isBefore) {
        insertIndex = targetSiblings.findIndex(t => t.id === task.id);
      } else {
        insertIndex = targetSiblings.findIndex(t => t.id === task.id) + 1;
      }
      
      const draggingTasks = allDraggingIds.map(id => currentTodos.find(t => t.id === id)).filter(Boolean);
      targetSiblings.splice(insertIndex, 0, ...draggingTasks);
      const todoIds = targetSiblings.map(t => t.id);
      
      if (targetParentId !== draggingTask.parentId) {
        await window.todoApi.updateTodo(draggingId, { parentId: targetParentId });
        const descendants = getAllDescendants(draggingId, currentTodos);
        for (const descId of descendants) {
          const descTask = currentTodos.find(t => t.id === descId);
          if (descTask && descTask.parentId === draggingId) {
            await window.todoApi.updateTodo(descId, { parentId: draggingId });
          }
        }
      }
      
      await window.todoApi.reorderTodos(todoIds);
      await refreshTodos();
    });
    
    const expanderEl = createTaskExpander(task, todos);
    
    const contentEl = document.createElement('div');
    contentEl.className = 'task-content';
    contentEl.contentEditable = 'true';
    contentEl.spellcheck = false;
    contentEl.innerHTML = task.content || '';
    
    const activateTask = () => {
      document.querySelectorAll('.task').forEach(t => t.classList.remove('active'));
      taskEl.classList.add('active');
      activeTaskId = task.id;
    };
    contentEl.setAttribute('data-click-handler', 'true');
    contentEl.addEventListener('click', (e) => {
      e.stopPropagation();
      activateTask();
    });
    
    const actionsEl = createTaskActions(task.id);
    
    // Costs and Gain cells
    const taskCells = document.createElement('div');
    taskCells.className = 'task-cells';
    
    // Money Cost
    const costsMoneyCell = document.createElement('div');
    costsMoneyCell.className = 'task-cell';
    const costsMoneyInput = document.createElement('input');
    costsMoneyInput.className = 'cost-gain-input';
    costsMoneyInput.type = 'text';
    const moneyValue = (task.costs && task.costs.money) || 0;
    costsMoneyInput.value = moneyValue > 0 ? formatValue(moneyValue) : '';
    costsMoneyInput.placeholder = '0';
    costsMoneyInput.addEventListener('blur', async () => {
      const value = parseValue(costsMoneyInput.value);
      const costs = { ...(task.costs || { money: 0, time: 0 }), money: value };
      await window.todoApi.updateTodo(task.id, { costs });
      await refreshTodos();
    });
    costsMoneyInput.addEventListener('focus', () => {
      const moneyValue = (task.costs && task.costs.money) || 0;
      costsMoneyInput.value = moneyValue > 0 ? moneyValue.toString() : '';
    });
    costsMoneyCell.appendChild(costsMoneyInput);
    taskCells.appendChild(costsMoneyCell);
    
    // Time Cost
    const costsTimeCell = document.createElement('div');
    costsTimeCell.className = 'task-cell';
    const costsTimeInput = document.createElement('input');
    costsTimeInput.className = 'cost-gain-input';
    costsTimeInput.type = 'text';
    const timeValue = (task.costs && task.costs.time) || 0;
    costsTimeInput.value = timeValue > 0 ? (timeValue % 1 === 0 ? timeValue.toString() : timeValue.toFixed(1)) : '';
    costsTimeInput.placeholder = '0';
    costsTimeInput.addEventListener('blur', async () => {
      const value = parseValue(costsTimeInput.value);
      const costs = { ...(task.costs || { money: 0, time: 0 }), time: value };
      await window.todoApi.updateTodo(task.id, { costs });
      await refreshTodos();
    });
    costsTimeInput.addEventListener('focus', () => {
      const timeValue = (task.costs && task.costs.time) || 0;
      costsTimeInput.value = timeValue > 0 ? (timeValue % 1 === 0 ? timeValue.toString() : timeValue.toFixed(1)) : '';
    });
    costsTimeCell.appendChild(costsTimeInput);
    taskCells.appendChild(costsTimeCell);
    
    // Gain
    const gainCell = document.createElement('div');
    gainCell.className = 'task-cell';
    const gainInput = document.createElement('input');
    gainInput.className = 'cost-gain-input';
    gainInput.type = 'text';
    const gainValue = task.gain || 0;
    const gainUnitInfo = task.gainUnitType ? { type: task.gainUnitType, unit: task.gainUnit } : getGainUnit(task, currentTodos);
    
    if (gainUnitInfo.type === 'money') {
      gainInput.value = gainValue > 0 ? formatValue(gainValue) : '';
    } else if (gainUnitInfo.type === 'health' || gainUnitInfo.type === 'happiness') {
      gainInput.value = gainValue > 0 ? Math.min(9, Math.max(0, Math.round(gainValue))).toString() : '';
      gainInput.maxLength = 1;
    } else if (gainUnitInfo.type === 'time') {
      gainInput.value = gainValue > 0 ? (gainValue % 1 === 0 ? gainValue.toString() : gainValue.toFixed(1)) : '';
    } else if (gainUnitInfo.type === 'resource') {
      gainInput.value = gainValue > 0 ? gainValue.toString() : '';
    } else {
      gainInput.value = gainValue > 0 ? gainValue.toString() : '';
    }
    gainInput.placeholder = '0';
    gainInput.addEventListener('blur', async () => {
      let value = parseValue(gainInput.value);
      if (gainUnitInfo.type === 'health' || gainUnitInfo.type === 'happiness') {
        value = Math.min(9, Math.max(0, Math.round(value)));
      }
      await window.todoApi.updateTodo(task.id, { gain: value, gainUnitType: gainUnitInfo.type, gainUnit: gainUnitInfo.unit });
      await refreshTodos();
    });
    gainInput.addEventListener('focus', () => {
      const gainValue = task.gain || 0;
      if (gainUnitInfo.type === 'money') {
        gainInput.value = gainValue > 0 ? gainValue.toString() : '';
      } else if (gainUnitInfo.type === 'health' || gainUnitInfo.type === 'happiness') {
        gainInput.value = gainValue > 0 ? Math.min(9, Math.max(0, Math.round(gainValue))).toString() : '';
      } else {
        gainInput.value = gainValue > 0 ? (gainValue % 1 === 0 ? gainValue.toString() : gainValue.toFixed(1)) : '';
      }
    });
    gainCell.appendChild(gainInput);
    taskCells.appendChild(gainCell);
    
    // Context Icons
    const contextCell = document.createElement('div');
    contextCell.className = 'task-cell context-icons-cell';
    const contexts = [
      { id: 'computer', icon: '💻' },
      { id: 'car', icon: '🚗' },
      { id: 'city', icon: '🏙️' },
      { id: 'home', icon: '🏠' }
    ];
    const contextIcons = document.createElement('div');
    contextIcons.className = 'context-icons';
    const currentContext = task.context || 'computer';
    contexts.forEach(ctx => {
      const icon = document.createElement('div');
      icon.className = 'context-icon';
      if (ctx.id === currentContext) {
        icon.classList.add('active');
      }
      icon.textContent = ctx.icon;
      icon.title = ctx.id;
      icon.addEventListener('click', async () => {
        await window.todoApi.updateTodo(task.id, { context: ctx.id });
        await refreshTodos();
      });
      contextIcons.appendChild(icon);
    });
    contextCell.appendChild(contextIcons);
    taskCells.appendChild(contextCell);
    
    taskEl.appendChild(expanderEl);
    taskEl.appendChild(contentEl);
    taskEl.appendChild(taskCells);
    taskEl.appendChild(actionsEl);
    container.appendChild(taskEl);
    
    setupRichEditor(contentEl, task.id);
    requestAnimationFrame(() => {
      autoResize(contentEl);
      setTimeout(() => {
        if (currentTodos) drawHierarchyLines(currentTodos, container);
      }, 0);
    });
  } else {
    if (!taskEl.hasAttribute('draggable')) {
      taskEl.draggable = true;
      
      taskEl.addEventListener('dragstart', (e) => {
        if (e.target.closest('.task-content') && document.activeElement === e.target.closest('.task-content')) {
          e.preventDefault();
          return;
        }
        draggingTaskId = task.id;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', task.id);
        taskEl.classList.add('dragging');
      });
      
      taskEl.addEventListener('dragend', () => {
        taskEl.classList.remove('dragging');
        draggingTaskId = null;
        document.querySelectorAll('.task').forEach(t => {
          t.classList.remove('drag-over', 'drag-over-inside');
        });
      });
      
      taskEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggingTaskId && draggingTaskId !== task.id) {
          const rect = taskEl.getBoundingClientRect();
          const midY = rect.top + rect.height / 2;
          if (e.clientY < midY) {
            taskEl.classList.add('drag-over');
            taskEl.classList.remove('drag-over-inside');
          } else {
            taskEl.classList.add('drag-over-inside');
            taskEl.classList.remove('drag-over');
          }
        }
      });
      
      taskEl.addEventListener('dragleave', () => {
        taskEl.classList.remove('drag-over', 'drag-over-inside');
      });
      
      taskEl.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const draggingId = draggingTaskId || e.dataTransfer.getData('text/plain');
        if (!draggingId || draggingId === task.id) return;
        
        const draggingTask = currentTodos.find(t => t.id === draggingId);
        if (!draggingTask) return;
        
        if (isDescendant(draggingId, task.id, currentTodos)) {
          return;
        }
        
        const rect = taskEl.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const isBefore = e.clientY < midY;
        
        const targetParentId = isBefore ? task.parentId : task.id;
        const allDraggingIds = [draggingId, ...getAllDescendants(draggingId, currentTodos)];
        
        const targetSiblings = currentTodos.filter(t => 
          t.parentId === targetParentId && 
          !t.completed && 
          !allDraggingIds.includes(t.id) &&
          isTaskVisible(t, currentTodos)
        ).sort((a, b) => (a.order || 0) - (b.order || 0));
        
        let insertIndex;
        if (isBefore) {
          insertIndex = targetSiblings.findIndex(t => t.id === task.id);
        } else {
          insertIndex = targetSiblings.findIndex(t => t.id === task.id) + 1;
        }
        
        const draggingTasks = allDraggingIds.map(id => currentTodos.find(t => t.id === id)).filter(Boolean);
        targetSiblings.splice(insertIndex, 0, ...draggingTasks);
        const todoIds = targetSiblings.map(t => t.id);
        
        if (targetParentId !== draggingTask.parentId) {
          await window.todoApi.updateTodo(draggingId, { parentId: targetParentId });
        }
        
        await window.todoApi.reorderTodos(todoIds);
        await refreshTodos();
      });
    }
    const contentEl = taskEl.querySelector('.task-content');
    if (contentEl && contentEl !== focusedElement) {
      if (contentEl.contentEditable === 'true') {
        contentEl.spellcheck = false;
      }
      contentEl.innerHTML = task.content || '';
      requestAnimationFrame(() => {
        autoResize(contentEl);
      });
    }
    let expanderEl = taskEl.querySelector('.task-expander');
    if (!expanderEl) {
      expanderEl = createTaskExpander(task, todos);
      const contentEl = taskEl.querySelector('.task-content');
      if (contentEl) {
        taskEl.insertBefore(expanderEl, contentEl);
      }
    } else {
      expanderEl.style.marginLeft = `${8 + calculateLevel(task, todos) * 9}px`;
      const iconEl = expanderEl.querySelector('.task-expander-icon');
      if (iconEl) {
        updateExpanderIcon(iconEl, task, todos);
      }
    }
    let actionsEl = taskEl.querySelector('.task-actions');
    if (!actionsEl) {
      actionsEl = createTaskActions(task.id);
      taskEl.appendChild(actionsEl);
    }
    if (contentEl && !contentEl.hasAttribute('data-click-handler')) {
      const activateTask = () => {
        document.querySelectorAll('.task').forEach(t => t.classList.remove('active'));
        taskEl.classList.add('active');
        activeTaskId = task.id;
      };
      contentEl.setAttribute('data-click-handler', 'true');
      contentEl.addEventListener('click', (e) => {
        e.stopPropagation();
        activateTask();
      });
    }
    if (activeTaskId === task.id) {
      taskEl.classList.add('active');
    }
  }
  
  if (!task.collapsed) {
    todos.filter(t => t.parentId === task.id && !t.completed && isTaskVisible(t, todos))
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .forEach(child => renderTask(child, todos, container));
  }
}

function renderTasks(todos, preserveExisting = false) {
  currentTodos = todos;
  const container = document.getElementById('todo-container');
  if (!container) return;
  
  // Update gain header based on root tasks
  const rootTasks = todos.filter(t => !t.parentId && !t.completed);
  const gainHeader = document.getElementById('gain-header');
  if (gainHeader && rootTasks.length > 0) {
    const firstRoot = rootTasks[0];
    if (firstRoot.resourceUnit) {
      gainHeader.textContent = `+, ${firstRoot.resourceUnit}`;
    } else {
      gainHeader.textContent = '+';
    }
  }
  
  if (!preserveExisting) {
    const svg = container.querySelector('#hierarchy-svg');
    container.innerHTML = '';
    if (svg) container.appendChild(svg);
    activeTaskId = null;
  } else {
    const currentIds = new Set(todos.filter(t => !t.completed).map(t => t.id));
    container.querySelectorAll('[data-task-id]').forEach(el => {
      if (!currentIds.has(el.dataset.taskId)) {
        el.remove();
        if (activeTaskId === el.dataset.taskId) activeTaskId = null;
      }
    });
  }
  
  todos.filter(t => !t.parentId && !t.completed && isTaskVisible(t, todos))
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .forEach(task => renderTask(task, todos, container));
  
  requestAnimationFrame(() => {
    container.querySelectorAll('.task-content').forEach(el => {
      if (el !== focusedElement) autoResize(el);
    });
    setTimeout(() => drawHierarchyLines(todos, container), 50);
  });
}

const container = document.getElementById('todo-container');
let scrollTimeout = null;
if (container) {
  container.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      if (currentTodos) drawHierarchyLines(currentTodos, container);
    }, 50);
  });
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.task')) {
    document.querySelectorAll('.task').forEach(t => t.classList.remove('active'));
    activeTaskId = null;
  }
});

document.addEventListener('keydown', (e) => {
  if (focusedElement && document.activeElement === focusedElement) {
    return;
  }
  
  if (!activeTaskId) return;
  
  if (matchesHotkey(e, todoHotkeys.addSubtask)) {
    e.preventDefault();
    if (window.todoApi) {
      window.todoApi.createTodo('', activeTaskId).then(newTask => {
        refreshTodos().then(() => {
          if (newTask) focusTask(newTask.id);
        });
      });
    }
  } else if (matchesHotkey(e, todoHotkeys.execute)) {
    e.preventDefault();
    const task = currentTodos.find(t => t.id === activeTaskId);
    if (window.todoApi && task) {
      window.todoApi.startTimer(task.motivationWord || null);
    }
  } else if (matchesHotkey(e, todoHotkeys.complete)) {
    e.preventDefault();
    if (window.todoApi) {
      window.todoApi.updateTodo(activeTaskId, { completed: true, completedAt: Date.now() }).then(() => refreshTodos());
    }
  }
});

if (window.todoApi) {
  window.todoApi.getTodoHotkeys().then(hotkeys => {
    todoHotkeys = hotkeys;
  });
  
  window.todoApi.getTodos().then(async todos => {
    if (todos.length === 0) {
      try {
        await window.todoApi.loadLargeDemo();
        todos = await window.todoApi.getTodos();
      } catch {
        todos = [];
      }
    }
    renderTasks(todos, false);
  });
  
  window.todoApi.onTodosUpdated((todos) => {
    renderTasks(todos, focusedElement !== null);
  });
}

window.loadLargeDemo = async function() {
  if (window.todoApi) {
    await window.todoApi.loadLargeDemo();
    renderTasks(await window.todoApi.getTodos(), false);
  }
};

// Add root task button handler
function setupAddRootTaskButton() {
  const addRootTaskBtn = document.getElementById('add-root-task-btn');
  if (addRootTaskBtn) {
    addRootTaskBtn.addEventListener('click', async () => {
      if (window.todoApi) {
        const newTask = await window.todoApi.createTodo('', null);
        await refreshTodos();
        if (newTask) focusTask(newTask.id);
      }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupAddRootTaskButton);
} else {
  setupAddRootTaskButton();
}
