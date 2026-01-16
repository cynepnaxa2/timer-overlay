import { render, screen } from '@testing-library/react'
import { OverlayWindow } from './OverlayWindow'
import { useSettingsStore, DEFAULT_SETTINGS } from '../store/settingsStore'
import React from 'react'
import { vi } from 'vitest'

// Mock IPC
vi.mock('../utils/ipc', () => ({
  saveSettings: vi.fn(),
  loadSettings: vi.fn().mockResolvedValue(null),
}))

describe('OverlayWindow', () => {
  beforeEach(() => {
    useSettingsStore.getState().setSettings({
      ...DEFAULT_SETTINGS,
      mode: 'money',
      level: 2, // Use level 2 to show counter only
      displayCounters: {
        money: { value: 123, totalMinutes: 123 }
      }
    })
  })

  it('renders the counter value correctly', () => {
    render(<OverlayWindow />)
    expect(screen.getByText('123')).toBeInTheDocument()
  })

  it('applies animation styles with correct duration', () => {
    useSettingsStore.getState().updateSettings({
      durationSeconds: 120
    })
    
    const { container } = render(<OverlayWindow />)
    const timerDiv = container.querySelector('.crawling-timer') as HTMLElement
    expect(timerDiv.style.animation).toBe('rise 120s linear infinite')
  })
})
