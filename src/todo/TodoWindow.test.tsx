import { render, screen, fireEvent } from '@testing-library/react'
import { TodoWindow } from './TodoWindow'
import { useTodoStore } from '../store/todoStore'
import React from 'react'
import { vi } from 'vitest'

// Mock IPC
vi.mock('../utils/ipc', () => ({
  saveTodos: vi.fn(),
  loadTodos: vi.fn().mockResolvedValue([]),
}))

describe('TodoWindow Integration', () => {
  beforeEach(() => {
    useTodoStore.getState().setTodos([])
  })

  it('can add a new task and edit its content', () => {
    render(<TodoWindow />)
    
    const addButton = screen.getByLabelText('New Task')
    fireEvent.click(addButton)
    
    const inputs = screen.getAllByLabelText('Task content')
    fireEvent.change(inputs[0], { target: { value: 'Buy Milk' } })
    
    expect(useTodoStore.getState().todos[0].content).toBe('Buy Milk')
  })

  it('can delete a task', () => {
    useTodoStore.getState().setTodos([
      {
        id: '1',
        content: 'To be deleted',
        parentId: null,
        type: 'task',
        completed: false,
        completedAt: null,
        order: 0,
        createdAt: Date.now(),
        motivationWord: null,
        collapsed: false,
        subtaskType: 'list',
        context: [],
        metadata: {},
        isArchived: false,
      }
    ])
    
    render(<TodoWindow />)
    expect(screen.getByDisplayValue('To be deleted')).toBeInTheDocument()
    
    const deleteButton = screen.getByLabelText('Delete')
    fireEvent.click(deleteButton)
    
    expect(useTodoStore.getState().todos).toHaveLength(0)
  })
})
