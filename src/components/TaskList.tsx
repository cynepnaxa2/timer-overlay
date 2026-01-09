import React from 'react';
import { useTodoStore } from '../store/renderer/useTodoStore';
import TaskItem from './TaskItem';
import { List, Shuffle } from 'lucide-react';

interface TaskListProps {
  parentId: string | null;
  depth?: number;
}

const TaskList: React.FC<TaskListProps> = ({ parentId, depth = 0 }) => {
  const { todos, showCompleted } = useTodoStore();

  const parentTask = todos.find(t => t.id === parentId);
  const subtaskType = parentTask?.subtaskType || 'list';

  const filteredTodos = todos
    .filter(t => t.parentId === parentId)
    .filter(t => showCompleted || !t.completed)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  if (filteredTodos.length === 0) return null;

  return (
    <div className={`flex flex-col ${depth > 0 ? 'ml-6 relative' : ''}`}>
      {depth > 0 && (
        <div 
          className="absolute left-[-13px] top-0 bottom-6 w-[1px] bg-white/20" 
          aria-hidden="true" 
        >
          <div className="absolute top-2 left-[-6px] bg-[#1a1a1a] p-0.5">
            {subtaskType === 'variants' ? (
              <Shuffle size={10} className="text-white/20" />
            ) : (
              <List size={10} className="text-white/20" />
            )}
          </div>
        </div>
      )}
      {filteredTodos.map((todo, index) => (
        <TaskItem 
          key={todo.id} 
          todo={todo} 
          depth={depth} 
          isLast={index === filteredTodos.length - 1} 
        />
      ))}
    </div>
  );
};

export default TaskList;
