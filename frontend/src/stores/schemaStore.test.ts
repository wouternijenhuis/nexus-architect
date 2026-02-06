import { describe, it, expect, beforeEach } from 'vitest'
import { useProjectStore } from './projectStore'

const resetStore = () => {
  useProjectStore.setState({
    projects: [],
    currentProject: null,
    currentSchema: null,
  })
}

describe('schemaStore (schema actions on projectStore)', () => {
  beforeEach(resetStore)

  const seedProject = () => {
    useProjectStore.getState().createProject('Schema Host')
    return useProjectStore.getState().projects[0]
  }

  // ── createSchema ──────────────────────────────────────────────

  it('creates a schema within a project', () => {
    const project = seedProject()

    useProjectStore.getState().createSchema(project.id, 'OrderSchema')

    const updated = useProjectStore.getState().projects.find((p) => p.id === project.id)!
    expect(updated.schemas).toHaveLength(1)
    expect(updated.schemas[0].name).toBe('OrderSchema')
    expect(updated.schemas[0].elements).toEqual([])
    expect(updated.schemas[0].complexTypes).toEqual([])
    expect(updated.schemas[0].simpleTypes).toEqual([])
    expect(updated.schemas[0].imports).toEqual([])
  })

  it('does not modify other projects when creating a schema', () => {
    useProjectStore.getState().createProject('Project A')
    useProjectStore.getState().createProject('Project B')
    const [projA, projB] = useProjectStore.getState().projects

    useProjectStore.getState().createSchema(projA.id, 'Schema1')

    const updatedB = useProjectStore.getState().projects.find((p) => p.id === projB.id)!
    expect(updatedB.schemas).toHaveLength(0)
  })

  // ── deleteSchema ──────────────────────────────────────────────

  it('deletes a schema from a project', () => {
    const project = seedProject()
    useProjectStore.getState().createSchema(project.id, 'ToDelete')
    const schemaId = useProjectStore.getState().projects[0].schemas[0].id

    useProjectStore.getState().deleteSchema(project.id, schemaId)

    expect(useProjectStore.getState().projects[0].schemas).toHaveLength(0)
  })

  it('clears currentSchema when the deleted schema is current', () => {
    const project = seedProject()
    useProjectStore.getState().createSchema(project.id, 'Current')
    const schema = useProjectStore.getState().projects[0].schemas[0]
    useProjectStore.setState({ currentSchema: schema })

    useProjectStore.getState().deleteSchema(project.id, schema.id)

    expect(useProjectStore.getState().currentSchema).toBeNull()
  })

  it('leaves currentSchema when deleting a different schema', () => {
    const project = seedProject()
    useProjectStore.getState().createSchema(project.id, 'Keep')
    useProjectStore.getState().createSchema(project.id, 'Delete')
    const schemas = useProjectStore.getState().projects[0].schemas
    useProjectStore.setState({ currentSchema: schemas[0] })

    useProjectStore.getState().deleteSchema(project.id, schemas[1].id)

    expect(useProjectStore.getState().currentSchema?.id).toBe(schemas[0].id)
  })

  // ── updateSchema ──────────────────────────────────────────────

  it('updates a schema in-place', () => {
    const project = seedProject()
    useProjectStore.getState().createSchema(project.id, 'Original')
    const schema = useProjectStore.getState().projects[0].schemas[0]

    const modified = { ...schema, name: 'Renamed' }
    useProjectStore.getState().updateSchema(project.id, modified)

    const updated = useProjectStore.getState().projects[0].schemas[0]
    expect(updated.name).toBe('Renamed')
  })

  // ── setCurrentSchema ──────────────────────────────────────────

  it('sets the current schema', () => {
    const project = seedProject()
    useProjectStore.getState().createSchema(project.id, 'S1')
    const schema = useProjectStore.getState().projects[0].schemas[0]

    useProjectStore.getState().setCurrentSchema(schema)

    expect(useProjectStore.getState().currentSchema).toEqual(schema)
  })

  it('clears the current schema with null', () => {
    useProjectStore.setState({ currentSchema: { id: 's' } as never })

    useProjectStore.getState().setCurrentSchema(null)

    expect(useProjectStore.getState().currentSchema).toBeNull()
  })

  // ── useSchemaStore selector ───────────────────────────────────

  it('useSchemaStore exposes schema actions from projectStore', async () => {
    // Dynamic import to verify the module wires up correctly at the module level
    const { useSchemaStore } = await import('./schemaStore')
    // The hook itself is a function — we can't call it outside React,
    // but we can verify it's exported and is a function.
    expect(typeof useSchemaStore).toBe('function')
  })
})
