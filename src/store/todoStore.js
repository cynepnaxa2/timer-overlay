const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { randomUUID } = require('crypto');

// Types will be inferred or used via JSDoc if we keep it commonjs for now, 
// but we want to move to TS. Since this is main process code, we can use 
// ts-node or just keep it as JS but with better types. 
// Actually, the plan says refactor to TypeScript.
// For the main process, we'll keep using require for now to avoid breaking electron setup,
// but we'll use TS features where possible.

function getTodosPath() {
  const { readSettings } = require('./settingsStore');
  const settings = readSettings();
  
  if (settings.syncFolderPath && fs.existsSync(settings.syncFolderPath)) {
    return path.join(settings.syncFolderPath, 'todos.json');
  }
  
  const dir = app.getPath('userData');
  return path.join(dir, 'todos.json');
}

function readTodos() {
  try {
    const file = getTodosPath();
    if (!fs.existsSync(file)) {
      return [];
    }
    const raw = fs.readFileSync(file, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    
    // Import initial matrix to ensure it's available for migration
    const { INITIAL_RESOURCE_MATRIX } = require('../config/resources');

    const seenIds = new Set();
    const uniqueTodos = [];
    
    for (const todo of parsed) {
      // Force ID to string
      if (!todo.id) {
        const { randomUUID } = require('crypto');
        todo.id = randomUUID();
      } else {
        todo.id = String(todo.id);
      }
      
      // Force parentId to string or null (handle empty string case)
      if (todo.parentId === undefined || todo.parentId === "" || todo.parentId === "null") {
        todo.parentId = null;
      } else if (todo.parentId !== null) {
        todo.parentId = String(todo.parentId);
      }
      
      if (seenIds.has(todo.id)) {
        console.warn(`Duplicate todo ID found: ${todo.id}. Generating new ID.`);
        const { randomUUID } = require('crypto');
        todo.id = randomUUID();
      }
      seenIds.add(todo.id);

      if (todo.collapsed === undefined) todo.collapsed = false;
      if (todo.subtaskType === undefined) todo.subtaskType = 'list';
      if (todo.resources === undefined) {
        todo.resources = JSON.parse(JSON.stringify(INITIAL_RESOURCE_MATRIX));
      }
      uniqueTodos.push(todo);
    }

    return uniqueTodos;
  } catch {
    return [];
  }
}

function writeTodos(todos) {
  // #region agent log
  const logMain = (msg, data = {}, hypothesisId = 'H_IPC_RACE') => {
    const logEntry = JSON.stringify({
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      location: 'src/store/todoStore.js:writeTodos',
      message: msg,
      data,
      sessionId: 'debug-session',
      hypothesisId
    }) + '\n';
    try {
      const fs = require('fs');
      const path = require('path');
      const logPath = path.join(process.cwd(), '.cursor', 'debug.log');
      fs.appendFileSync(logPath, logEntry);
    } catch (e) {}
  };
  // #endregion
  logMain('writing todos to disk', { count: todos.length });
  const file = getTodosPath();
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(todos, null, 2), 'utf8');
    return todos;
  } catch {
    return [];
  }
}

function createTodo(content, parentId = null, afterId = null) {
  const todos = readTodos();
  const { INITIAL_RESOURCE_MATRIX } = require('../config/resources');
  
  const siblings = todos.filter(t => t.parentId === parentId).sort((a, b) => (a.order || 0) - (b.order || 0));
  
  let newOrder = 0;
  if (afterId) {
    const afterTask = todos.find(t => t.id === afterId);
    if (afterTask) {
      newOrder = (afterTask.order || 0) + 1;
      todos.forEach(t => {
        if (t.parentId === parentId && (t.order || 0) >= newOrder) {
          t.order = (t.order || 0) + 1;
        }
      });
    } else {
      newOrder = siblings.length > 0 ? Math.max(...siblings.map(t => t.order || 0)) + 1 : 0;
    }
  } else {
    newOrder = siblings.length > 0 ? Math.max(...siblings.map(t => t.order || 0)) + 1 : 0;
  }
  
  const newTodo = {
    id: randomUUID(),
    content: content || '',
    parentId: parentId,
    type: 'task',
    completed: false,
    completedAt: null,
    order: newOrder,
    createdAt: Date.now(),
    motivationWord: null,
    collapsed: false,
    subtaskType: 'list',
    economics: { cost: 0, gain: 0, roi: 0 },
    resources: JSON.parse(JSON.stringify(INITIAL_RESOURCE_MATRIX)),
    context: [],
    metadata: {},
    isArchived: false
  };
  
  todos.push(newTodo);
  writeTodos(todos);
  return newTodo;
}

function updateTodo(id, updates) {
  // #region agent log
  const logMain = (msg, data = {}, hypothesisId = 'H_IPC_RACE') => {
    const logEntry = JSON.stringify({
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      location: 'src/store/todoStore.js:updateTodo',
      message: msg,
      data,
      sessionId: 'debug-session',
      hypothesisId
    }) + '\n';
    try {
      const fs = require('fs');
      const path = require('path');
      const logPath = path.join(process.cwd(), '.cursor', 'debug.log');
      fs.appendFileSync(logPath, logEntry);
    } catch (e) {}
  };
  // #endregion
  logMain('updateTodo start', { id, updates });
  const todos = readTodos();
  const index = todos.findIndex(t => t.id === id);
  if (index === -1) {
    logMain('updateTodo: task not found', { id });
    return null;
  }
  
  const updated = { ...todos[index], ...updates };
  
  if (updates.economics) {
    const cost = updated.economics.cost || 0;
    const gain = updated.economics.gain || 0;
    updated.economics.roi = cost > 0 ? gain / cost : gain;
  }

  todos[index] = updated;
  writeTodos(todos);
  return todos[index];
}

function deleteTodo(id) {
  const todos = readTodos();
  const toDelete = new Set();
  
  function collectIds(targetId) {
    toDelete.add(targetId);
    todos.forEach(t => {
      if (t.parentId === targetId) collectIds(t.id);
    });
  }
  
  collectIds(id);
  const filtered = todos.filter(t => !toDelete.has(t.id));
  writeTodos(filtered);
  return filtered;
}

function reorderTodos(todoIds) {
  // #region agent log
  const logMain = (msg, data = {}, hypothesisId = 'H_IPC_RACE') => {
    const logEntry = JSON.stringify({
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      location: 'src/store/todoStore.js:reorderTodos',
      message: msg,
      data,
      sessionId: 'debug-session',
      hypothesisId
    }) + '\n';
    try {
      const fs = require('fs');
      const path = require('path');
      const logPath = path.join(process.cwd(), '.cursor', 'debug.log');
      fs.appendFileSync(logPath, logEntry);
    } catch (e) {}
  };
  // #endregion
  logMain('reorderTodos start', { todoIds });
  const todos = readTodos();
  
  const siblingSet = new Set(todoIds);
  let orderMap = new Map(todoIds.map((id, index) => [id, index]));
  
  todos.forEach(t => {
    if (siblingSet.has(t.id)) {
      t.order = orderMap.get(t.id);
    }
  });
  
  writeTodos(todos);
  return todos;
}

function loadTodosFromFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return false;
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return false;
    writeTodos(parsed);
    return true;
  } catch {
    return false;
  }
}

function ensureDemoTodos() {
  const todos = readTodos();
  if (todos.length > 0) return;
  const { INITIAL_RESOURCE_MATRIX } = require('../config/resources');
  
  const demoTodos = [
    {
      id: randomUUID(),
      content: 'Добро пожаловать в It\'s time!',
      parentId: null,
      type: 'task',
      completed: false,
      completedAt: null,
      order: 0,
      createdAt: Date.now(),
      motivationWord: null,
      collapsed: false,
      subtaskType: 'list',
      economics: { cost: 0, gain: 0, roi: 0 },
      resources: JSON.parse(JSON.stringify(INITIAL_RESOURCE_MATRIX)),
      context: [],
      metadata: {},
      isArchived: false
    }
  ];
  writeTodos(demoTodos);
}

function moveTodo(draggingId, targetId, position) {
  // #region agent log
  const logMain = (msg, data = {}, hypothesisId = 'H_ROBUST_MOVE') => {
    const logEntry = JSON.stringify({
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      location: 'src/store/todoStore.js:moveTodo',
      message: msg,
      data,
      sessionId: 'debug-session',
      hypothesisId
    }) + '\n';
    try {
      const fs = require('fs');
      const path = require('path');
      const logPath = path.join(process.cwd(), '.cursor', 'debug.log');
      fs.appendFileSync(logPath, logEntry);
    } catch (e) {}
  };
  // #endregion
  
  logMain('moveTodo request received', { draggingId, targetId, position });
  const todos = readTodos();
  
  // Ensure we are working with strings
  const dId = String(draggingId);
  const tId = String(targetId);
  
  const draggingTask = todos.find(t => t.id === dId);
  const targetTask = todos.find(t => t.id === tId);
  
  if (!draggingTask || !targetTask || dId === tId) {
    logMain('moveTodo validation failed', { hasDragging: !!draggingTask, hasTarget: !!targetTask, sameId: dId === tId });
    return todos;
  }

  // Hierarchy check to prevent cycles
  function isDescendant(ancestorId, taskId) {
    const t = todos.find(x => x.id === taskId);
    if (!t || !t.parentId) return false;
    if (t.parentId === ancestorId) return true;
    return isDescendant(ancestorId, t.parentId);
  }

  if (isDescendant(dId, tId)) {
    logMain('moveTodo rejected: cycle detected');
    return todos;
  }

  const isInside = position === 'middle';
  const isAfter = position === 'bottom';
  
  const newParentId = isInside ? targetTask.id : targetTask.parentId;
  
  // 1. Update the parentId of the dragging task
  draggingTask.parentId = newParentId;
  
  // 2. Re-calculate order for all siblings of the new parent
  // We include ALL siblings (even completed ones) to avoid collisions
  const siblings = todos
    .filter(t => t.parentId === newParentId && t.id !== dId)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
    
  let insertIndex;
  if (isInside) {
    insertIndex = siblings.length; // Drop into the end of child list
  } else {
    insertIndex = siblings.findIndex(t => t.id === tId);
    if (isAfter) insertIndex++;
  }
  
  if (insertIndex === -1) insertIndex = siblings.length;
  
  // Insert the task at the calculated position
  siblings.splice(insertIndex, 0, draggingTask);
  
  // Update order property for all siblings
  siblings.forEach((task, index) => {
    task.order = index;
  });
  
  logMain('moveTodo successful', { newParentId, insertIndex });
  writeTodos(todos);
  return todos;
}

module.exports = {
  readTodos,
  writeTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  reorderTodos,
  moveTodo,
  loadTodosFromFile,
  ensureDemoTodos
};
