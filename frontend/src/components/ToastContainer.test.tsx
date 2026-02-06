import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import { ToastContainer } from './ToastContainer'
import { addToast, removeToast } from '../lib/error-handler'

describe('ToastContainer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    // Clean up all toasts by rendering the container and removing visible ones
    cleanup()
    vi.useRealTimers()
  })

  it('renders nothing when there are no toasts', () => {
    const { container } = render(<ToastContainer />)

    // The component returns null when no toasts
    expect(container.querySelector('[role="region"]')).not.toBeInTheDocument()
  })

  it('renders toast notifications', () => {
    let toastId: string
    render(<ToastContainer />)

    act(() => {
      toastId = addToast('Something went wrong', 'error', 0)
    })

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()

    // Clean up
    act(() => {
      removeToast(toastId)
    })
  })

  it('renders multiple toasts', () => {
    let id1: string, id2: string
    render(<ToastContainer />)

    act(() => {
      id1 = addToast('Error toast', 'error', 0)
      id2 = addToast('Success toast', 'success', 0)
    })

    expect(screen.getByText('Error toast')).toBeInTheDocument()
    expect(screen.getByText('Success toast')).toBeInTheDocument()

    // Clean up
    act(() => {
      removeToast(id1)
      removeToast(id2)
    })
  })

  it('dismisses toast when dismiss button is clicked', () => {
    let toastId: string
    render(<ToastContainer />)

    act(() => {
      toastId = addToast('Dismissible toast', 'info', 0)
    })

    expect(screen.getByText('Dismissible toast')).toBeInTheDocument()

    const dismissButton = screen.getByLabelText('Dismiss notification')
    fireEvent.click(dismissButton)

    expect(screen.queryByText('Dismissible toast')).not.toBeInTheDocument()
  })
})
