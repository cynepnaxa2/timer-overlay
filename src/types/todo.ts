import { ResourceMatrix } from './resources';

export type SubtaskType = 'list' | 'variants';

export interface Todo {
  id: string;
  content: string;
  parentId: string | null;
  type: 'task' | 'group';
  completed: boolean;
  completedAt: number | null;
  order: number;
  createdAt: number;
  motivationWord: string | null;
  collapsed: boolean;
  subtaskType: SubtaskType;
  economics: {
    cost: number;
    gain: number;
    roi: number;
  };
  resources?: ResourceMatrix; // New field for the matrix
  priorityScore?: number; // Calculated field
  context: string[];
  metadata: Record<string, any>;
  isArchived: boolean;
}
