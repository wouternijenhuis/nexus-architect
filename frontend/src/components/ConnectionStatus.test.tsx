import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConnectionStatus } from './ConnectionStatus'

describe('ConnectionStatus', () => {
  it('shows connected state with label', () => {
    render(<ConnectionStatus isConnected={true} />)
    expect(screen.getByText('Connected')).toBeInTheDocument()
    expect(screen.getByTitle('Connected')).toBeInTheDocument()
  })

  it('shows disconnected state with label', () => {
    render(<ConnectionStatus isConnected={false} />)
    expect(screen.getByText('Disconnected')).toBeInTheDocument()
    expect(screen.getByTitle('Disconnected')).toBeInTheDocument()
  })

  it('hides label when showLabel is false (connected)', () => {
    render(<ConnectionStatus isConnected={true} showLabel={false} />)
    expect(screen.queryByText('Connected')).not.toBeInTheDocument()
    // Title should still be present on the wrapper div
    expect(screen.getByTitle('Connected')).toBeInTheDocument()
  })

  it('hides label when showLabel is false (disconnected)', () => {
    render(<ConnectionStatus isConnected={false} showLabel={false} />)
    expect(screen.queryByText('Disconnected')).not.toBeInTheDocument()
    expect(screen.getByTitle('Disconnected')).toBeInTheDocument()
  })
})
