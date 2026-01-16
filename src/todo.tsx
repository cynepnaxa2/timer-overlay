import React from 'react'
import ReactDOM from 'react-dom/client'
import { TodoWindow } from './todo/TodoWindow'
import './index.css'
import { useTodoStore } from './store/todoStore'
import { loadTodos } from './utils/ipc'

// Load initial data
loadTodos().then(todos => {
  useTodoStore.getState().setTodos(todos)
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TodoWindow />
  </React.StrictMode>,
)
