import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
import { TaskItem } from './TaskItem';
import { Plus, Check } from 'lucide-react';
import { Todo } from '../types';

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
  const { todos, isLoaded, reorderTodos, addTodo, updateTodo, loadTodosAction } = useTodoStore();
  const [activeDrop, setActiveDrop] = useState<{ id: string; zone: DropZone } | null>(null);

  // Initial load
  useEffect(() => {
    if (!isLoaded) {
      loadTodosAction();
    }
  }, [isLoaded, loadTodosAction]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const flattenedTasks = useMemo(() => getFlattenedTasks(todos), [todos]);

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
