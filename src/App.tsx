import React, { useEffect } from 'react';
import { useTodoStore } from './store/renderer/useTodoStore';
import TaskList from './components/TaskList';
import { Plus, Check } from 'lucide-react';

const App: React.FC = () => {
  console.log('App component rendering');
  const { 
    refreshTodos, 
    createTodo, 
    toggleShowCompleted, 
    showCompleted,
    isLoading,
    todos,
  } = useTodoStore();

  useEffect(() => {
    refreshTodos();
    
    // Listen for updates from main process
    const unbind = window.todoApi.onTodosUpdated((todos: any) => {
      useTodoStore.getState().setTodos(todos);
    });
    
    return () => {
      // Cleanup if needed
    };
  }, []);

  const handleCreateRoot = async () => {
    await createTodo('');
  };

  const handleLoadStressTest = async () => {
    await window.todoApi.loadStressTest();
  };

  return (
    <div className="flex flex-col h-screen bg-[#1a1a1a] text-white">
      <header className="h-[60px] bg-[#252525] border-b border-white/10 flex items-center px-5 shrink-0 z-50">
        <button 
          onClick={handleCreateRoot}
          className="w-9 h-9 bg-[#4a9eff] hover:bg-[#357abd] text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
          title="Создать корневую задачу (Shift+Enter)"
        >
          <Plus size={20} />
        </button>

        <button 
          onClick={handleLoadStressTest}
          className="ml-3 px-3 h-9 bg-red-500/20 hover:bg-red-500/40 text-red-200 border border-red-500/20 rounded text-xs transition-colors"
        >
          STRESS TEST
        </button>
        
        <button 
          onClick={toggleShowCompleted}
          className={`ml-3 w-9 h-9 rounded-full flex items-center justify-center transition-all border ${
            showCompleted 
          ? 'bg-[#4a9eff] border-[#4a9eff] text-white' 
          : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
          }`}
          title={showCompleted ? 'Скрыть выполненные задачи' : 'Показать выполненные задачи'}
        >
          <Check size={18} />
        </button>
      </header>
      
      <main id="todo-container" className="flex-1 overflow-y-auto relative">
        <div id="todo-container-inner" className="min-h-full p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-white/50">
              Загрузка...
            </div>
          ) : (
            <TaskList parentId={null} />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
