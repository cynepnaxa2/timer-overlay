import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragMoveEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useTodoStore } from '../store/todoStore';
import { useSettingsStore } from '../store/settingsStore';
import { TaskItem } from './TaskItem';
import { Plus, Check } from 'lucide-react';
import { Todo } from '../types';
import { normalizeHotkey } from '../utils/hotkeys';

export type DropZone = 'top' | 'center' | 'bottom' | null;

const getFlattenedTasks = (allTodos: Todo[], parentId: string | null = null, depth = 0): (Todo & { depth: number })[] => {
  return allTodos
    .filter(t => t.parentId === parentId)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .reduce((acc, task) => {
      acc.push({ ...task, depth });
      if (!task.collapsed) {
        acc.push(...getFlattenedTasks(allTodos, task.id, depth + 1));
      }
      return acc;
    }, [] as (Todo & { depth: number })[]);
};

export const TodoWindow: React.FC = () => {
  const { todos, isLoaded, reorderTodos, addTodo, updateTodo, deleteTodo, loadTodosAction } = useTodoStore();
  const { settings, setSettings } = useSettingsStore();
  const [activeDrop, setActiveDrop] = useState<{ id: string; zone: DropZone } | null>(null);
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const [confirmDeleteTaskId, setConfirmDeleteTaskId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset delete confirmation when focus changes
  useEffect(() => {
    setConfirmDeleteTaskId(null);
  }, [focusedTaskId]);

  // Initial load
  useEffect(() => {
    if (!isLoaded) {
      loadTodosAction();
    }

    if (window.todoApi) {
      window.todoApi.onSettingsUpdated((newSettings: any) => {
        setSettings(newSettings);
      });
    }
  }, [isLoaded, loadTodosAction, setSettings]);

  const flattenedTasks = useMemo(() => getFlattenedTasks(todos), [todos]);

  // Global hotkeys handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      const pressedHotkey = normalizeHotkey(e);
      const hotkeys = settings.todoHotkeys;

      // When typing in an input/textarea, block single-key hotkeys (like Delete or Backspace)
      const isSingleKey = !e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey;
      if (isInput && isSingleKey) return;

      const actions: Record<string, () => void> = {
        [hotkeys.addRootTask]: () => {
          const newTodo = addTodo('');
          setFocusedTaskId(newTodo.id);
        },
        [hotkeys.addSubtask]: () => {
          if (focusedTaskId) {
            const newTodo = addTodo('', focusedTaskId);
            updateTodo(focusedTaskId, { collapsed: false });
            setFocusedTaskId(newTodo.id);
          }
        },
        [hotkeys.addSiblingTask]: () => {
          if (focusedTaskId) {
            const focusedTask = todos.find(t => t.id === focusedTaskId);
            if (focusedTask) {
              const newTodo = addTodo('', focusedTask.parentId, focusedTaskId);
              setFocusedTaskId(newTodo.id);
            }
          } else {
            const newTodo = addTodo('');
            setFocusedTaskId(newTodo.id);
          }
        },
        [hotkeys.execute]: () => {
          if (focusedTaskId) {
            const focusedTask = todos.find(t => t.id === focusedTaskId);
            if (focusedTask && window.todoApi) {
              (window.todoApi as any).startTimer(focusedTask.content);
            }
          }
        },
        [hotkeys.complete]: () => {
          if (focusedTaskId) {
            const focusedTask = todos.find(t => t.id === focusedTaskId);
            if (focusedTask) updateTodo(focusedTaskId, { completed: !focusedTask.completed });
          }
        },
        [hotkeys.navNext]: () => {
          const index = flattenedTasks.findIndex(t => t.id === focusedTaskId);
          const nextIndex = (index + 1) % flattenedTasks.length;
          if (flattenedTasks.length > 0) setFocusedTaskId(flattenedTasks[nextIndex].id);
        },
        [hotkeys.navPrev]: () => {
          const index = flattenedTasks.findIndex(t => t.id === focusedTaskId);
          const prevIndex = (index - 1 + flattenedTasks.length) % flattenedTasks.length;
          if (flattenedTasks.length > 0) setFocusedTaskId(flattenedTasks[prevIndex].id);
        },
        [hotkeys.navChild]: () => {
          if (focusedTaskId) {
            const children = todos.filter(t => t.parentId === focusedTaskId);
            if (children.length > 0) {
              updateTodo(focusedTaskId, { collapsed: false });
              const sortedChildren = [...children].sort((a, b) => (a.order || 0) - (b.order || 0));
              setFocusedTaskId(sortedChildren[0].id);
            }
          }
        },
        [hotkeys.navParent]: () => {
          if (focusedTaskId) {
            const focusedTask = todos.find(t => t.id === focusedTaskId);
            if (focusedTask && focusedTask.parentId) setFocusedTaskId(focusedTask.parentId);
          }
        },
        [hotkeys.deleteTask]: () => {
          if (!focusedTaskId) return;
          setConfirmDeleteTaskId(prev => {
            if (prev === focusedTaskId) {
              const index = flattenedTasks.findIndex(t => t.id === focusedTaskId);
              deleteTodo(focusedTaskId);
              if (flattenedTasks.length > 1) {
                const nextIndex = index === flattenedTasks.length - 1 ? index - 1 : index;
                const nextTask = flattenedTasks.filter(t => t.id !== focusedTaskId)[nextIndex];
                if (nextTask) setTimeout(() => setFocusedTaskId(nextTask.id), 0);
              }
              return null;
            }
            return focusedTaskId;
          });
        }
      };

      if (actions[pressedHotkey]) {
        e.preventDefault();
        actions[pressedHotkey]();
      } else if (e.key === 'Backspace' && !isInput) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.todoHotkeys, focusedTaskId, todos, flattenedTasks, addTodo, updateTodo, deleteTodo]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const calculateZone = useCallback((event: DragMoveEvent | DragEndEvent): DropZone => {
    const { active, over } = event;
    if (!over || active.id === over.id) return null;

    const overRect = over.rect;
    const activeRect = active.rect.current.translated;
    if (!activeRect) return null;

    const activeCenterY = activeRect.top + activeRect.height / 2;
    const relativeY = activeCenterY - overRect.top;
    const overHeight = overRect.height;

    if (relativeY < overHeight * 0.33) return 'top';
    if (relativeY > overHeight * 0.66) return 'bottom';
    return 'center';
  }, []);

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    const { over } = event;
    if (over) {
      const zone = calculateZone(event);
      setActiveDrop({ id: over.id as string, zone });
    } else {
      setActiveDrop(null);
    }
  }, [calculateZone]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDrop(null);

    if (over && active.id !== over.id) {
      const activeTask = todos.find(t => t.id === active.id);
      const overTask = todos.find(t => t.id === over.id);
      
      if (activeTask && overTask) {
        const zone = calculateZone(event);

        if (zone === 'center') {
          updateTodo(activeTask.id, { parentId: overTask.id, order: 0 });
          updateTodo(overTask.id, { collapsed: false });
        } else {
          const newParentId = overTask.parentId;
          const isAfter = zone === 'bottom';

          if (activeTask.parentId !== newParentId) {
            updateTodo(activeTask.id, { parentId: newParentId });
          }

          const targetSiblings = todos
            .filter(t => t.parentId === newParentId && t.id !== activeTask.id)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

          const overIndex = targetSiblings.findIndex(t => t.id === overTask.id);
          const reordered = [...targetSiblings];
          const insertAt = isAfter ? overIndex + 1 : overIndex;
          
          reordered.splice(insertAt, 0, activeTask);
          reorderTodos(reordered.map(t => t.id));
        }
      }
    }
  }, [todos, calculateZone, updateTodo, reorderTodos]);

  const onDragCancel = useCallback(() => setActiveDrop(null), []);

  if (!isLoaded) {
    return <div className="bg-[#0f0f0f] text-slate-500 p-8 text-center h-screen">Loading tasks...</div>;
  }

  return (
    <div className="bg-[#0f0f0f]/95 text-slate-200 min-h-screen font-sans overflow-y-auto">
      <div className="flex items-center gap-1 p-2 bg-[#1a1a1a] border-b border-[#2a2a2a] sticky top-0 z-20">
        <button 
          onClick={() => addTodo('')}
          className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded-full transition-colors active:scale-95"
          aria-label="New Task"
        >
          <Plus className="w-4 h-4 text-white" />
        </button>
        <button className="p-1.5 hover:bg-white/10 rounded-full transition-colors ml-1 active:scale-95">
          <Check className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <div className="max-w-full">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          onDragCancel={onDragCancel}
        >
          <SortableContext 
            items={flattenedTasks.map(t => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col">
              {flattenedTasks.map(task => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  depth={task.depth} 
                  dropZone={activeDrop?.id === task.id ? activeDrop.zone : null}
                  isFocused={focusedTaskId === task.id}
                  isConfirmingDelete={confirmDeleteTaskId === task.id}
                  onFocus={() => setFocusedTaskId(task.id)}
                  onDelete={() => {
                    if (confirmDeleteTaskId === task.id) {
                      deleteTodo(task.id);
                      setConfirmDeleteTaskId(null);
                    } else {
                      setConfirmDeleteTaskId(task.id);
                    }
                  }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        
        {todos.length === 0 && (
          <div className="p-8 text-slate-500 text-sm text-center italic">
            No tasks yet. Create one to get started!
          </div>
        )}
      </div>
    </div>
  );
};
