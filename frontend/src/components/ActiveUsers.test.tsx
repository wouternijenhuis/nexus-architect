import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ActiveUsers } from './ActiveUsers'
import type { CollaborationUser } from '../lib/store'

function createUser(id: string, name: string, color?: string): CollaborationUser {
  return { id, name, color }
}

describe('ActiveUsers', () => {
  it('shows "No other users" when users array is empty', () => {
    render(<ActiveUsers users={[]} />)
    expect(screen.getByText('No other users')).toBeInTheDocument()
  })

  it('displays a single user with initials', () => {
    const users = [createUser('u1', 'John Doe')]
    render(<ActiveUsers users={users} />)
    expect(screen.getByText('JD')).toBeInTheDocument()
    expect(screen.getByText('1 user online')).toBeInTheDocument()
  })

  it('displays multiple users', () => {
    const users = [
      createUser('u1', 'Alice'),
      createUser('u2', 'Bob'),
    ]
    render(<ActiveUsers users={users} />)
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
    expect(screen.getByText('2 users online')).toBeInTheDocument()
  })

  it('shows overflow count when more users than maxDisplay', () => {
    const users = [
      createUser('u1', 'Alice'),
      createUser('u2', 'Bob'),
      createUser('u3', 'Charlie'),
      createUser('u4', 'Diana'),
      createUser('u5', 'Eve'),
    ]
    render(<ActiveUsers users={users} maxDisplay={3} />)
    // Should show 3 user avatars + overflow indicator
    expect(screen.getByText('+2')).toBeInTheDocument()
    expect(screen.getByText('5 users online')).toBeInTheDocument()
  })

  it('respects custom maxDisplay', () => {
    const users = [
      createUser('u1', 'Alice'),
      createUser('u2', 'Bob'),
      createUser('u3', 'Charlie'),
    ]
    render(<ActiveUsers users={users} maxDisplay={2} />)
    expect(screen.getByText('+1')).toBeInTheDocument()
  })

  it('does not show overflow when users fit within maxDisplay', () => {
    const users = [
      createUser('u1', 'Alice'),
      createUser('u2', 'Bob'),
    ]
    render(<ActiveUsers users={users} maxDisplay={5} />)
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument()
  })

  it('shows user name as title on avatar', () => {
    const users = [createUser('u1', 'Jane Smith')]
    render(<ActiveUsers users={users} />)
    expect(screen.getByTitle('Jane Smith')).toBeInTheDocument()
  })

  it('handles single-word names for initials', () => {
    const users = [createUser('u1', 'Madonna')]
    render(<ActiveUsers users={users} />)
    expect(screen.getByText('M')).toBeInTheDocument()
  })

  it('truncates initials to 2 characters for long names', () => {
    const users = [createUser('u1', 'John Michael Smith')]
    render(<ActiveUsers users={users} />)
    expect(screen.getByText('JM')).toBeInTheDocument()
  })
})
