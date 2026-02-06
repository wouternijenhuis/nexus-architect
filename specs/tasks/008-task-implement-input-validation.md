# Task 008: Implement Comprehensive Input Validation

**Task ID**: TASK-008  
**Order**: 008  
**Phase**: Foundation - Security & Quality  
**Priority**: HIGH  
**Estimated Effort**: 3-4 days
**Status**: ✅ COMPLETE

## Description

Implement comprehensive input validation for all user inputs across frontend and backend to prevent invalid data, injection attacks, and data corruption. Currently minimal validation exists, creating security and reliability risks.

## Dependencies

- None (can run in parallel with other tasks)

## Technical Requirements

### Validation Scope

**Frontend Validation** (User Experience):

- Project names (required, length, allowed characters)
- Schema names (required, length, allowed characters)
- Element names (XSD-compliant, no spaces, starts with letter)
- Attribute names (XSD-compliant)
- Type selections (must be from allowed list)
- XSD content (valid XML structure)
- File uploads (size, type, content)

**Backend Validation** (Security & Data Integrity):

- Request body structure (required fields, types)
- String lengths (prevent overflow)
- Numeric ranges (prevent integer overflow)
- SQL/NoSQL injection patterns (for future database)
- XSS patterns in user content
- File upload validation
- API parameter validation

### Validation Library

**Frontend**: Zod for TypeScript-first validation

```bash
cd frontend && npm install zod
```

**Backend**: Joi or Zod for schema validation

```bash
cd backend && npm install joi
```

### Implementation Structure

**Frontend Validation Schema** (`frontend/src/lib/validation.ts`):

```typescript
import { z } from 'zod';

export const projectNameSchema = z
  .string()
  .min(1, 'Project name is required')
  .max(100, 'Project name must be less than 100 characters')
  .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Project name can only contain letters, numbers, spaces, hyphens, and underscores');

export const schemaNameSchema = z
  .string()
  .min(1, 'Schema name is required')
  .max(100, 'Schema name must be less than 100 characters')
  .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Schema name can only contain letters, numbers, spaces, hyphens, and underscores');

export const elementNameSchema = z
  .string()
  .min(1, 'Element name is required')
  .max(50, 'Element name must be less than 50 characters')
  .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Element name must start with a letter and contain only letters, numbers, and underscores');

export const xsdContentSchema = z
  .string()
  .min(1, 'XSD content is required')
  .refine((val) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(val, 'text/xml');
      return !doc.querySelector('parsererror');
    } catch {
      return false;
    }
  }, 'Invalid XML structure');
```

**Backend Validation Middleware** (`backend/src/middleware/validation.ts`):

```typescript
import Joi from 'joi';

export const validateCreateProject = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(500).optional(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation Error',
      details: error.details.map(d => d.message),
    });
  }
  next();
};
```

### Validation Rules

**Project**:

- Name: 1-100 characters, alphanumeric + spaces/hyphens/underscores
- Description: 0-500 characters (optional)

**Schema**:

- Name: 1-100 characters, alphanumeric + spaces/hyphens/underscores
- Content: Valid JSON structure
- XSD export: Valid XML

**Element**:

- Name: 1-50 characters, starts with letter, alphanumeric + underscores
- Type: Must be one of: string, number, boolean, date, object, array
- MinOccurs: Integer ≥ 0
- MaxOccurs: Integer ≥ minOccurs OR "unbounded"

**Attribute**:

- Name: 1-50 characters, starts with letter, alphanumeric + underscores
- Type: Must be one of: string, number, boolean
- Required: Boolean

**File Upload**:

- XSD files: Must be .xsd extension, max 1MB, valid XML
- JSON files: Must be .json extension, max 5MB, valid JSON

### Error Messages

User-friendly error messages:

```typescript
{
  'required': 'This field is required',
  'min': 'Must be at least {min} characters',
  'max': 'Must be no more than {max} characters',
  'pattern': 'Invalid format',
  'type': 'Invalid type',
  'enum': 'Must be one of: {values}',
}
```

### Sanitization

In addition to validation, sanitize inputs:

- Trim whitespace from strings
- Normalize line endings (CRLF → LF)
- Remove null bytes
- Encode HTML entities in user content
- Lowercase email addresses (if added)

## Acceptance Criteria

- ✅ Zod validation library installed in frontend
- ✅ Joi validation library installed in backend
- ✅ Validation schemas defined for all entities
- ✅ Frontend forms validate on blur and submit
- ✅ Frontend displays user-friendly validation errors
- ✅ Backend validates all POST/PUT request bodies
- ✅ Backend returns 400 with error details for invalid data
- ✅ File uploads validated (type, size, content)
- ✅ XSD/JSON content validated before parsing
- ✅ Invalid data prevented from reaching localStorage/state
- ✅ Tests pass with ≥85% coverage

## Testing Requirements

### Unit Tests

**Test File**: `frontend/src/lib/validation.test.ts`

```typescript
describe('Validation Schemas', () => {
  describe('projectNameSchema', () => {
    it('should accept valid project names', () => {})
    it('should reject empty name', () => {})
    it('should reject name > 100 chars', () => {})
    it('should reject special characters', () => {})
  })

  describe('elementNameSchema', () => {
    it('should accept valid element names', () => {})
    it('should reject names starting with number', () => {})
    it('should reject names with spaces', () => {})
    it('should reject names with hyphens', () => {})
  })

  describe('xsdContentSchema', () => {
    it('should accept valid XML', () => {})
    it('should reject malformed XML', () => {})
    it('should reject empty content', () => {})
  })
})
```

**Test File**: `backend/src/middleware/validation.test.ts`

```typescript
describe('Validation Middleware', () => {
  describe('validateCreateProject', () => {
    it('should pass valid project data', () => {})
    it('should reject missing name', () => {})
    it('should reject name > 100 chars', () => {})
    it('should return 400 with error details', () => {})
  })

  describe('validateCreateSchema', () => {
    it('should pass valid schema data', () => {})
    it('should reject invalid element names', () => {})
    it('should reject invalid types', () => {})
  })
})
```

### Integration Tests

**Test File**: `frontend/src/features/project/validation.integration.test.tsx`

```typescript
describe('Project Form Validation', () => {
  it('should show error for empty project name', () => {
    // Render project form
    // Click submit without entering name
    // Verify error message displayed
  })

  it('should show error for invalid characters', () => {
    // Enter name with special characters
    // Blur field
    // Verify error message
  })

  it('should prevent submission with invalid data', () => {
    // Enter invalid data
    // Click submit
    // Verify API not called
    // Verify form not cleared
  })

  it('should allow submission with valid data', () => {
    // Enter valid data
    // Click submit
    // Verify API called
    // Verify success
  })
})
```

**Test File**: `backend/src/test/validation.integration.test.ts`

```typescript
describe('API Validation', () => {
  it('should reject invalid project creation', async () => {
    const response = await request(app)
      .post('/api/projects')
      .send({ name: '' });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation Error');
  })

  it('should accept valid project creation', async () => {
    const response = await request(app)
      .post('/api/projects')
      .send({ name: 'Valid Project' });
    
    expect(response.status).toBe(201);
  })
})
```

### E2E Tests

**Test File**: `tests/e2e/tests/validation.spec.ts`

```typescript
test('should validate project name', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("New Project")');
  
  // Try empty name
  await page.click('button:has-text("Create")');
  await expect(page.locator('.error-message')).toContainText('required');
  
  // Try invalid characters
  await page.fill('input[name="name"]', 'Project@#$');
  await page.blur('input[name="name"]');
  await expect(page.locator('.error-message')).toContainText('Invalid format');
  
  // Try valid name
  await page.fill('input[name="name"]', 'Valid Project');
  await page.click('button:has-text("Create")');
  await expect(page.locator('.error-message')).not.toBeVisible();
});

test('should validate element name in schema editor', async ({ page }) => {
  // Create project and schema
  // Add element with invalid name (starts with number)
  // Verify error message
  // Cannot save schema
});
```

### Manual Testing

1. Test all form fields with invalid data
2. Test boundary conditions (0 length, max length, max+1 length)
3. Test XSS payloads: `<script>alert('xss')</script>`
4. Test SQL injection patterns: `' OR '1'='1`
5. Test Unicode characters
6. Test very large files (>10MB)
7. Test malformed JSON/XML

## Related Documentation

- [specs/modernize/assessment/security-audit.md](../modernize/assessment/security-audit.md) - Section 2.3: Input Validation
- [specs/modernize/assessment/technical-debt.md](../modernize/assessment/technical-debt.md) - Section 3.2: Missing Input Validation
- [specs/modernize/strategy/roadmap.md](../modernize/strategy/roadmap.md) - Phase 2, Week 6

---

**Next Tasks**: 009 (Add Comprehensive Error Handling)
