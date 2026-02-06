import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'
import { useAuthStore } from './lib/store'

vi.mock('./lib/websocket', () => ({
  connectWebSocket: vi.fn(),
  disconnectWebSocket: vi.fn(),
}))

describe('App', () => {
  beforeEach(() => {
    useAuthStore.setState({ isAuthenticated: false })
    window.history.pushState({}, '', '/')
  })

  it('renders login page when navigating to /login', () => {
    window.history.pushState({}, '', '/login')

    render(<App />)

    expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument()
  })

  it('redirects unauthenticated user to login from home', () => {
    render(<App />)

    // ProtectedRoute should redirect to /login, so login page should show
    expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument()
  })

  it('shows main layout when authenticated', () => {
    useAuthStore.setState({ isAuthenticated: true })

    render(<App />)

    // Header should be visible
    expect(screen.getByText('Nexus Architect')).toBeInTheDocument()
    // Home page content should show
    expect(screen.getByText('XSD Projects')).toBeInTheDocument()
  })

  it('shows header with logout when authenticated', () => {
    useAuthStore.setState({ isAuthenticated: true })

    render(<App />)

    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('connects websocket when authenticated', async () => {
    const { connectWebSocket } = await import('./lib/websocket')

    useAuthStore.setState({ isAuthenticated: true })

    render(<App />)

    expect(connectWebSocket).toHaveBeenCalled()
  })
})
