import Joi from 'joi'
import { Request, Response, NextFunction } from 'express'

/**
 * Joi schema for project validation
 */
export const projectSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(100)
    .pattern(/^[a-zA-Z0-9\s\-_]+$/)
    .required()
    .messages({
      'string.empty': 'Project name is required',
      'string.min': 'Project name is required',
      'string.max': 'Project name must be 100 characters or less',
      'string.pattern.base':
        'Project name can only contain letters, numbers, spaces, hyphens, and underscores',
      'any.required': 'Project name is required',
    }),
  description: Joi.string()
    .max(500)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Description must be 500 characters or less',
    }),
})

/**
 * Joi schema for XSD schema validation
 */
export const schemaSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(100)
    .pattern(/^[a-zA-Z0-9\s\-_]+$/)
    .required()
    .messages({
      'string.empty': 'Schema name is required',
      'string.min': 'Schema name is required',
      'string.max': 'Schema name must be 100 characters or less',
      'string.pattern.base':
        'Schema name can only contain letters, numbers, spaces, hyphens, and underscores',
      'any.required': 'Schema name is required',
    }),
})

/**
 * Joi schema for element name validation
 */
export const elementNameSchema = Joi.string()
  .min(1)
  .max(100)
  .pattern(/^[a-zA-Z][a-zA-Z0-9_]*$/)
  .messages({
    'string.empty': 'Element name is required',
    'string.min': 'Element name is required',
    'string.max': 'Element name must be 100 characters or less',
    'string.pattern.base':
      'Element name must start with a letter and can only contain letters, numbers, and underscores',
  })

/**
 * Validation error response interface
 */
interface ValidationError {
  success: false
  error: string
  details?: Record<string, string>
}

/**
 * Format Joi validation error into a structured response
 */
function formatValidationError(error: Joi.ValidationError): ValidationError {
  const details: Record<string, string> = {}

  for (const detail of error.details) {
    const key = detail.path.join('.')
    if (key && !details[key]) {
      details[key] = detail.message
    }
  }

  return {
    success: false,
    error: error.details[0]?.message || 'Validation failed',
    details,
  }
}

/**
 * Middleware to validate project creation/update requests
 */
export function validateProject(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { error, value } = projectSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  })

  if (error) {
    res.status(400).json(formatValidationError(error))
    return
  }

  // Replace body with validated and sanitized data
  req.body = value
  next()
}

/**
 * Middleware to validate schema creation/update requests
 */
export function validateSchema(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { error, value } = schemaSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  })

  if (error) {
    res.status(400).json(formatValidationError(error))
    return
  }

  // Replace body with validated and sanitized data
  req.body = value
  next()
}

/**
 * Generic validation middleware factory
 */
export function createValidator(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    })

    if (error) {
      res.status(400).json(formatValidationError(error))
      return
    }

    req.body = value
    next()
  }
}
