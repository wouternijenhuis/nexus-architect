import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'

// Component that throws an error on demand
function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error message')
  }
  return <div>Child content rendered</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error from React and ErrorBoundary during error tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Child content rendered')).toBeInTheDocument()
  })

  it('shows error fallback when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Try Again')).toBeInTheDocument()
    expect(screen.getByText('Reload Page')).toBeInTheDocument()
  })

  it('shows error message in details section', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )

    // Click on the details summary to expand
    fireEvent.click(screen.getByText('Error details'))

    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })

  it('resets error state when Try Again is clicked', () => {
    // We need a component whose throw behavior can be toggled.
    // After reset, ErrorBoundary re-renders children.
    // Since ThrowingComponent will throw again with shouldThrow=true,
    // we test that handleReset is called by checking state transition.
    let shouldThrow = true

    function ToggleThrow() {
      if (shouldThrow) {
        throw new Error('Boom')
      }
      return <div>Recovered content</div>
    }

    render(
      <ErrorBoundary>
        <ToggleThrow />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    // Toggle off the throw before clicking Try Again
    shouldThrow = false
    fireEvent.click(screen.getByText('Try Again'))

    expect(screen.getByText('Recovered content')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })
})
