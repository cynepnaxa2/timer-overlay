import { useTodoStore } from './todoStore'
import { vi } from 'vitest'

// Mock IPC
vi.mock('../utils/ipc', () => ({
  saveTodos: vi.fn(),
  loadTodos: vi.fn().mockResolvedValue([]),
}))

describe('useTodoStore', () => {
  beforeEach(() => {
    useTodoStore.getState().setTodos([])
  })

  it('adds a root task', () => {
    const { addTodo } = useTodoStore.getState()
    addTodo('Root Task')
    
    const { todos } = useTodoStore.getState()
    expect(todos).toHaveLength(1)
    expect(todos[0].content).toBe('Root Task')
    expect(todos[0].parentId).toBeNull()
  })

  it('adds a subtask', () => {
    const { addTodo } = useTodoStore.getState()
    const root = addTodo('Root')
    addTodo('Subtask', root.id)
    
    const { todos } = useTodoStore.getState()
    expect(todos).toHaveLength(2)
    const subtask = todos.find(t => t.content === 'Subtask')
    expect(subtask?.parentId).toBe(root.id)
  })

  it('recursively deletes subtasks', () => {
    const { addTodo, deleteTodo } = useTodoStore.getState()
    const root = addTodo('Root')
    const sub1 = addTodo('Sub 1', root.id)
    addTodo('Sub 1.1', sub1.id)
    addTodo('Sub 2', root.id)
    
    expect(useTodoStore.getState().todos).toHaveLength(4)
    
    deleteTodo(sub1.id)
    
    const { todos } = useTodoStore.getState()
    expect(todos).toHaveLength(2) // Root and Sub 2 remain
    expect(todos.map(t => t.content)).toContain('Root')
    expect(todos.map(t => t.content)).toContain('Sub 2')
  })

  it('updates a task', () => {
    const { addTodo, updateTodo } = useTodoStore.getState()
    const task = addTodo('Old Content')
    
    updateTodo(task.id, { content: 'New Content' })
    
    const { todos } = useTodoStore.getState()
    expect(todos[0].content).toBe('New Content')
  })
})
