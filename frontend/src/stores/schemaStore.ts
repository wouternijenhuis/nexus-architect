/**
 * Schema-specific selectors and helpers.
 *
 * The canonical schema state (currentSchema, createSchema, deleteSchema, updateSchema,
 * setCurrentSchema) lives inside `projectStore` so that it shares the same
 * 'nexus-architect-storage' persist key and existing localStorage data is preserved.
 *
 * This module re-exports a convenience `useSchemaStore` hook scoped to schema
 * operations only, for use in components that don't need project-level state.
 */

import { useProjectStore } from './projectStore'
import type { XSDSchema } from '../types/xsd'

export interface SchemaActions {
  currentSchema: XSDSchema | null
  createSchema: (projectId: string, name: string) => void
  deleteSchema: (projectId: string, schemaId: string) => void
  updateSchema: (projectId: string, schema: XSDSchema) => void
  setCurrentSchema: (schema: XSDSchema | null) => void
}

/**
 * A selector hook that exposes only schema-related state & actions
 * from the unified project store.
 */
export const useSchemaStore = (): SchemaActions => {
  return useProjectStore((state) => ({
    currentSchema: state.currentSchema,
    createSchema: state.createSchema,
    deleteSchema: state.deleteSchema,
    updateSchema: state.updateSchema,
    setCurrentSchema: state.setCurrentSchema,
  }))
}
