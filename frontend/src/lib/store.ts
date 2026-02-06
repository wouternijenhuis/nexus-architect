/**
 * Backward-compatible re-exports.
 *
 * All store logic now lives in `src/stores/`. This file re-exports every
 * public symbol so that existing `import { … } from '…/lib/store'` statements
 * continue to work without modification.
 */

export { useAuthStore } from '../stores/authStore'
export type { AuthState } from '../stores/authStore'

export { useCollaborationStore } from '../stores/collaborationStore'
export type { CollaborationUser, CollaborationState } from '../stores/collaborationStore'

export { useStore, useProjectStore } from '../stores/projectStore'
export type { ProjectState } from '../stores/projectStore'

export { useSchemaStore } from '../stores/schemaStore'
export type { SchemaActions } from '../stores/schemaStore'

export { useUIStore } from '../stores/uiStore'
export type { UIState } from '../stores/uiStore'
