import React, { useRef, useEffect, useState } from 'react';
import { Todo } from '../types/todo';
import { useTodoStore } from '../store/renderer/useTodoStore';
import { Plus, Play, Check, X, ChevronRight, ChevronDown, List, Shuffle, BarChart3, GripVertical } from 'lucide-react';
import TaskList from './TaskList';
import ResourceBadge from './ResourceBadge';
import ResourceMatrixInput from './ResourceMatrixInput';
import { calculatePriorityScore } from '../utils/priority';
import { INITIAL_RESOURCE_MATRIX } from '../config/resourceConstants';

interface TaskItemProps {
  todo: Todo;
  depth: number;
  isLast: boolean;
}

const TaskItem: React.FC<TaskItemProps> = ({ todo, depth, isLast }) => {
  const activeTaskId = useTodoStore(state => state.activeTaskId);
  const setActiveTaskId = useTodoStore(state => state.setActiveTaskId);
  const updateTodo = useTodoStore(state => state.updateTodo);
  const createTodo = useTodoStore(state => state.createTodo);
  const deleteTodo = useTodoStore(state => state.deleteTodo);
  const toggleCollapse = useTodoStore(state => state.toggleCollapse);
  const toggleSubtaskType = useTodoStore(state => state.toggleSubtaskType);
  const showCompleted = useTodoStore(state => state.showCompleted);
  const draggingTaskId = useTodoStore(state => state.draggingTaskId);
  const setDraggingTaskId = useTodoStore(state => state.setDraggingTaskId);
  const dragOverTaskId = useTodoStore(state => state.dragOverTaskId);
  const setDragOverTaskId = useTodoStore(state => state.setDragOverTaskId);
  const handleTaskDrop = useTodoStore(state => state.handleTaskDrop);
  const setDropZone = useTodoStore(state => state.setDropZone);

  const hasChildren = useTodoStore(state => 
    state.todos.some(t => t.parentId === todo.id && (state.showCompleted || !t.completed))
  );

  const dropZone = useTodoStore(state => state.dragOverTaskId === todo.id ? state.dropZone : null);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const taskRef = useRef<HTMLDivElement>(null);
  const [showMatrix, setShowMatrix] = useState(false);

  const isActive = activeTaskId === todo.id;
  const isDragging = draggingTaskId === todo.id;
  const isDragOver = dragOverTaskId === todo.id;

  const handleDragStart = (e: React.DragEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('.task-content') && document.activeElement === e.target.closest('.task-content')) {
      e.preventDefault();
      return;
    }
    
    // Set in store first
    setDraggingTaskId(todo.id);
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', todo.id);
    
    // Create a ghost image if needed, or just let it be
    if (taskRef.current) {
      taskRef.current.classList.add('dragging-ghost');
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggingTaskId(null);
    setDragOverTaskId(null);
    setDropZone(null);
    if (taskRef.current) {
      taskRef.current.classList.remove('dragging-ghost');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (draggingTaskId && draggingTaskId !== todo.id) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      
      if (dragOverTaskId !== todo.id) setDragOverTaskId(todo.id);
      
      const rect = e.currentTarget.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      const zoneHeight = rect.height / 4;

      if (relativeY < zoneHeight) {
        if (dropZone !== 'top') setDropZone('top');
      } else if (relativeY > rect.height - zoneHeight) {
        if (dropZone !== 'bottom') setDropZone('bottom');
      } else {
        if (dropZone !== 'middle') setDropZone('middle');
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we are actually leaving the element and not just bubbling
    const rect = e.currentTarget.getBoundingClientRect();
    if (
      e.clientY <= rect.top ||
      e.clientY >= rect.bottom ||
      e.clientX <= rect.left ||
      e.clientX >= rect.right
    ) {
      setDragOverTaskId(null);
      setDropZone(null);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Use store state as source of truth for draggingTaskId
    const draggedId = draggingTaskId;
    const currentDropZone = dropZone;
    
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/f23b35c1-164f-4809-ab92-7ad83d07b816',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TaskItem.tsx:116',message:'handleDrop triggered',data:{draggedId, targetId: todo.id, currentDropZone},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H_DROP_INDEX_MISMATCH'})}).catch(()=>{});
    // #endregion

    if (draggedId && draggedId !== todo.id && currentDropZone) {
      await handleTaskDrop(draggedId, todo.id, currentDropZone);
    }
    
    setDraggingTaskId(null);
    setDragOverTaskId(null);
    setDropZone(null);
  };

  const dropZoneClass = isDragOver ? {
    top: dropZone === 'top' ? 'drag-over-top' : '',
    middle: dropZone === 'middle' ? 'drag-over-middle' : '',
    bottom: dropZone === 'bottom' ? 'drag-over-bottom' : '',
  } : { top: '', middle: '', bottom: '' };
  
  const resources = todo.resources || INITIAL_RESOURCE_MATRIX;
  const priorityScore = calculatePriorityScore(resources);

  useEffect(() => {
    if (isActive && contentRef.current && !draggingTaskId) {
      contentRef.current.focus();
    }
  }, [isActive, draggingTaskId]);

  const handleContentBlur = () => {
    if (contentRef.current) {
      updateTodo(todo.id, { content: contentRef.current.innerText });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      createTodo('', todo.parentId, todo.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const btn = e.currentTarget as HTMLButtonElement;
    if (btn.dataset.confirming === 'true') {
      deleteTodo(todo.id);
    } else {
      btn.dataset.confirming = 'true';
      btn.innerText = '✕?';
      btn.classList.add('bg-red-500/30', 'border-red-500', 'text-red-500', 'w-auto', 'px-2');
      setTimeout(() => {
        if (btn) {
          btn.dataset.confirming = 'false';
          btn.innerText = '✕';
          btn.classList.remove('bg-red-500/30', 'border-red-500', 'text-red-500', 'w-auto', 'px-2');
        }
      }, 3000);
    }
  };

  return (
    <div 
      ref={taskRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`flex flex-col w-full group ${isDragging ? 'opacity-50' : ''}`}
    >
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex items-center min-h-[40px] relative border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
          isActive && !draggingTaskId ? 'bg-white/[0.05]' : ''
        } ${dropZoneClass.top} ${dropZoneClass.middle} ${dropZoneClass.bottom} ${todo.completed ? 'opacity-50' : ''}`}
        onClick={() => setActiveTaskId(todo.id)}
      >
        {/* Drag Handle */}
        <div className="w-4 h-full flex items-center justify-center cursor-grab active:cursor-grabbing text-white/10 hover:text-white/40 shrink-0">
          <GripVertical size={12} />
        </div>

        {/* Hierarchy horizontal line */}
        {depth > 0 && (
          <div 
            className="absolute left-[-13px] top-5 w-3 h-[1px] bg-white/20" 
            aria-hidden="true" 
          />
        )}

        {/* Expander / Bullet */}
        <div 
          className="w-8 h-full flex items-center justify-center cursor-pointer shrink-0 text-white/40 hover:text-white"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) toggleCollapse(todo.id);
          }}
        >
          {hasChildren ? (
            todo.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />
          ) : (
            <div className="w-1 h-1 bg-white/20 rounded-full" />
          )}
        </div>

        {/* Content */}
        <div
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning
          className={`flex-1 py-3 px-2 outline-none break-words whitespace-pre-wrap min-w-0 task-content ${
            todo.completed ? 'line-through' : ''
          }`}
          onBlur={handleContentBlur}
          onKeyDown={handleKeyDown}
          onFocus={() => setActiveTaskId(todo.id)}
        >
          {todo.content}
        </div>

        {/* Badges */}
        <div className="flex items-center gap-3 px-3 shrink-0">
          <ResourceBadge resources={resources} />
          {priorityScore > 0 && (
            <div className="text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-white/60" title="Priority Score">
              {priorityScore}
            </div>
          )}
        </div>

        {/* Actions */}
        {isActive && !draggingTaskId && (
          <div className="absolute right-0 top-0 bottom-0 flex items-center gap-1 bg-[#1a1a1a]/90 backdrop-blur-md pl-4 pr-2 border-l border-white/5 shadow-[-10px_0_20px_rgba(0,0,0,0.5)]">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowMatrix(!showMatrix); }}
              className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
                showMatrix ? 'bg-resource-header text-black' : 'bg-white/10 hover:bg-white/20'
              }`}
              title="Матрица ресурсов"
            >
              <BarChart3 size={14} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); createTodo('', todo.id); }}
              className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded transition-colors"
              title="Добавить подзадачу"
            >
              <Plus size={14} />
            </button>
            <button 
              className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded transition-colors"
              title="Запустить таймер"
            >
              <Play size={14} fill="currentColor" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); updateTodo(todo.id, { completed: !todo.completed }); }}
              className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
                todo.completed ? 'bg-green-500/40 text-green-200' : 'bg-white/10 hover:bg-white/20'
              }`}
              title="Выполнено"
            >
              <Check size={14} />
            </button>
            <button 
              onClick={handleDelete}
              className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded transition-colors"
              title="Удалить"
            >
              <X size={14} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); toggleSubtaskType(todo.id); }}
              className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded transition-colors"
              title={todo.subtaskType === 'variants' ? 'Сменить на список' : 'Сменить на варианты'}
            >
              {todo.subtaskType === 'variants' ? (
                <List size={14} />
              ) : (
                <Shuffle size={14} />
              )}
            </button>
          </div>
        )}
      </div>

      {showMatrix && (
        <div className="relative">
          <ResourceMatrixInput 
            resources={resources} 
            onChange={(newRes) => updateTodo(todo.id, { resources: newRes })}
            onClose={() => setShowMatrix(false)}
          />
        </div>
      )}

      {/* Children */}
      {!todo.collapsed && (
        <TaskList parentId={todo.id} depth={depth + 1} />
      )}
    </div>
  );
};

export default TaskItem;
