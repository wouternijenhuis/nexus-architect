import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore } from './uiStore'

const resetStore = () => {
  useUIStore.setState({
    sidebarOpen: true,
    theme: 'system',
    activeModal: null,
  })
}

describe('uiStore', () => {
  beforeEach(resetStore)

  // ── sidebar ───────────────────────────────────────────────────

  it('toggles sidebar open state', () => {
    expect(useUIStore.getState().sidebarOpen).toBe(true)

    useUIStore.getState().toggleSidebar()
    expect(useUIStore.getState().sidebarOpen).toBe(false)

    useUIStore.getState().toggleSidebar()
    expect(useUIStore.getState().sidebarOpen).toBe(true)
  })

  it('sets sidebar open state explicitly', () => {
    useUIStore.getState().setSidebarOpen(false)
    expect(useUIStore.getState().sidebarOpen).toBe(false)

    useUIStore.getState().setSidebarOpen(true)
    expect(useUIStore.getState().sidebarOpen).toBe(true)
  })

  // ── theme ─────────────────────────────────────────────────────

  it('defaults theme to system', () => {
    expect(useUIStore.getState().theme).toBe('system')
  })

  it('sets theme to dark', () => {
    useUIStore.getState().setTheme('dark')
    expect(useUIStore.getState().theme).toBe('dark')
  })

  it('sets theme to light', () => {
    useUIStore.getState().setTheme('light')
    expect(useUIStore.getState().theme).toBe('light')
  })

  // ── modals ────────────────────────────────────────────────────

  it('opens a modal by id', () => {
    useUIStore.getState().openModal('confirm-delete')
    expect(useUIStore.getState().activeModal).toBe('confirm-delete')
  })

  it('closes the active modal', () => {
    useUIStore.setState({ activeModal: 'settings' })

    useUIStore.getState().closeModal()
    expect(useUIStore.getState().activeModal).toBeNull()
  })

  it('replaces the active modal when opening a new one', () => {
    useUIStore.getState().openModal('first')
    useUIStore.getState().openModal('second')
    expect(useUIStore.getState().activeModal).toBe('second')
  })
})
