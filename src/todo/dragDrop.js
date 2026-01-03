function setupDragDrop(taskEl, task, todos, state, refreshTodos) {
  const hierarchy = typeof window !== 'undefined' && window.todoHierarchy 
    ? window.todoHierarchy 
    : require('./hierarchy');
  
  if (taskEl.hasAttribute('draggable')) {
    return;
  }
  
  taskEl.draggable = true;
  
  taskEl.addEventListener('dragstart', (e) => {
    if (e.target.closest('.task-content') && document.activeElement === e.target.closest('.task-content')) {
      e.preventDefault();
      return;
    }
    state.draggingTaskId = task.id;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
    taskEl.classList.add('dragging');
  });
  
  taskEl.addEventListener('dragend', () => {
    taskEl.classList.remove('dragging');
    state.draggingTaskId = null;
    document.querySelectorAll('.task').forEach(t => {
      t.classList.remove('drag-over', 'drag-over-inside');
    });
  });
  
  taskEl.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (state.draggingTaskId && state.draggingTaskId !== task.id) {
      const rect = taskEl.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (e.clientY < midY) {
        taskEl.classList.add('drag-over');
        taskEl.classList.remove('drag-over-inside');
      } else {
        taskEl.classList.add('drag-over-inside');
        taskEl.classList.remove('drag-over');
      }
    }
  });
  
  taskEl.addEventListener('dragleave', () => {
    taskEl.classList.remove('drag-over', 'drag-over-inside');
  });
  
  taskEl.addEventListener('drop', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const draggingId = state.draggingTaskId || e.dataTransfer.getData('text/plain');
    if (!draggingId || draggingId === task.id) return;
    
    const draggingTask = state.currentTodos.find(t => t.id === draggingId);
    if (!draggingTask) return;
    
    if (hierarchy.isDescendant(draggingId, task.id, state.currentTodos)) {
      return;
    }
    
    const rect = taskEl.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const isBefore = e.clientY < midY;
    
    const targetParentId = isBefore ? task.parentId : task.id;
    const allDraggingIds = [draggingId, ...hierarchy.getAllDescendants(draggingId, state.currentTodos)];
    
    const targetSiblings = state.currentTodos.filter(t => 
      t.parentId === targetParentId && 
      !t.completed && 
      !allDraggingIds.includes(t.id) &&
      hierarchy.isTaskVisible(t, state.currentTodos)
    ).sort((a, b) => (a.order || 0) - (b.order || 0));
    
    let insertIndex;
    if (isBefore) {
      insertIndex = targetSiblings.findIndex(t => t.id === task.id);
    } else {
      insertIndex = targetSiblings.findIndex(t => t.id === task.id) + 1;
    }
    
    const draggingTasks = allDraggingIds.map(id => state.currentTodos.find(t => t.id === id)).filter(Boolean);
    targetSiblings.splice(insertIndex, 0, ...draggingTasks);
    const todoIds = targetSiblings.map(t => t.id);
    
    if (targetParentId !== draggingTask.parentId) {
      await window.todoApi.updateTodo(draggingId, { parentId: targetParentId });
      const descendants = hierarchy.getAllDescendants(draggingId, state.currentTodos);
      for (const descId of descendants) {
        const descTask = state.currentTodos.find(t => t.id === descId);
        if (descTask && descTask.parentId === draggingId) {
          await window.todoApi.updateTodo(descId, { parentId: draggingId });
        }
      }
    }
    
    await window.todoApi.reorderTodos(todoIds);
    await refreshTodos(state);
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { setupDragDrop };
} else {
  window.todoDragDrop = { setupDragDrop };
}

