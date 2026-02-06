import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Request, Response, NextFunction } from 'express'
import {
  projectSchema,
  schemaSchema,
  elementNameSchema,
  validateProject,
  validateSchema,
  createValidator,
} from './validation'

// Mock Express request, response, and next function
function createMockRequest(body: unknown): Partial<Request> {
  return { body }
}

function createMockResponse(): Partial<Response> & { statusCode?: number; jsonData?: unknown } {
  const res: Partial<Response> & { statusCode?: number; jsonData?: unknown } = {}
  res.status = vi.fn().mockImplementation((code: number) => {
    res.statusCode = code
    return res
  })
  res.json = vi.fn().mockImplementation((data: unknown) => {
    res.jsonData = data
    return res
  })
  return res
}

describe('projectSchema', () => {
  it('should validate a valid project', () => {
    const { error, value } = projectSchema.validate({
      name: 'My Project',
      description: 'A test project',
    })
    expect(error).toBeUndefined()
    expect(value).toEqual({
      name: 'My Project',
      description: 'A test project',
    })
  })

  it('should validate project with name only', () => {
    const { error, value } = projectSchema.validate({
      name: 'My Project',
    })
    expect(error).toBeUndefined()
    expect(value.name).toBe('My Project')
  })

  it('should allow empty description', () => {
    const { error } = projectSchema.validate({
      name: 'My Project',
      description: '',
    })
    expect(error).toBeUndefined()
  })

  it('should reject empty name', () => {
    const { error } = projectSchema.validate({
      name: '',
    })
    expect(error).toBeDefined()
    expect(error?.details[0].message).toContain('required')
  })

  it('should reject missing name', () => {
    const { error } = projectSchema.validate({
      description: 'A test project',
    })
    expect(error).toBeDefined()
    expect(error?.details[0].message).toContain('required')
  })

  it('should reject name longer than 100 characters', () => {
    const { error } = projectSchema.validate({
      name: 'A'.repeat(101),
    })
    expect(error).toBeDefined()
    expect(error?.details[0].message).toContain('100 characters')
  })

  it('should reject name with special characters', () => {
    const { error } = projectSchema.validate({
      name: 'Project@Name',
    })
    expect(error).toBeDefined()
    expect(error?.details[0].message).toContain('only contain')
  })

  it('should reject description longer than 500 characters', () => {
    const { error } = projectSchema.validate({
      name: 'My Project',
      description: 'A'.repeat(501),
    })
    expect(error).toBeDefined()
    expect(error?.details[0].message).toContain('500 characters')
  })
})

describe('schemaSchema', () => {
  it('should validate a valid schema', () => {
    const { error, value } = schemaSchema.validate({
      name: 'My Schema',
    })
    expect(error).toBeUndefined()
    expect(value.name).toBe('My Schema')
  })

  it('should reject empty name', () => {
    const { error } = schemaSchema.validate({
      name: '',
    })
    expect(error).toBeDefined()
    expect(error?.details[0].message).toContain('required')
  })

  it('should reject name with special characters', () => {
    const { error } = schemaSchema.validate({
      name: 'schema@name',
    })
    expect(error).toBeDefined()
    expect(error?.details[0].message).toContain('only contain')
  })
})

describe('elementNameSchema', () => {
  it('should validate valid element names', () => {
    const validNames = ['element', 'Element', 'element123', 'element_name']
    for (const name of validNames) {
      const { error } = elementNameSchema.validate(name)
      expect(error).toBeUndefined()
    }
  })

  it('should reject element names starting with number', () => {
    const { error } = elementNameSchema.validate('123element')
    expect(error).toBeDefined()
    expect(error?.details[0].message).toContain('start with a letter')
  })

  it('should reject element names with hyphens', () => {
    const { error } = elementNameSchema.validate('element-name')
    expect(error).toBeDefined()
  })
})

describe('validateProject middleware', () => {
  let mockNext: NextFunction

  beforeEach(() => {
    mockNext = vi.fn()
  })

  it('should call next() for valid project', () => {
    const req = createMockRequest({ name: 'Valid Project', description: 'Test' })
    const res = createMockResponse()

    validateProject(req as Request, res as Response, mockNext)

    expect(mockNext).toHaveBeenCalled()
    expect(req.body).toEqual({ name: 'Valid Project', description: 'Test' })
  })

  it('should strip unknown fields', () => {
    const req = createMockRequest({
      name: 'Valid Project',
      unknownField: 'should be removed',
    })
    const res = createMockResponse()

    validateProject(req as Request, res as Response, mockNext)

    expect(mockNext).toHaveBeenCalled()
    expect(req.body).toEqual({ name: 'Valid Project' })
    expect(req.body.unknownField).toBeUndefined()
  })

  it('should return 400 for invalid project', () => {
    const req = createMockRequest({ name: '' })
    const res = createMockResponse()

    validateProject(req as Request, res as Response, mockNext)

    expect(mockNext).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(400)
    expect(res.jsonData).toMatchObject({
      success: false,
      error: expect.any(String),
    })
  })

  it('should return detailed errors', () => {
    const req = createMockRequest({ name: 'Invalid@Name' })
    const res = createMockResponse()

    validateProject(req as Request, res as Response, mockNext)

    expect(res.jsonData).toMatchObject({
      success: false,
      error: expect.stringContaining('only contain'),
      details: {
        name: expect.any(String),
      },
    })
  })
})

describe('validateSchema middleware', () => {
  let mockNext: NextFunction

  beforeEach(() => {
    mockNext = vi.fn()
  })

  it('should call next() for valid schema', () => {
    const req = createMockRequest({ name: 'Valid Schema' })
    const res = createMockResponse()

    validateSchema(req as Request, res as Response, mockNext)

    expect(mockNext).toHaveBeenCalled()
    expect(req.body).toEqual({ name: 'Valid Schema' })
  })

  it('should return 400 for invalid schema', () => {
    const req = createMockRequest({ name: '' })
    const res = createMockResponse()

    validateSchema(req as Request, res as Response, mockNext)

    expect(mockNext).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(400)
  })
})

describe('createValidator', () => {
  it('should create a working validator middleware', () => {
    const customSchema = projectSchema
    const validator = createValidator(customSchema)
    const mockNext = vi.fn()

    const req = createMockRequest({ name: 'Test Project' })
    const res = createMockResponse()

    validator(req as Request, res as Response, mockNext)

    expect(mockNext).toHaveBeenCalled()
  })

  it('should return 400 for invalid data', () => {
    const customSchema = projectSchema
    const validator = createValidator(customSchema)
    const mockNext = vi.fn()

    const req = createMockRequest({ name: '' })
    const res = createMockResponse()

    validator(req as Request, res as Response, mockNext)

    expect(mockNext).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(400)
  })
})
