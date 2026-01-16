import React from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useTodoStore } from '../store/todoStore';
import { TaskItem } from './TaskItem';
import { Plus, Check } from 'lucide-react';
import { Todo } from '../types';

export const TodoWindow = () => {
  const { todos, reorderTodos, addTodo, updateTodo } = useTodoStore();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Helper to flatten the hierarchy for dnd-kit
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

  const flattenedTasks = getFlattenedTasks(todos);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const activeTask = todos.find(t => t.id === active.id);
      const overTask = todos.find(t => t.id === over.id);
      
      if (activeTask && overTask) {
        const oldParentId = activeTask.parentId;
        const newParentId = overTask.parentId;

        // Get all siblings in the target parent group
        const targetSiblings = todos
          .filter(t => t.parentId === newParentId)
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        if (oldParentId === newParentId) {
          // Case 1: Moving within the same parent - use arrayMove
          const oldIndex = targetSiblings.findIndex(t => t.id === active.id);
          const newIndex = targetSiblings.findIndex(t => t.id === over.id);
          const reordered = arrayMove(targetSiblings, oldIndex, newIndex);
          reorderTodos(reordered.map(t => t.id));
        } else {
          // Case 2: Moving to a different parent
          updateTodo(activeTask.id, { parentId: newParentId });
          
          const overIndex = targetSiblings.findIndex(t => t.id === overTask.id);
          const reordered = [...targetSiblings];
          
          // Determine if we should insert before or after based on visual flattened list
          const activeFlattenedIndex = flattenedTasks.findIndex(t => t.id === active.id);
          const overFlattenedIndex = flattenedTasks.findIndex(t => t.id === over.id);
          
          const insertAt = overFlattenedIndex > activeFlattenedIndex ? overIndex + 1 : overIndex;
          
          reordered.splice(insertAt, 0, activeTask);
          reorderTodos(reordered.map(t => t.id));
        }
      }
    }
  };

  return (
    <div className="bg-[#0f0f0f]/95 text-slate-200 min-h-screen font-sans">
      <div className="flex items-center gap-1 p-2 bg-[#1a1a1a] border-b border-[#2a2a2a] sticky top-0 z-20">
        <button 
          onClick={() => addTodo('')}
          className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded-full transition-colors"
          aria-label="New Task"
        >
          <Plus className="w-4 h-4 text-white" />
        </button>
        <button className="p-1.5 hover:bg-white/10 rounded-full transition-colors ml-1">
          <Check className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <div className="max-w-full">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={flattenedTasks.map(t => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col">
              {flattenedTasks.map(task => (
                <TaskItem key={task.id} task={task} depth={task.depth} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        
        {todos.length === 0 && (
          <div className="p-8 text-slate-500 text-sm">
            No tasks yet. Create one to get started!
          </div>
        )}
      </div>
    </div>
  );
};
