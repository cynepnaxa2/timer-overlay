import React from 'react'
import ReactDOM from 'react-dom/client'
import { SettingsWindow } from './settings/SettingsWindow'
import './index.css'
import { useSettingsStore } from './store/settingsStore'
import { loadSettings } from './utils/ipc'

// Load initial data
loadSettings().then(settings => {
  if (settings) {
    useSettingsStore.getState().setSettings(settings)
  }
})

// Listen for updates from main process
if (window.settingsApi) {
  window.settingsApi.onSettingsUpdated((settings) => {
    useSettingsStore.getState().setSettings(settings)
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SettingsWindow />
  </React.StrictMode>,
)
