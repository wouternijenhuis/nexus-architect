import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Header from './Header'
import { useAuthStore } from '../lib/store'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('Header', () => {
  beforeEach(() => {
    useAuthStore.setState({ isAuthenticated: false })
    mockNavigate.mockClear()
  })

  const renderHeader = () =>
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    )

  it('renders the logo and title', () => {
    renderHeader()

    expect(screen.getByText('Nexus Architect')).toBeInTheDocument()
  })

  it('renders the Projects nav link', () => {
    renderHeader()

    expect(screen.getByText('Projects')).toBeInTheDocument()
  })

  it('does not show logout button when not authenticated', () => {
    renderHeader()

    expect(screen.queryByText('Logout')).not.toBeInTheDocument()
  })

  it('shows logout button when authenticated', () => {
    useAuthStore.setState({ isAuthenticated: true })

    renderHeader()

    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('calls logout and navigates to /login on logout click', () => {
    useAuthStore.setState({ isAuthenticated: true })

    renderHeader()

    fireEvent.click(screen.getByText('Logout'))

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
  })
})
