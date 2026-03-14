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
    // First click - confirmation state
    fireEvent.click(deleteButton)
    expect(useTodoStore.getState().todos).toHaveLength(1)
    
    // Second click - actual deletion
    fireEvent.click(deleteButton)
    expect(useTodoStore.getState().todos).toHaveLength(0)
  })

  it('hides completed task from list by default', () => {
    useTodoStore.getState().setTodos([
      {
        id: '1',
        content: 'Finish report',
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
    expect(screen.getByDisplayValue('Finish report')).toBeInTheDocument()

    const completeButton = screen.getByLabelText('Complete')
    fireEvent.click(completeButton)

    expect(screen.queryByDisplayValue('Finish report')).not.toBeInTheDocument()
    expect(useTodoStore.getState().todos[0].completed).toBe(true)
  })

  it('toggle Show completed shows and hides completed tasks', () => {
    useTodoStore.getState().setTodos([
      {
        id: '1',
        content: 'Done task',
        parentId: null,
        type: 'task',
        completed: true,
        completedAt: Date.now(),
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
    expect(screen.queryByDisplayValue('Done task')).not.toBeInTheDocument()
    expect(screen.getByText(/All done for now/)).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Show completed tasks'))
    expect(screen.getByDisplayValue('Done task')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Show active tasks'))
    expect(screen.queryByDisplayValue('Done task')).not.toBeInTheDocument()
  })

  it('shows No completed tasks when viewing completed and none exist', () => {
    useTodoStore.getState().setTodos([
      {
        id: '1',
        content: 'Active only',
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
    expect(screen.getByDisplayValue('Active only')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Show completed tasks'))
    expect(screen.getByText(/No completed tasks/)).toBeInTheDocument()
    expect(screen.queryByDisplayValue('Active only')).not.toBeInTheDocument()
  })
})
