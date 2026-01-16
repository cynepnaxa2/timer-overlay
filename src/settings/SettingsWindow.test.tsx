import { render, screen, fireEvent } from '@testing-library/react'
import { SettingsWindow } from './SettingsWindow'
import { useSettingsStore, DEFAULT_SETTINGS } from '../store/settingsStore'
import React from 'react'
import { vi } from 'vitest'

// Mock IPC
vi.mock('../utils/ipc', () => ({
  saveSettings: vi.fn(),
  loadSettings: vi.fn().mockResolvedValue(null),
}))

describe('SettingsWindow', () => {
  beforeEach(() => {
    useSettingsStore.getState().setSettings(DEFAULT_SETTINGS)
  })

  it('updates diameter setting on input change', () => {
    render(<SettingsWindow />)
    const input = screen.getByLabelText('Diameter')
    fireEvent.change(input, { target: { value: '120' } })
    
    expect(useSettingsStore.getState().settings.diameterPx).toBe(120)
  })

  it('updates opacity setting on slider change', () => {
    render(<SettingsWindow />)
    const slider = screen.getByLabelText('Opacity')
    fireEvent.change(slider, { target: { value: '0.8' } })
    
    expect(useSettingsStore.getState().settings.opacity).toBe(0.8)
  })
})
