import { describe, it, expect, beforeEach } from 'vitest'
import { useProjectStore } from './projectStore'
import type { XSDProject } from '../types/xsd'

const resetStore = () => {
  useProjectStore.setState({
    projects: [],
    currentProject: null,
    currentSchema: null,
  })
}

const makeProject = (overrides: Partial<XSDProject> = {}): XSDProject => ({
  id: 'proj-1',
  name: 'Test Project',
  description: 'desc',
  schemas: [],
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  ...overrides,
})

describe('projectStore', () => {
  beforeEach(resetStore)

  // ── createProject ─────────────────────────────────────────────

  it('creates a project and appends it to the list', () => {
    useProjectStore.getState().createProject('My Project', 'A description')

    const { projects } = useProjectStore.getState()
    expect(projects).toHaveLength(1)
    expect(projects[0].name).toBe('My Project')
    expect(projects[0].description).toBe('A description')
    expect(projects[0].schemas).toEqual([])
  })

  it('creates a project without a description', () => {
    useProjectStore.getState().createProject('No Desc')

    const { projects } = useProjectStore.getState()
    expect(projects).toHaveLength(1)
    expect(projects[0].description).toBeUndefined()
  })

  // ── deleteProject ─────────────────────────────────────────────

  it('removes a project by id', () => {
    useProjectStore.setState({ projects: [makeProject()] })

    useProjectStore.getState().deleteProject('proj-1')

    expect(useProjectStore.getState().projects).toHaveLength(0)
  })

  it('clears currentProject when the deleted project is current', () => {
    const project = makeProject()
    useProjectStore.setState({ projects: [project], currentProject: project })

    useProjectStore.getState().deleteProject('proj-1')

    expect(useProjectStore.getState().currentProject).toBeNull()
  })

  it('leaves currentProject unchanged when deleting a different project', () => {
    const proj1 = makeProject({ id: 'proj-1', name: 'P1' })
    const proj2 = makeProject({ id: 'proj-2', name: 'P2' })
    useProjectStore.setState({ projects: [proj1, proj2], currentProject: proj1 })

    useProjectStore.getState().deleteProject('proj-2')

    expect(useProjectStore.getState().currentProject?.id).toBe('proj-1')
    expect(useProjectStore.getState().projects).toHaveLength(1)
  })

  // ── setCurrentProject ─────────────────────────────────────────

  it('sets the current project and resets currentSchema', () => {
    const project = makeProject()
    useProjectStore.setState({ currentSchema: { id: 's', name: 's' } as never })

    useProjectStore.getState().setCurrentProject(project)

    expect(useProjectStore.getState().currentProject).toEqual(project)
    expect(useProjectStore.getState().currentSchema).toBeNull()
  })

  // ── exportProject / importProject ─────────────────────────────

  it('exports a project as JSON', () => {
    const project = makeProject()
    useProjectStore.setState({ projects: [project] })

    const json = useProjectStore.getState().exportProject('proj-1')
    const parsed = JSON.parse(json)

    expect(parsed.name).toBe('Test Project')
  })

  it('returns empty string when exporting a non-existent project', () => {
    const json = useProjectStore.getState().exportProject('does-not-exist')
    expect(json).toBe('')
  })

  it('imports a project from JSON with a new id', () => {
    const project = makeProject()
    const json = JSON.stringify(project)

    useProjectStore.getState().importProject(json)

    const { projects } = useProjectStore.getState()
    expect(projects).toHaveLength(1)
    expect(projects[0].name).toBe('Test Project')
    // id should have been regenerated
    expect(projects[0].id).not.toBe('proj-1')
  })

  it('handles invalid JSON gracefully on import', () => {
    useProjectStore.getState().importProject('not json')

    expect(useProjectStore.getState().projects).toHaveLength(0)
  })

  // ── backward compat alias ─────────────────────────────────────

  it('exports useStore as an alias for useProjectStore', async () => {
    const { useStore } = await import('./projectStore')
    expect(useStore).toBe(useProjectStore)
  })
})
