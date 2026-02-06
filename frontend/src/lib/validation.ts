import { z } from 'zod'

/**
 * Schema for validating project names
 * - 1-100 characters
 * - Alphanumeric characters, spaces, hyphens, and underscores allowed
 */
export const projectNameSchema = z
  .string()
  .min(1, 'Project name is required')
  .max(100, 'Project name must be 100 characters or less')
  .regex(
    /^[a-zA-Z0-9\s\-_]+$/,
    'Project name can only contain letters, numbers, spaces, hyphens, and underscores'
  )

/**
 * Schema for validating schema names
 * - 1-100 characters
 */
export const schemaNameSchema = z
  .string()
  .min(1, 'Schema name is required')
  .max(100, 'Schema name must be 100 characters or less')
  .regex(
    /^[a-zA-Z0-9\s\-_]+$/,
    'Schema name can only contain letters, numbers, spaces, hyphens, and underscores'
  )

/**
 * Schema for validating XML element names
 * - Must start with a letter
 * - Can contain letters, numbers, and underscores
 */
export const elementNameSchema = z
  .string()
  .min(1, 'Element name is required')
  .max(100, 'Element name must be 100 characters or less')
  .regex(
    /^[a-zA-Z][a-zA-Z0-9_]*$/,
    'Element name must start with a letter and can only contain letters, numbers, and underscores'
  )

/**
 * Schema for project description (optional)
 */
export const projectDescriptionSchema = z
  .string()
  .max(500, 'Description must be 500 characters or less')
  .optional()

/**
 * Full project validation schema
 */
export const projectSchema = z.object({
  name: projectNameSchema,
  description: projectDescriptionSchema,
})

/**
 * Full schema validation schema
 */
export const xsdSchemaSchema = z.object({
  name: schemaNameSchema,
})

export type ProjectInput = z.infer<typeof projectSchema>
export type SchemaInput = z.infer<typeof xsdSchemaSchema>

/**
 * Validation result type
 */
export interface ValidationResult<T> {
  success: boolean
  data?: T
  error?: string
  errors?: Record<string, string>
}

/**
 * Helper function to validate data against a Zod schema
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @returns ValidationResult with success status and either data or error
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data)

  if (result.success) {
    return {
      success: true,
      data: result.data,
    }
  }

  // Extract the first error message
  const firstError = result.error.issues[0]
  const error = firstError?.message || 'Validation failed'

  // Build a map of field errors
  const errors: Record<string, string> = {}
  for (const err of result.error.issues) {
    const path = err.path.join('.')
    if (path && !errors[path]) {
      errors[path] = err.message
    }
  }

  return {
    success: false,
    error,
    errors,
  }
}

/**
 * Validate a project name
 */
export function validateProjectName(name: string): ValidationResult<string> {
  return validate(projectNameSchema, name)
}

/**
 * Validate a schema name
 */
export function validateSchemaName(name: string): ValidationResult<string> {
  return validate(schemaNameSchema, name)
}

/**
 * Validate an element name
 */
export function validateElementName(name: string): ValidationResult<string> {
  return validate(elementNameSchema, name)
}

/**
 * Validate a full project input
 */
export function validateProject(input: unknown): ValidationResult<ProjectInput> {
  return validate(projectSchema, input)
}
