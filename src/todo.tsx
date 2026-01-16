import React from 'react'
import ReactDOM from 'react-dom/client'
import { TodoWindow } from './todo/TodoWindow'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TodoWindow />
  </React.StrictMode>,
)
