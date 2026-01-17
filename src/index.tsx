import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { OverlayWindow } from './overlay/OverlayWindow'
import './index.css'
import { useSettingsStore } from './store/settingsStore'

const Root = () => {
  const loadSettingsAction = useSettingsStore(state => state.loadSettingsAction)

  useEffect(() => {
    loadSettingsAction()
    
    if (window.overlayApi) {
      window.overlayApi.onSettingsUpdated((settings) => {
        useSettingsStore.getState().setSettings(settings)
      })
    }
  }, [loadSettingsAction])

  return (
    <React.StrictMode>
      <OverlayWindow />
    </React.StrictMode>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />)
