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

    return parsed.map(todo => {
      if (todo.collapsed === undefined) todo.collapsed = false;
      if (todo.subtaskType === undefined) todo.subtaskType = 'list';
      if (todo.resources === undefined) {
        todo.resources = JSON.parse(JSON.stringify(INITIAL_RESOURCE_MATRIX));
      }
      return todo;
    });
  } catch {
    return [];
  }
}

function writeTodos(todos) {
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
  const todos = readTodos();
  const index = todos.findIndex(t => t.id === id);
  if (index === -1) return null;
  
  const updated = { ...todos[index], ...updates };
  
  if (updates.economics) {
    const cost = updated.economics.cost || 0;
    const gain = updated.economics.gain || 0;
    updated.economics.roi = cost > 0 ? gain / cost : gain;
  }

  // Priority score calculation could go here, but we'll do it in the renderer for now 
  // or add it as a utility.

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
  const todos = readTodos();
  const todoMap = new Map(todos.map(t => [t.id, t]));
  todoIds.forEach((id, index) => {
    if (todoMap.has(id)) todoMap.get(id).order = index;
  });
  const reordered = Array.from(todoMap.values());
  writeTodos(reordered);
  return reordered;
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

module.exports = {
  readTodos,
  writeTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  reorderTodos,
  loadTodosFromFile,
  ensureDemoTodos
};
