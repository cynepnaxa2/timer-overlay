import { create } from 'zustand';
import { Todo } from '../../types/todo';
import { isDescendant, getAllDescendants, isTaskVisible } from '../../utils/hierarchy';

interface TodoState {
  todos: Todo[];
  activeTaskId: string | null;
  draggingTaskId: string | null;
  dragOverTaskId: string | null;
  dropZone: 'top' | 'middle' | 'bottom' | null;
  showCompleted: boolean;
  isLoading: boolean;
  
  setTodos: (todos: Todo[]) => void;
  setActiveTaskId: (id: string | null) => void;
  setDraggingTaskId: (id: string | null) => void;
  setDragOverTaskId: (id: string | null) => void;
  setDropZone: (zone: 'top' | 'middle' | 'bottom' | null) => void;
  toggleShowCompleted: () => void;
  setLoading: (loading: boolean) => void;
  
  refreshTodos: () => Promise<void>;
  updateTodo: (id: string, updates: Partial<Todo>) => Promise<void>;
  createTodo: (content: string, parentId?: string | null, afterId?: string | null) => Promise<Todo | null>;
  deleteTodo: (id: string) => Promise<void>;
  toggleCollapse: (id: string) => Promise<void>;
  toggleSubtaskType: (id: string) => Promise<void>;
  reorderTodos: (ids: string[]) => Promise<void>;
  moveTodo: (id: string, targetParentId: string | null, siblingIds: string[]) => Promise<void>;
  handleTaskDrop: (draggingId: string, targetId: string, position: 'top' | 'middle' | 'bottom') => Promise<void>;
}

declare global {
  interface Window {
    todoApi: any;
    todoHierarchy: any;
  }
}

export const useTodoStore = create<TodoState>((set, get) => ({
  todos: [],
  activeTaskId: null,
  draggingTaskId: null,
  dragOverTaskId: null,
  dropZone: null,
  showCompleted: false,
  isLoading: true,
  
  setTodos: (todos) => set({ todos }),
  setActiveTaskId: (id) => set({ activeTaskId: id }),
  setDraggingTaskId: (id) => set({ draggingTaskId: id }),
  setDragOverTaskId: (id) => set({ dragOverTaskId: id }),
  setDropZone: (zone) => set({ dropZone: zone }),
  toggleShowCompleted: () => set((state) => ({ showCompleted: !state.showCompleted })),
  setLoading: (loading) => set({ isLoading: loading }),
  
  refreshTodos: async () => {
    // #region agent log
    const log = (msg: string, data = {}) => {
      fetch('http://127.0.0.1:7245/ingest/f23b35c1-164f-4809-ab92-7ad83d07b816', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'useTodoStore.ts',
          message: msg,
          data,
          timestamp: Date.now(),
          sessionId: 'debug-session',
          hypothesisId: 'H_STORE_INIT'
        })
      }).catch(() => {});
    };
    // #endregion

    log('refreshTodos called');
    set({ isLoading: true });
    if (!window.todoApi) {
      log('todoApi not found');
      set({ isLoading: false });
      return;
    }
    try {
      const todos = await window.todoApi.getTodos();
      log('getTodos success', { count: todos?.length });
      set({ todos, isLoading: false });
    } catch (err) {
      log('getTodos failed', { error: String(err) });
      set({ isLoading: false });
    }
  },
  
  updateTodo: async (id, updates) => {
    await window.todoApi.updateTodo(id, updates);
    // Optimization: update local state immediately if needed, but for now just refresh
    const todos = await window.todoApi.getTodos();
    set({ todos });
  },
  
  createTodo: async (content, parentId = null, afterId = null) => {
    const newTodo = await window.todoApi.createTodo(content, parentId, afterId);
    const todos = await window.todoApi.getTodos();
    set({ todos });
    return newTodo;
  },
  
  deleteTodo: async (id) => {
    await window.todoApi.deleteTodo(id);
    const todos = await window.todoApi.getTodos();
    set({ todos });
  },
  
  toggleCollapse: async (id) => {
    await window.todoApi.toggleTaskCollapse(id);
    const todos = await window.todoApi.getTodos();
    set({ todos });
  },
  
  toggleSubtaskType: async (id) => {
    await window.todoApi.toggleSubtaskType(id);
    const todos = await window.todoApi.getTodos();
    set({ todos });
  },
  
  reorderTodos: async (ids) => {
    const todos = await window.todoApi.reorderTodos(ids);
    set({ todos });
  },

  moveTodo: async (draggingId: string, targetId: string, position: 'top' | 'middle' | 'bottom') => {
    await window.todoApi.moveTodo(draggingId, targetId, position);
    // Backend notifies us via 'todos-updated' event, but we can also refresh manually
    await get().refreshTodos();
  },

  handleTaskDrop: async (draggingId, targetId, position) => {
    // #region agent log
    const log = (msg: string, data = {}) => {
      fetch('http://127.0.0.1:7245/ingest/f23b35c1-164f-4809-ab92-7ad83d07b816', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'useTodoStore.ts:handleTaskDrop',
          message: msg,
          data,
          timestamp: Date.now(),
          sessionId: 'debug-session',
          hypothesisId: 'H_BACKEND_MOVE'
        })
      }).catch(() => {});
    };
    // #endregion
    
    log('frontend: handleTaskDrop request', { draggingId, targetId, position });
    
    const state = get();
    // Pre-flight check to avoid obvious self-drops
    if (draggingId === targetId) return;

    // Check if draggingTask or targetTask exist in local state
    const draggingTask = state.todos.find(t => t.id === draggingId);
    const targetTask = state.todos.find(t => t.id === targetId);
    if (!draggingTask || !targetTask) {
      log('frontend: dragging or target task not found in state', { hasDragging: !!draggingTask, hasTarget: !!targetTask });
      return;
    }

    // Call backend to handle the heavy lifting
    await state.moveTodo(draggingId, targetId, position);
  }
}));
