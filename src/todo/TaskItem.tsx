import React, { memo, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Todo } from '../types';
import { useTodoStore } from '../store/todoStore';
import { DropZone } from './TodoWindow';
import { 
  ChevronRight, 
  ChevronDown, 
  Check, 
  X, 
  Play, 
  Plus, 
  CornerDownRight,
  GripVertical
} from 'lucide-react';

interface Props {
  task: Todo;
  depth: number;
  dropZone: DropZone;
  isFocused: boolean;
  onFocus: () => void;
}

export const TaskItem: React.FC<Props> = memo(({ task, depth, dropZone, isFocused, onFocus }) => {
  const { updateTodo, deleteTodo, todos, addTodo } = useTodoStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFocused]);

  const style = {
    transform: isDragging ? CSS.Transform.toString(transform) : undefined,
    transition,
    paddingLeft: `${depth * 24}px`,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 100 : 'auto',
  };

  const hasSubtasks = todos.some(t => t.parentId === task.id);

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`group flex flex-col mb-0.5 relative select-none transition-all ${isFocused ? 'bg-blue-900/10' : ''}`}
    >
      {/* Top/Bottom Drop Indicators */}
      {dropZone === 'top' && (
        <div className="absolute top-[-1px] left-0 right-0 h-[2px] bg-blue-500 z-20 shadow-[0_0_4px_rgba(59,130,246,0.6)]" />
      )}
      {dropZone === 'bottom' && (
        <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-blue-500 z-20 shadow-[0_0_4px_rgba(59,130,246,0.6)]" />
      )}

      <div className={`flex items-center gap-1 p-1 hover:bg-[#252525] transition-colors border-b border-[#2a2a2a] group-last:border-b-0 min-h-[40px] ${isFocused ? 'bg-[#2a3a4a] ring-1 ring-inset ring-blue-500/50' : 'bg-[#1a1a1a]'}`}>
        {/* Focus indicator bar */}
        {isFocused && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
        )}

        {/* Expand/Collapse Toggle */}
        <button 
          onClick={() => updateTodo(task.id, { collapsed: !task.collapsed })}
          className={`p-1 hover:bg-white/10 rounded transition-colors ${!hasSubtasks ? 'invisible' : ''}`}
        >
          {task.collapsed ? (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {/* Drag Handle */}
        <div {...attributes} {...listeners} className="p-1 cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400">
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Task Content */}
        <div className="flex items-center gap-2 flex-grow min-w-0">
          <input
            ref={inputRef}
            value={task.content}
            onFocus={onFocus}
            onChange={(e) => updateTodo(task.id, { content: e.target.value })}
            className={`bg-transparent border-none focus:outline-none flex-grow text-[14px] text-slate-200 py-1 px-1 ${task.completed ? 'line-through opacity-40' : ''}`}
            aria-label="Task content"
          />
        </div>

        {/* Actions Button Group */}
        <div className={`flex items-center gap-0.5 transition-opacity pr-1 ${isFocused ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <button 
            onClick={() => {
              addTodo('', task.id);
              updateTodo(task.id, { collapsed: false });
            }}
            className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded transition-colors active:scale-90"
            title="Add Subtask"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button 
            className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded transition-colors active:scale-90"
            title="Start Timer"
          >
            <Play className="w-4 h-4" />
          </button>
          <button 
            onClick={() => updateTodo(task.id, { completed: !task.completed })}
            className={`p-1.5 hover:bg-white/10 rounded transition-colors active:scale-90 ${task.completed ? 'text-green-500' : 'text-slate-400 hover:text-green-500'}`}
            title="Complete"
          >
            <Check className="w-4 h-4" />
          </button>
          <button 
            onClick={() => deleteTodo(task.id)}
            className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-red-500 rounded transition-colors active:scale-90"
            title="Delete"
            aria-label="Delete"
          >
            <X className="w-4 h-4" />
          </button>
          <button 
            className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded transition-colors active:scale-90"
            title="Indent"
          >
            <CornerDownRight className="w-4 h-4" />
          </button>
          <button 
            className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded transition-colors active:scale-90"
            title="Toggle View"
          >
            <div className="w-4 h-4 flex flex-col items-center justify-center gap-0.5">
              <div className="w-3 h-[1px] bg-current" />
              <div className="w-3 h-[1px] bg-current" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
});
