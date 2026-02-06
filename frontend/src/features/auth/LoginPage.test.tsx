import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import LoginPage from './LoginPage'
import { useAuthStore } from '../../lib/store'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('LoginPage', () => {
  beforeEach(() => {
    // Reset auth store before each test
    useAuthStore.getState().logout()
    mockNavigate.mockClear()
  })

  const renderLoginPage = () => {
    return render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    )
  }

  it('renders login form', () => {
    renderLoginPage()

    expect(screen.getByText('Nexus Architect')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows password when toggle is clicked', () => {
    renderLoginPage()

    const passwordInput = screen.getByPlaceholderText('Enter password')
    expect(passwordInput).toHaveAttribute('type', 'password')

    const toggleButton = screen.getByRole('button', { name: /show password/i })
    fireEvent.click(toggleButton)

    expect(passwordInput).toHaveAttribute('type', 'text')
  })

  it('hides password when toggle is clicked again', () => {
    renderLoginPage()

    const passwordInput = screen.getByPlaceholderText('Enter password')
    const toggleButton = screen.getByRole('button', { name: /show password/i })

    fireEvent.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'text')

    const hideButton = screen.getByRole('button', { name: /hide password/i })
    fireEvent.click(hideButton)
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('shows error for incorrect password', async () => {
    renderLoginPage()

    const passwordInput = screen.getByPlaceholderText('Enter password')
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Incorrect password')
    })

    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('navigates to home on correct password', async () => {
    renderLoginPage()

    const passwordInput = screen.getByPlaceholderText('Enter password')
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(passwordInput, { target: { value: 'nexusarchitect123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
    })

    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it('clears password field on failed attempt', async () => {
    renderLoginPage()

    const passwordInput = screen.getByPlaceholderText('Enter password')
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    expect(passwordInput).toHaveValue('')
  })

  it('disables submit button when password is empty', () => {
    renderLoginPage()

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    expect(submitButton).toBeDisabled()
  })

  it('enables submit button when password is entered', () => {
    renderLoginPage()

    const passwordInput = screen.getByPlaceholderText('Enter password')
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(passwordInput, { target: { value: 'somepassword' } })
    expect(submitButton).not.toBeDisabled()
  })
})

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
  })

  it('starts with isAuthenticated as false', () => {
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('login returns true for correct password', () => {
    const result = useAuthStore.getState().login('nexusarchitect123')
    expect(result).toBe(true)
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it('login returns false for incorrect password', () => {
    const result = useAuthStore.getState().login('wrongpassword')
    expect(result).toBe(false)
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('logout sets isAuthenticated to false', () => {
    useAuthStore.getState().login('nexusarchitect123')
    expect(useAuthStore.getState().isAuthenticated).toBe(true)

    useAuthStore.getState().logout()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})
