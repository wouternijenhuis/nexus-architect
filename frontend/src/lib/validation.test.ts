import { describe, it, expect } from 'vitest'
import {
  projectNameSchema,
  schemaNameSchema,
  elementNameSchema,
  projectSchema,
  validate,
  validateProjectName,
  validateSchemaName,
  validateElementName,
  validateProject,
} from './validation'

describe('projectNameSchema', () => {
  it('should accept valid project names', () => {
    const validNames = [
      'My Project',
      'project-name',
      'project_name',
      'Project123',
      'a',
      'A'.repeat(100),
    ]

    for (const name of validNames) {
      const result = validate(projectNameSchema, name)
      expect(result.success).toBe(true)
      expect(result.data).toBe(name)
    }
  })

  it('should reject empty project names', () => {
    const result = validate(projectNameSchema, '')
    expect(result.success).toBe(false)
    expect(result.error).toContain('required')
  })

  it('should reject project names longer than 100 characters', () => {
    const result = validate(projectNameSchema, 'A'.repeat(101))
    expect(result.success).toBe(false)
    expect(result.error).toContain('100 characters')
  })

  it('should reject project names with special characters', () => {
    const invalidNames = ['project@name', 'project!', 'project#123', 'project.name']

    for (const name of invalidNames) {
      const result = validate(projectNameSchema, name)
      expect(result.success).toBe(false)
      expect(result.error).toContain('only contain')
    }
  })
})

describe('schemaNameSchema', () => {
  it('should accept valid schema names', () => {
    const validNames = ['MySchema', 'schema-1', 'schema_test', 'Schema 123']

    for (const name of validNames) {
      const result = validate(schemaNameSchema, name)
      expect(result.success).toBe(true)
    }
  })

  it('should reject empty schema names', () => {
    const result = validate(schemaNameSchema, '')
    expect(result.success).toBe(false)
    expect(result.error).toContain('required')
  })

  it('should reject schema names with invalid characters', () => {
    const result = validate(schemaNameSchema, 'schema@invalid')
    expect(result.success).toBe(false)
    expect(result.error).toContain('only contain')
  })
})

describe('elementNameSchema', () => {
  it('should accept valid element names', () => {
    const validNames = ['element', 'Element', 'element123', 'element_name', 'E']

    for (const name of validNames) {
      const result = validate(elementNameSchema, name)
      expect(result.success).toBe(true)
    }
  })

  it('should reject empty element names', () => {
    const result = validate(elementNameSchema, '')
    expect(result.success).toBe(false)
    expect(result.error).toContain('required')
  })

  it('should reject element names starting with a number', () => {
    const result = validate(elementNameSchema, '123element')
    expect(result.success).toBe(false)
    expect(result.error).toContain('start with a letter')
  })

  it('should reject element names starting with underscore', () => {
    const result = validate(elementNameSchema, '_element')
    expect(result.success).toBe(false)
    expect(result.error).toContain('start with a letter')
  })

  it('should reject element names with hyphens', () => {
    const result = validate(elementNameSchema, 'element-name')
    expect(result.success).toBe(false)
    expect(result.error).toContain('only contain')
  })

  it('should reject element names with spaces', () => {
    const result = validate(elementNameSchema, 'element name')
    expect(result.success).toBe(false)
    expect(result.error).toContain('only contain')
  })
})

describe('projectSchema', () => {
  it('should accept valid project with name and description', () => {
    const result = validate(projectSchema, {
      name: 'My Project',
      description: 'A test project',
    })
    expect(result.success).toBe(true)
    expect(result.data).toEqual({
      name: 'My Project',
      description: 'A test project',
    })
  })

  it('should accept project with name only', () => {
    const result = validate(projectSchema, {
      name: 'My Project',
    })
    expect(result.success).toBe(true)
    expect(result.data).toEqual({
      name: 'My Project',
    })
  })

  it('should reject project without name', () => {
    const result = validate(projectSchema, {
      description: 'A test project',
    })
    expect(result.success).toBe(false)
    expect(result.errors?.name).toBeDefined()
  })

  it('should reject project with description over 500 characters', () => {
    const result = validate(projectSchema, {
      name: 'My Project',
      description: 'A'.repeat(501),
    })
    expect(result.success).toBe(false)
    expect(result.error).toContain('500 characters')
  })
})

describe('validateProjectName', () => {
  it('should return success for valid name', () => {
    const result = validateProjectName('Valid Project')
    expect(result.success).toBe(true)
    expect(result.data).toBe('Valid Project')
  })

  it('should return error for invalid name', () => {
    const result = validateProjectName('')
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
})

describe('validateSchemaName', () => {
  it('should return success for valid name', () => {
    const result = validateSchemaName('ValidSchema')
    expect(result.success).toBe(true)
  })

  it('should return error for invalid name', () => {
    const result = validateSchemaName('invalid@schema')
    expect(result.success).toBe(false)
  })
})

describe('validateElementName', () => {
  it('should return success for valid name', () => {
    const result = validateElementName('validElement')
    expect(result.success).toBe(true)
  })

  it('should return error for name starting with number', () => {
    const result = validateElementName('1invalid')
    expect(result.success).toBe(false)
  })
})

describe('validateProject', () => {
  it('should return success for valid project', () => {
    const result = validateProject({
      name: 'Test Project',
      description: 'Description',
    })
    expect(result.success).toBe(true)
  })

  it('should return detailed errors for invalid project', () => {
    const result = validateProject({
      name: '',
      description: 'A'.repeat(501),
    })
    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
  })
})
