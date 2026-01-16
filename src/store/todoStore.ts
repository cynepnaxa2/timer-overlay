import { create } from 'zustand';
import { Todo } from '../types';
import { saveTodos } from '../utils/ipc';

interface TodoState {
  todos: Todo[];
  setTodos: (todos: Todo[]) => void;
  addTodo: (content: string, parentId?: string | null, afterId?: string | null) => Todo;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  deleteTodo: (id: string) => void;
  reorderTodos: (todoIds: string[]) => void;
}

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15);
};

export const useTodoStore = create<TodoState>((set, get) => ({
  todos: [],
  
  setTodos: (todos) => set({ todos }),
  
  addTodo: (content, parentId = null, afterId = null) => {
    const { todos } = get();
    const siblings = todos.filter(t => t.parentId === parentId).sort((a, b) => (a.order || 0) - (b.order || 0));
    
    let newOrder = 0;
    const newTodos = [...todos];

    if (afterId) {
      const afterTaskIndex = newTodos.findIndex(t => t.id === afterId);
      if (afterTaskIndex !== -1) {
        newOrder = (newTodos[afterTaskIndex].order || 0) + 1;
        for (let i = 0; i < newTodos.length; i++) {
          const t = newTodos[i];
          if (t.parentId === parentId && (t.order || 0) >= newOrder) {
            newTodos[i] = { ...t, order: (t.order || 0) + 1 };
          }
        }
      } else {
        newOrder = siblings.length > 0 ? Math.max(...siblings.map(t => t.order || 0)) + 1 : 0;
      }
    } else {
      newOrder = siblings.length > 0 ? Math.max(...siblings.map(t => t.order || 0)) + 1 : 0;
    }
    
    const newTodo: Todo = {
      id: generateId(),
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
      context: [],
      metadata: {},
      isArchived: false,
    };
    
    const finalTodos = [...newTodos, newTodo];
    set({ todos: finalTodos });
    saveTodos(finalTodos);
    return newTodo;
  },
  
  updateTodo: (id, updates) => {
    const { todos } = get();
    const newTodos = todos.map(t => t.id === id ? { ...t, ...updates } : t);
    set({ todos: newTodos });
    saveTodos(newTodos);
  },
  
  deleteTodo: (id) => {
    const { todos } = get();
    const toDelete = new Set<string>();
    
    const collectIds = (targetId: string) => {
      toDelete.add(targetId);
      todos.forEach(t => {
        if (t.parentId === targetId) {
          collectIds(t.id);
        }
      });
    };
    
    collectIds(id);
    
    const filtered = todos.filter(t => !toDelete.has(t.id));
    set({ todos: filtered });
    saveTodos(filtered);
  },
  
  reorderTodos: (todoIds) => {
    const { todos } = get();
    const todoMap = new Map(todos.map(t => [t.id, t]));
    
    todoIds.forEach((id, index) => {
      if (todoMap.has(id)) {
        const todo = todoMap.get(id)!;
        todoMap.set(id, { ...todo, order: index });
      }
    });
    
    const reordered = Array.from(todoMap.values());
    set({ todos: reordered });
    saveTodos(reordered);
  },
}));
