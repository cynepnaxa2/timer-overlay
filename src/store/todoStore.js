const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { randomUUID } = require('crypto');

function getTodosPath() {
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
    return parsed.map(todo => {
      if (todo.collapsed === undefined) {
        todo.collapsed = false;
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

function createTodo(content, parentId = null) {
  const todos = readTodos();
  
  // Find siblings to determine correct order
  const siblings = todos.filter(t => t.parentId === parentId);
  const maxOrder = siblings.length > 0 
    ? Math.max(...siblings.map(t => t.order || 0))
    : -1;
  
  const newTodo = {
    id: randomUUID(),
    content: content || '',
    parentId: parentId,
    type: 'task',
    completed: false,
    completedAt: null,
    order: maxOrder + 1,
    createdAt: Date.now(),
    motivationWord: null,
    collapsed: false,
    economics: {
      cost: 0,
      gain: 0,
      roi: 0
    },
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
  if (index === -1) {
    return null;
  }
  
  const updated = { ...todos[index], ...updates };
  
  // Recalculate ROI if economics changed
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
      if (t.parentId === targetId) {
        collectIds(t.id);
      }
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
    if (todoMap.has(id)) {
      todoMap.get(id).order = index;
    }
  });
  
  const reordered = Array.from(todoMap.values());
  writeTodos(reordered);
  return reordered;
}

function loadTodosFromFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return false;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return false;
    }
    writeTodos(parsed);
    return true;
  } catch {
    return false;
  }
}

function ensureDemoTodos() {
  const todos = readTodos();
  if (todos.length > 0) {
    return;
  }
  
  const demoTodos = [
    {
      id: randomUUID(),
      content: 'Добро пожаловать в AI Todo List!',
      parentId: null,
      completed: false,
      completedAt: null,
      order: 0,
      createdAt: Date.now(),
      motivationWord: null,
      collapsed: false
    },
    {
      id: randomUUID(),
      content: 'Это пример корневой задачи (фиолетовый цвет)',
      parentId: null,
      completed: false,
      completedAt: null,
      order: 1,
      createdAt: Date.now(),
      motivationWord: null,
      collapsed: false
    },
    {
      id: randomUUID(),
      content: 'Это подзадача первого уровня (синий цвет)',
      parentId: null,
      completed: false,
      completedAt: null,
      order: 2,
      createdAt: Date.now(),
      motivationWord: null,
      collapsed: false
    }
  ];
  
  const secondTaskId = demoTodos[1].id;
  demoTodos[2].parentId = secondTaskId;
  
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
