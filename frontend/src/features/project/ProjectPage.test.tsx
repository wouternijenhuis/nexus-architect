import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ProjectPage from './ProjectPage'
import { useStore } from '../../lib/store'

vi.mock('../../lib/xsd-utils', () => ({
  generateXSDString: vi.fn(() => '<xs:schema></xs:schema>'),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const renderProjectPage = (projectId: string) => {
  return render(
    <MemoryRouter initialEntries={[`/project/${projectId}`]}>
      <Routes>
        <Route path="/project/:projectId" element={<ProjectPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ProjectPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useStore.setState({
      projects: [
        {
          id: 'proj-1',
          name: 'Test Project',
          description: 'A test project',
          schemas: [
            {
              id: 'schema-1',
              name: 'TestSchema',
              targetNamespace: 'http://test.com',
              elements: [{ id: 'e1', name: 'root', type: 'xs:string', minOccurs: '1', maxOccurs: '1', children: [] }],
              complexTypes: [],
              simpleTypes: [],
              imports: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    })
  })

  it('renders project name and description', () => {
    renderProjectPage('proj-1')
    expect(screen.getByText('Test Project')).toBeInTheDocument()
    expect(screen.getByText('A test project')).toBeInTheDocument()
  })

  it('shows project not found for invalid id', () => {
    renderProjectPage('invalid-id')
    expect(screen.getByText('Project not found')).toBeInTheDocument()
  })

  it('renders schema cards', () => {
    renderProjectPage('proj-1')
    expect(screen.getByText('TestSchema')).toBeInTheDocument()
    expect(screen.getByText('Elements: 1')).toBeInTheDocument()
    expect(screen.getByText('Complex Types: 0')).toBeInTheDocument()
  })

  it('opens create schema modal', () => {
    renderProjectPage('proj-1')
    fireEvent.click(screen.getByText('New Schema'))
    expect(screen.getByText('Create New Schema')).toBeInTheDocument()
  })

  it('creates a new schema', () => {
    renderProjectPage('proj-1')
    fireEvent.click(screen.getByText('New Schema'))

    const input = screen.getByPlaceholderText('my-schema')
    fireEvent.change(input, { target: { value: 'NewSchema' } })

    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    const state = useStore.getState()
    const project = state.projects.find((p) => p.id === 'proj-1')
    expect(project?.schemas).toHaveLength(2)
  })

  it('opens delete schema dialog', () => {
    renderProjectPage('proj-1')
    fireEvent.click(screen.getByTitle('Delete'))
    expect(screen.getByText(/Are you sure you want to delete the schema "TestSchema"/)).toBeInTheDocument()
  })

  it('deletes a schema', () => {
    renderProjectPage('proj-1')
    fireEvent.click(screen.getByTitle('Delete'))
    fireEvent.click(screen.getByRole('button', { name: 'Delete Schema' }))

    const state = useStore.getState()
    const project = state.projects.find((p) => p.id === 'proj-1')
    expect(project?.schemas).toHaveLength(0)
  })

  it('navigates to schema editor', () => {
    renderProjectPage('proj-1')
    fireEvent.click(screen.getByText('Edit Schema'))
    expect(mockNavigate).toHaveBeenCalledWith('/schema/proj-1/schema-1')
  })

  it('navigates back to home', () => {
    renderProjectPage('proj-1')
    // Find the arrow button (first button in the list)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0]) // Back arrow is first
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('shows empty state when no schemas', () => {
    useStore.setState({
      projects: [
        {
          id: 'proj-empty',
          name: 'Empty Project',
          description: '',
          schemas: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    })
    renderProjectPage('proj-empty')
    expect(screen.getByText('No schemas yet')).toBeInTheDocument()
    expect(screen.getByText('Create Your First Schema')).toBeInTheDocument()
  })

  it('cancels create schema modal', () => {
    renderProjectPage('proj-1')
    fireEvent.click(screen.getByText('New Schema'))
    expect(screen.getByText('Create New Schema')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByText('Create New Schema')).not.toBeInTheDocument()
  })
})
