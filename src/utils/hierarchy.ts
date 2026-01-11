import { Todo } from '../types/todo';

export function isDescendant(ancestorId: string, taskId: string, todos: Todo[], visited = new Set<string>()): boolean {
  // #region agent log
  const log = (msg: string, data = {}) => {
    fetch('http://127.0.0.1:7245/ingest/f23b35c1-164f-4809-ab92-7ad83d07b816', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'hierarchy.ts:isDescendant',
        message: msg,
        data,
        timestamp: Date.now(),
        sessionId: 'debug-session',
        hypothesisId: 'H_DROP_INDEX_MISMATCH'
      })
    }).catch(() => {});
  };
  // #endregion

  // Loop protection
  if (visited.has(taskId)) {
    log('isDescendant: detected cycle/loop', { taskId, ancestorId });
    return true; // Treat cycle as descendant to block move
  }
  visited.add(taskId);

  const task = todos.find(t => t.id === taskId);
  if (!task) {
    log('isDescendant: task not found', { taskId });
    return false;
  }
  if (!task.parentId) {
    log('isDescendant: reached root', { taskId, ancestorId });
    return false;
  }
  if (task.parentId === ancestorId) {
    log('isDescendant: FOUND MATCH', { taskId, ancestorId, parentId: task.parentId });
    return true;
  }
  
  log('isDescendant: recursing', { taskId, currentParent: task.parentId, targetAncestor: ancestorId });
  return isDescendant(ancestorId, task.parentId, todos, visited);
}

export function getAllDescendants(taskId: string, todos: Todo[]): string[] {
  const descendants: string[] = [];
  const children = todos.filter(t => t.parentId === taskId);
  children.forEach(child => {
    descendants.push(child.id);
    descendants.push(...getAllDescendants(child.id, todos));
  });
  return descendants;
}

export function isTaskVisible(task: Todo, todos: Todo[], showCompleted = false): boolean {
  if (!task.parentId) {
    return showCompleted || !task.completed;
  }
  const parent = todos.find(t => t.id === task.parentId);
  const isSelfVisible = showCompleted || !task.completed;
  return isSelfVisible && (!parent || (!parent.collapsed && (showCompleted || !parent.completed) && isTaskVisible(parent, todos, showCompleted)));
}
