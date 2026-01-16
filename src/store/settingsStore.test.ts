import { useSettingsStore, DEFAULT_SETTINGS } from './settingsStore'
import { vi } from 'vitest'

// Mock IPC
vi.mock('../utils/ipc', () => ({
  saveSettings: vi.fn(),
  loadSettings: vi.fn().mockResolvedValue(null),
}))

describe('useSettingsStore', () => {
  beforeEach(() => {
    useSettingsStore.getState().setSettings(DEFAULT_SETTINGS)
  })

  it('has default settings initially', () => {
    const { settings } = useSettingsStore.getState()
    expect(settings).toEqual(DEFAULT_SETTINGS)
  })

  it('updates settings and merges correctly', () => {
    const { updateSettings } = useSettingsStore.getState()
    updateSettings({ diameterPx: 100 })
    
    const { settings } = useSettingsStore.getState()
    expect(settings.diameterPx).toBe(100)
    expect(settings.opacity).toBe(DEFAULT_SETTINGS.opacity) // preserved
  })

  it('handles nested updates for hotkeys', () => {
    const { updateSettings } = useSettingsStore.getState()
    updateSettings({ todoHotkeys: { complete: 'Ctrl+D' } })
    
    const { settings } = useSettingsStore.getState()
    expect(settings.todoHotkeys.complete).toBe('Ctrl+D')
    expect(settings.todoHotkeys.execute).toBe(DEFAULT_SETTINGS.todoHotkeys.execute) // preserved
  })
})
