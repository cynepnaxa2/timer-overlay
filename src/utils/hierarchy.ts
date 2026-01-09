import { Todo } from '../types/todo';

export function isDescendant(ancestorId: string, taskId: string, todos: Todo[]): boolean {
  const task = todos.find(t => t.id === taskId);
  if (!task || !task.parentId) return false;
  if (task.parentId === ancestorId) return true;
  return isDescendant(ancestorId, task.parentId, todos);
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
