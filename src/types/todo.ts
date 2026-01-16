export type SubtaskType = 'list' | 'variants';

export interface Todo {
  id: string;
  content: string;
  parentId: string | null;
  type: 'task';
  completed: boolean;
  completedAt: number | null;
  order: number;
  createdAt: number;
  motivationWord: string | null;
  collapsed: boolean;
  subtaskType: SubtaskType;
  context: any[];
  metadata: Record<string, any>;
  isArchived: boolean;
}
