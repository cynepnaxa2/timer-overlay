import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { TodoWindow } from './todo/TodoWindow'
import './index.css'
import { useSettingsStore } from './store/settingsStore'

const Root = () => {
  const loadSettingsAction = useSettingsStore(state => state.loadSettingsAction)

  useEffect(() => {
    loadSettingsAction()
    
    if (window.todoApi) {
      window.todoApi.onSettingsUpdated((settings) => {
        useSettingsStore.getState().setSettings(settings)
      })
    }
  }, [loadSettingsAction])

  return (
    <React.StrictMode>
      <TodoWindow />
    </React.StrictMode>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />)
