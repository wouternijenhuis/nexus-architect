# Feature: Schema Management

## Feature Overview

**Feature ID**: F002  
**Feature Name**: Schema Management  
**Priority**: High (Core Feature)  
**Status**: ✅ Fully Implemented

### Purpose
Enable users to create, view, and manage XSD schemas within projects. Schemas are the core data structures that define XML document constraints and validation rules.

### Business Value
- Create and maintain XSD schema definitions
- Export schemas to standard XSD format
- Organize multiple schemas per project
- Navigate to schema editor for detailed editing

## User Workflows

### Workflow 1: Create New Schema

**Actor**: User

**Precondition**: User is viewing a project (on ProjectPage)

**Steps**:
1. User navigates to `/project/:projectId`
2. User clicks "New Schema" button
3. Modal dialog appears
4. User enters schema name (required)
5. User clicks "Create" button
6. System creates empty schema with UUID
7. Schema added to project's schemas array
8. Schema appears in schemas list
9. Modal closes

**Implementation**: [frontend/src/features/project/ProjectPage.tsx#L33-L39](frontend/src/features/project/ProjectPage.tsx)

**Initial Schema Structure**:
```typescript
{
  id: UUID,                 // Generated
  name: string,             // User input
  elements: [],             // Empty initially
  complexTypes: [],         // Empty initially
  simpleTypes: [],          // Empty initially
  imports: [],              // Empty initially
  createdAt: Date,         // Current timestamp
  updatedAt: Date          // Current timestamp
}
```

### Workflow 2: View Schemas List

**Actor**: User

**Precondition**: User is viewing a project

**Steps**:
1. User navigates to `/project/:projectId`
2. System displays all schemas in the project
3. Each schema card shows:
   - Schema name
   - Element count
   - Complex type count
   - Simple type count
   - Action buttons (Edit, Export, Delete)

**Empty State**:
- If no schemas in project, show empty state message
- Display "Create Your First Schema" button

**Implementation**: [frontend/src/features/project/ProjectPage.tsx#L82-L127](frontend/src/features/project/ProjectPage.tsx)

### Workflow 3: Open Schema Editor

**Actor**: User

**Steps**:
1. User clicks "Edit Schema" button on schema card
2. System navigates to `/schema/:projectId/:schemaId`
3. SchemaEditor page opens with full editing interface

**Implementation**: [frontend/src/features/project/ProjectPage.tsx#L125](frontend/src/features/project/ProjectPage.tsx)

### Workflow 4: Export Schema to XSD

**Actor**: User

**Steps**:
1. User clicks "Export XSD" button (download icon) on schema card
2. System converts schema object to XSD XML string
3. XSD file downloaded as `{schemaName}.xsd`
4. File contains valid XSD schema definition

**XSD Generation**: Uses `generateXSDString()` utility

**Implementation**: 
- UI: [frontend/src/features/project/ProjectPage.tsx#L41-L51](frontend/src/features/project/ProjectPage.tsx)
- Utility: [frontend/src/lib/xsd-utils.ts#L16-L61](frontend/src/lib/xsd-utils.ts)

**Example Output**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified">
  <!-- elements, types, etc. -->
</xs:schema>
```

### Workflow 5: Delete Schema

**Actor**: User

**Steps**:
1. User clicks "Delete" button (trash icon) on schema card
2. **⚠️ No confirmation dialog implemented**
3. Schema immediately removed from project
4. If schema was open (currentSchema), set to null
5. Project updatedAt timestamp updated
6. Changes persisted to localStorage

**Data Loss Risk**: No undo functionality

**Implementation**: [frontend/src/lib/store.ts#L76-L86](frontend/src/lib/store.ts)

## Functional Requirements

### FR2.1: Create Schema
- ✅ User can create schema with name
- ✅ System generates unique UUID
- ✅ System timestamps creation
- ✅ Schema added to parent project
- ✅ Schema persisted to localStorage

### FR2.2: List Schemas
- ✅ Display all schemas in project
- ✅ Show schema statistics (element/type counts)
- ✅ Show empty state when no schemas
- ✅ Responsive grid layout

### FR2.3: Navigate to Editor
- ✅ Click to open schema editor
- ✅ Set current schema in state
- ✅ Pass project and schema context

### FR2.4: Export to XSD
- ✅ Convert schema to XSD XML format
- ✅ Generate valid XSD structure
- ✅ Download as .xsd file
- ✅ Include all elements, types, and imports

### FR2.5: Delete Schema
- ✅ Remove schema from project
- ✅ Update project timestamp
- ✅ Persist changes
- ❌ No confirmation dialog
- ❌ No undo capability

## Acceptance Criteria

### AC2.1: Schema Creation
- ✅ Name field is required (enforced by UI disable state)
- ✅ Schema appears immediately after creation
- ✅ Modal closes after creation
- ✅ Form resets after creation
- ✅ Schema has empty structure (no elements/types)

### AC2.2: Schema Display
- ✅ Schemas displayed in grid layout
- ✅ Each card shows name and statistics
- ✅ Actions accessible on each card
- ✅ Empty state shown when no schemas
- ✅ Statistics accurately reflect schema content

### AC2.3: XSD Export
- ✅ Generated XSD is valid XML
- ✅ Includes XML declaration
- ✅ Includes xs:schema root element
- ✅ Includes all defined elements
- ✅ Includes all complex types
- ✅ Includes all simple types
- ✅ Includes all imports
- ✅ Proper formatting with indentation

### AC2.4: Deletion
- ✅ Schema removed immediately
- ✅ Project updated timestamp
- ❌ No confirmation (UX gap)
- ❌ No recovery possible

## Dependencies

### Internal Dependencies
- **Zustand Store**: State management and persistence
- **XSD Utils**: XSD generation and validation
- **LocalStorage**: Data persistence layer
- **React Router**: Navigation to editor

### External Dependencies
- **fast-xml-parser**: XML building and parsing

## Data Model

**Interface**: [frontend/src/types/xsd.ts](frontend/src/types/xsd.ts)

```typescript
interface XSDSchema {
  id: string                     // UUID v4
  name: string                   // User-defined
  targetNamespace?: string       // Optional XML namespace
  elements: XSDElement[]         // Root elements
  complexTypes: XSDComplexType[] // Type definitions
  simpleTypes: XSDSimpleType[]   // Simple type definitions
  imports: XSDImport[]           // Schema imports
  documentation?: string         // Schema-level docs
  createdAt: Date               // Creation timestamp
  updatedAt: Date               // Last modification timestamp
}
```

**Related Types**:
- `XSDElement`: Schema elements with attributes and children
- `XSDComplexType`: Complex type definitions
- `XSDSimpleType`: Simple type definitions with restrictions
- `XSDImport`: External schema imports

## XSD Generation Details

### Generation Process

**Function**: `generateXSDString(schema: XSDSchema): string`

**Location**: [frontend/src/lib/xsd-utils.ts#L16-L61](frontend/src/lib/xsd-utils.ts)

**Steps**:
1. Create XML declaration: `<?xml version="1.0" encoding="UTF-8"?>`
2. Create xs:schema root element
3. Add XML Schema namespace: `xmlns:xs="http://www.w3.org/2001/XMLSchema"`
4. Add elementFormDefault="qualified"
5. Add targetNamespace if defined
6. Add xs:import elements for imports
7. Add xs:simpleType elements for simple types
8. Add xs:complexType elements for complex types
9. Add xs:element elements for root elements
10. Format with indentation (2 spaces)

**Builder Configuration**:
- Attribute prefix: `@_`
- Format: true (pretty-print)
- Indent: 2 spaces

### Element Generation

**Function**: `buildElement(element: XSDElement)`

**Attributes Generated**:
- `name`: Element name
- `type`: Element type (e.g., xs:string, CustomType)
- `minOccurs`: If specified
- `maxOccurs`: If specified

**Child Elements**:
- `xs:annotation/xs:documentation`: If documentation provided

**Implementation**: [frontend/src/lib/xsd-utils.ts#L63-L78](frontend/src/lib/xsd-utils.ts)

### Complex Type Generation

**Function**: `buildComplexType(complexType: XSDComplexType)`

**Structure**:
- Name attribute
- Optional xs:annotation/xs:documentation
- xs:sequence with child elements (if any)
- xs:attribute elements (if any)

**Implementation**: [frontend/src/lib/xsd-utils.ts#L80-L106](frontend/src/lib/xsd-utils.ts)

### Simple Type Generation

**Function**: `buildSimpleType(simpleType: XSDSimpleType)`

**Structure**:
- Name attribute
- xs:restriction with base attribute
- Restriction facets (minLength, maxLength, pattern, enumeration, etc.)
- Optional xs:annotation/xs:documentation

**Implementation**: [frontend/src/lib/xsd-utils.ts#L108-L134](frontend/src/lib/xsd-utils.ts)

## Implementation Status

### Implemented ✅
- ✅ Schema creation with name
- ✅ Schemas list display
- ✅ Schema cards with statistics
- ✅ Export to XSD file
- ✅ XSD generation with all types
- ✅ Delete schema
- ✅ Navigate to schema editor
- ✅ Automatic persistence
- ✅ Empty state UI
- ✅ Parent-child relationship with projects

### Not Implemented ❌
- ❌ Delete confirmation dialog
- ❌ Schema rename/edit metadata
- ❌ Import XSD file
- ❌ Duplicate schema
- ❌ Schema validation before export
- ❌ Schema templates
- ❌ Schema versioning
- ❌ Schema comparison/diff

## Known Limitations

### Limitation 1: No XSD Import
**Impact**: Cannot import existing XSD files into the application
**Workaround**: Manual recreation of schema structure
**Note**: `parseXSD()` function exists but is incomplete (only extracts targetNamespace)

### Limitation 2: No Delete Confirmation
**Impact**: Users can accidentally delete schemas
**Risk**: High (data loss)
**Workaround**: Use export before deletion

### Limitation 3: No Schema Editing
**Impact**: Cannot rename schema after creation
**Risk**: Low (can be worked around)
**Workaround**: Delete and recreate, or export/edit JSON/re-import

### Limitation 4: No Validation on Export
**Impact**: May export invalid XSD if schema structure is malformed
**Risk**: Medium
**Mitigation**: Generation logic is deterministic

### Limitation 5: Limited XSD Features
**Impact**: Only supports subset of XSD specification
**Supported**: Elements, complex types, simple types, imports, restrictions
**Not Supported**: Groups, attribute groups, substitution groups, redefine, include
**Risk**: Low (covers common use cases)

## Technical Debt

1. **Incomplete XSD Parser**: `parseXSD()` function is placeholder (only extracts namespace)
2. **No XSD Validation**: Generated XSD not validated against XSD schema
3. **No Error Handling**: XSD generation errors not caught or reported to user
4. **Hardcoded Formatting**: Indentation and formatting not configurable
5. **No Schema Metadata**: No tags, categories, or custom properties

## Future Enhancements (Not Implemented)

1. **Import XSD**: Parse existing XSD files into schema objects
2. **Schema Validation**: Validate schema structure before export
3. **Schema Templates**: Pre-defined schema patterns
4. **Schema Duplication**: Clone existing schemas
5. **Schema Versioning**: Track schema changes over time
6. **Schema Comparison**: Diff two schemas
7. **Schema Metadata**: Tags, categories, custom properties
8. **Batch Export**: Export multiple schemas at once
9. **Advanced XSD Features**: Support for groups, attribute groups, etc.
10. **Schema Documentation**: Rich text documentation editor

## Testing Coverage

**Unit Tests**: ✅ Partial
- File: [frontend/src/test/xsd-utils.test.ts](frontend/src/test/xsd-utils.test.ts)
- Tests XSD generation utilities

**E2E Tests**: Unknown (may be covered in basic.spec.ts)

**Recommended Tests**:
- Create schema and verify structure
- Export XSD and validate format
- Delete schema and verify removal
- Schema statistics accuracy
- XSD generation with all type combinations

## UI/UX Notes

### Design Patterns
- Modal dialog for creation
- Card-based grid layout
- Icon buttons for actions
- Empty state with call-to-action
- Statistics badges
- Responsive design

### Accessibility
- ✅ Semantic HTML
- ❌ No ARIA labels on icon buttons
- ❌ No keyboard navigation focus management

### Dark Mode
- ✅ Fully supported with Tailwind dark: classes

## Related Features
- [Project Management](project-management.md) - Parent feature
- [Schema Editor](schema-editor.md) - Detailed editing
- [XSD Generation](xsd-generation.md) - Core utility
- [XML Validation](xml-validation.md) - Related functionality
