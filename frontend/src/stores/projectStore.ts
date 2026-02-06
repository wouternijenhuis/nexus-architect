import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { XSDProject, XSDSchema } from '../types/xsd'
import { createDebouncedStorage } from '../lib/debounced-storage'

export interface ProjectState {
  projects: XSDProject[]
  currentProject: XSDProject | null
  currentSchema: XSDSchema | null

  // Project actions
  createProject: (name: string, description?: string) => void
  deleteProject: (projectId: string) => void
  setCurrentProject: (project: XSDProject | null) => void
  exportProject: (projectId: string) => string
  importProject: (projectJson: string) => void

  // Schema actions (kept here to share the same persist key)
  createSchema: (projectId: string, name: string) => void
  deleteSchema: (projectId: string, schemaId: string) => void
  updateSchema: (projectId: string, schema: XSDSchema) => void
  setCurrentSchema: (schema: XSDSchema | null) => void
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProject: null,
      currentSchema: null,

      createProject: (name: string, description?: string) => {
        const newProject: XSDProject = {
          id: crypto.randomUUID(),
          name,
          description,
          schemas: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        set((state) => ({
          projects: [...state.projects, newProject],
        }))
      },

      deleteProject: (projectId: string) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== projectId),
          currentProject:
            state.currentProject?.id === projectId ? null : state.currentProject,
        }))
      },

      setCurrentProject: (project: XSDProject | null) => {
        set({ currentProject: project, currentSchema: null })
      },

      createSchema: (projectId: string, name: string) => {
        const newSchema: XSDSchema = {
          id: crypto.randomUUID(),
          name,
          elements: [],
          complexTypes: [],
          simpleTypes: [],
          imports: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, schemas: [...p.schemas, newSchema], updatedAt: new Date() }
              : p
          ),
        }))
      },

      deleteSchema: (projectId: string, schemaId: string) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  schemas: p.schemas.filter((s) => s.id !== schemaId),
                  updatedAt: new Date(),
                }
              : p
          ),
          currentSchema:
            state.currentSchema?.id === schemaId ? null : state.currentSchema,
        }))
      },

      updateSchema: (projectId: string, schema: XSDSchema) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  schemas: p.schemas.map((s) =>
                    s.id === schema.id ? { ...schema, updatedAt: new Date() } : s
                  ),
                  updatedAt: new Date(),
                }
              : p
          ),
        }))
      },

      setCurrentSchema: (schema: XSDSchema | null) => {
        set({ currentSchema: schema })
      },

      exportProject: (projectId: string) => {
        const project = get().projects.find((p) => p.id === projectId)
        return project ? JSON.stringify(project, null, 2) : ''
      },

      importProject: (projectJson: string) => {
        try {
          const project = JSON.parse(projectJson) as XSDProject
          project.id = crypto.randomUUID() // Generate new ID to avoid conflicts
          set((state) => ({
            projects: [...state.projects, project],
          }))
        } catch (error) {
          console.error('Failed to import project:', error)
        }
      },
    }),
    {
      name: 'nexus-architect-storage',
      storage: createJSONStorage(() => createDebouncedStorage(500)),
    }
  )
)

/**
 * Backward-compatible alias: `useStore` exposes the same API as the
 * original monolithic store so every existing `import { useStore }` keeps working.
 */
export const useStore = useProjectStore
