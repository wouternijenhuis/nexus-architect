// Domain-specific stores — barrel re-exports
export { useAuthStore } from './authStore'
export type { AuthState } from './authStore'

export { useCollaborationStore } from './collaborationStore'
export type { CollaborationUser, CollaborationState } from './collaborationStore'

export { useProjectStore, useStore } from './projectStore'
export type { ProjectState } from './projectStore'

export { useSchemaStore } from './schemaStore'
export type { SchemaActions } from './schemaStore'

export { useUIStore } from './uiStore'
export type { UIState } from './uiStore'
