# Task 007: Implement XSD Import Parser

**Task ID**: TASK-007  
**Order**: 007  
**Phase**: Foundation - Feature Completion  
**Priority**: HIGH  
**Estimated Effort**: 5-7 days
**Status**: ✅ COMPLETE

## Description

Implement complete XSD import functionality to parse XML Schema Definition files and convert them into Nexus Architect's internal schema representation. Currently only XSD export is implemented, making import a critical missing feature for bidirectional workflow support.

## Dependencies

- None

## Technical Requirements

### Current State

**Export (COMPLETE)**:

- `frontend/src/lib/xsd-utils.ts` - `generateXSDString()` fully implemented
- Converts internal schema to valid XSD XML
- Supports elements, attributes, types, restrictions

**Import (INCOMPLETE)**:

- `frontend/src/lib/xsd-utils.ts` - `parseXSD()` is placeholder with TODO comment
- Returns empty schema structure
- No XML parsing logic
- No type conversion logic

### Implementation Scope

**XSD Parser Requirements**:

1. Parse XML string into DOM structure
2. Extract root schema element
3. Parse element definitions (simpleType, complexType, element, attribute)
4. Convert XSD types to internal type system
5. Extract restrictions (minOccurs, maxOccurs, pattern, enum, etc.)
6. Handle namespaces (xs:, xsd:, custom)
7. Support nested elements and complex types
8. Validate XSD structure
9. Error handling for malformed XML

**Type Mapping**:

```typescript
// XSD Type → Internal Type
'xs:string' → 'string'
'xs:integer' | 'xs:int' | 'xs:long' → 'number'
'xs:decimal' | 'xs:float' | 'xs:double' → 'number'
'xs:boolean' → 'boolean'
'xs:date' | 'xs:dateTime' | 'xs:time' → 'date'
Custom complexType → 'object'
Custom simpleType with restrictions → appropriate base type + constraints
```

**Supported XSD Features (Phase 1)**:

- ✅ Simple types (string, number, boolean, date)
- ✅ Complex types (objects with nested elements)
- ✅ Attributes
- ✅ Element occurrence (minOccurs, maxOccurs)
- ✅ Restrictions (pattern, enumeration, minLength, maxLength)
- ✅ Namespaces (xs:, xsd:)

**Unsupported XSD Features (Future)**:

- ❌ xs:choice
- ❌ xs:sequence with strict ordering
- ❌ xs:group
- ❌ xs:include / xs:import
- ❌ xs:any / xs:anyAttribute
- ❌ Complex inheritance (extension, restriction)

### Implementation Structure

**File**: `frontend/src/lib/xsd-utils.ts`

```typescript
interface ParseResult {
  schema: Schema;
  errors: Array<{ line: number; message: string }>;
  warnings: Array<{ message: string }>;
}

export function parseXSD(xsdString: string): ParseResult {
  // 1. Parse XML string to DOM
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xsdString, 'text/xml');
  
  // 2. Validate XML structure
  if (hasParseErrors(xmlDoc)) {
    return { schema: emptySchema, errors: [...], warnings: [] };
  }
  
  // 3. Extract root schema element
  const schemaElement = xmlDoc.querySelector('schema');
  
  // 4. Parse elements recursively
  const elements = parseElements(schemaElement);
  
  // 5. Convert to internal schema structure
  const schema = convertToInternalSchema(elements);
  
  return { schema, errors: [], warnings: [] };
}
```

**Helper Functions**:

```typescript
function parseElement(node: Element): SchemaElement
function parseComplexType(node: Element): ComplexType
function parseSimpleType(node: Element): SimpleType
function parseRestrictions(node: Element): Restriction[]
function convertXSDType(xsdType: string): InternalType
function resolveNamespace(node: Element): string
function extractOccurrence(node: Element): { min: number; max: number | 'unbounded' }
```

### Error Handling

**Parse Errors**:

- Malformed XML
- Invalid XSD structure
- Unknown type references
- Circular type dependencies
- Namespace resolution failures

**Error Response**:

```typescript
{
  schema: null,
  errors: [
    { line: 15, message: "Unknown type reference: 'CustomType'" },
    { line: 23, message: "Invalid minOccurs value: 'abc'" }
  ],
  warnings: [
    { message: "xs:choice is not supported, treating as sequence" }
  ]
}
```

### Validation

**Post-Parse Validation**:

- All type references resolved
- No circular dependencies
- Occurrence values valid (minOccurs ≤ maxOccurs)
- Restriction values valid for type
- Required attributes present

## Acceptance Criteria

- ✅ `parseXSD()` function fully implemented (no TODO comments)
- ✅ Parses valid XSD files into internal schema representation
- ✅ Supports simple types (string, number, boolean, date)
- ✅ Supports complex types (nested objects)
- ✅ Supports attributes
- ✅ Supports element occurrence (minOccurs, maxOccurs)
- ✅ Supports restrictions (pattern, enum, length)
- ✅ Handles namespaces (xs:, xsd:)
- ✅ Returns errors for malformed XML
- ✅ Returns warnings for unsupported features
- ✅ Round-trip works: export XSD → import XSD → produces equivalent schema
- ✅ Tests pass with ≥85% coverage

## Testing Requirements

### Unit Tests

**Test File**: `frontend/src/lib/xsd-utils.test.ts`

```typescript
describe('parseXSD', () => {
  describe('Simple Types', () => {
    it('should parse xs:string element', () => {})
    it('should parse xs:integer element', () => {})
    it('should parse xs:boolean element', () => {})
    it('should parse xs:date element', () => {})
  })

  describe('Complex Types', () => {
    it('should parse complexType with nested elements', () => {})
    it('should parse nested complexTypes', () => {})
    it('should parse mixed simple and complex types', () => {})
  })

  describe('Attributes', () => {
    it('should parse element with attributes', () => {})
    it('should parse required attributes', () => {})
    it('should parse optional attributes', () => {})
  })

  describe('Occurrences', () => {
    it('should parse minOccurs and maxOccurs', () => {})
    it('should parse unbounded maxOccurs', () => {})
    it('should default to minOccurs=1 maxOccurs=1', () => {})
  })

  describe('Restrictions', () => {
    it('should parse pattern restriction', () => {})
    it('should parse enumeration restriction', () => {})
    it('should parse minLength/maxLength', () => {})
    it('should parse minInclusive/maxInclusive', () => {})
  })

  describe('Namespaces', () => {
    it('should handle xs: prefix', () => {})
    it('should handle xsd: prefix', () => {})
    it('should handle default namespace', () => {})
  })

  describe('Error Handling', () => {
    it('should return error for malformed XML', () => {})
    it('should return error for invalid XSD structure', () => {})
    it('should return error for unknown type reference', () => {})
    it('should return warning for unsupported features', () => {})
  })

  describe('Round-Trip', () => {
    it('should produce equivalent schema after export → import', () => {
      const originalSchema = createTestSchema();
      const xsdString = generateXSDString(originalSchema);
      const { schema: parsedSchema } = parseXSD(xsdString);
      expect(parsedSchema).toEqual(originalSchema);
    })
  })
})
```

### Integration Tests

**Test File**: `frontend/src/features/schema/import.integration.test.tsx`

```typescript
describe('XSD Import Integration', () => {
  it('should import XSD file and create schema', async () => {
    // Upload XSD file
    // Verify schema created in project
    // Verify schema elements match XSD
  })

  it('should handle import errors gracefully', async () => {
    // Upload invalid XSD
    // Verify error message displayed
    // Verify no schema created
  })

  it('should warn about unsupported features', async () => {
    // Upload XSD with xs:choice
    // Verify warning displayed
    // Verify partial import succeeded
  })
})
```

### Test Data

Create sample XSD files for testing:

**Test File**: `frontend/src/test/fixtures/simple.xsd`

```xml
<?xml version="1.0"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="Person">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="Name" type="xs:string"/>
        <xs:element name="Age" type="xs:integer"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>
```

**Test File**: `frontend/src/test/fixtures/complex.xsd`

```xml
<?xml version="1.0"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="Library">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="Book" maxOccurs="unbounded">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="Title" type="xs:string"/>
              <xs:element name="Author" type="xs:string" maxOccurs="unbounded"/>
              <xs:element name="ISBN" type="xs:string"/>
            </xs:sequence>
            <xs:attribute name="id" type="xs:string" use="required"/>
          </xs:complexType>
        </xs:element>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>
```

**Test File**: `frontend/src/test/fixtures/restrictions.xsd` - with patterns, enums, length constraints

**Test File**: `frontend/src/test/fixtures/invalid.xsd` - malformed XML

**Test File**: `frontend/src/test/fixtures/unsupported.xsd` - with xs:choice, xs:group

### E2E Tests

**Test File**: `tests/e2e/tests/xsd-import.spec.ts`

```typescript
test('should import XSD file and edit schema', async ({ page }) => {
  // Navigate to project
  // Click "Import XSD"
  // Upload XSD file
  // Verify success message
  // Verify schema appears in list
  // Click schema to edit
  // Verify elements loaded correctly
  // Make edit
  // Export XSD
  // Verify export matches edited schema
});
```

### Manual Testing

1. Export XSD from existing schema
2. Import the exported XSD
3. Verify resulting schema matches original
4. Test with various XSD files:
   - Simple flat structures
   - Complex nested structures
   - With attributes
   - With restrictions
   - Malformed XML
   - Unsupported features

## Related Documentation

- [specs/features/schema-management.md](../features/schema-management.md) - F002: Schema Management Feature
- [specs/modernize/MODERNIZATION_SUMMARY.md](../modernize/MODERNIZATION_SUMMARY.md) - Critical Finding #3: XSD Import Incomplete
- [specs/modernize/assessment/technical-debt.md](../modernize/assessment/technical-debt.md) - Section 4.2: Incomplete XSD Import
- [specs/modernize/strategy/roadmap.md](../modernize/strategy/roadmap.md) - Phase 1, Weeks 2-3
- [frontend/src/lib/xsd-utils.ts](../../frontend/src/lib/xsd-utils.ts) - Lines 1-50: parseXSD placeholder

---

**Next Tasks**: 008 (Implement Input Validation), 009 (Add Error Handling)
