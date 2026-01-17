import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { SettingsWindow } from './settings/SettingsWindow'
import './index.css'
import { useSettingsStore } from './store/settingsStore'

const Root = () => {
  const loadSettingsAction = useSettingsStore(state => state.loadSettingsAction)

  useEffect(() => {
    loadSettingsAction()
    
    if (window.settingsApi) {
      window.settingsApi.onSettingsUpdated((settings) => {
        useSettingsStore.getState().setSettings(settings)
      })
    }
  }, [loadSettingsAction])

  return (
    <React.StrictMode>
      <SettingsWindow />
    </React.StrictMode>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />)
