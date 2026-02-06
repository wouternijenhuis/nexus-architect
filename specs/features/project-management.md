# Feature: Project Management

## Feature Overview

**Feature ID**: F001  
**Feature Name**: Project Management  
**Priority**: High (Core Feature)  
**Status**: ✅ Fully Implemented

### Purpose
Enable users to organize their XSD schemas into logical projects. Projects serve as containers for related schemas, providing organization and management capabilities.

### Business Value
- Organize schemas by application, client, or domain
- Export/import projects for backup and portability
- Navigate between related schemas efficiently
- Maintain context for schema development

## User Workflows

### Workflow 1: Create New Project

**Actor**: User

**Steps**:
1. User navigates to Home Page (`/`)
2. User clicks "New Project" button
3. Modal dialog appears
4. User enters project name (required)
5. User enters project description (optional)
6. User clicks "Create" button
7. Project created with UUID
8. Project appears in projects list
9. Project data persisted to localStorage

**Implementation**: [frontend/src/features/home/HomePage.tsx#L17-L20](frontend/src/features/home/HomePage.tsx)

**Data Stored**:
```typescript
{
  id: UUID,                    // Generated
  name: string,                // User input
  description?: string,        // User input
  schemas: [],                 // Initially empty
  createdAt: Date,            // Current timestamp
  updatedAt: Date             // Current timestamp
}
```

### Workflow 2: View Projects List

**Actor**: User

**Steps**:
1. User navigates to Home Page (`/`)
2. System displays all projects from localStorage
3. Each project card shows:
   - Project name
   - Description (if set)
   - Number of schemas
   - Created date
   - Action buttons (Open, Export, Delete)

**Empty State**:
- If no projects exist, show empty state message
- Display "Create Your First Project" button

**Implementation**: [frontend/src/features/home/HomePage.tsx#L70-L140](frontend/src/features/home/HomePage.tsx)

### Workflow 3: Open Project

**Actor**: User

**Steps**:
1. User clicks "Open" button on project card
2. System navigates to `/project/:projectId`
3. ProjectPage displays project details and schemas list

**Implementation**: Navigation in [HomePage.tsx](frontend/src/features/home/HomePage.tsx)

### Workflow 4: Export Project

**Actor**: User

**Steps**:
1. User clicks "Export" button (download icon) on project card
2. System serializes project to JSON (including all schemas)
3. JSON file downloaded as `project-{uuid}.json`
4. File contains complete project with all schemas

**Export Format**: Complete JSON serialization of project object

**Implementation**: [frontend/src/features/home/HomePage.tsx#L22-L30](frontend/src/features/home/HomePage.tsx)

**Example Export**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "My Project",
  "description": "Customer management schemas",
  "schemas": [...],
  "createdAt": "2026-02-04T...",
  "updatedAt": "2026-02-04T..."
}
```

### Workflow 5: Import Project

**Actor**: User

**Steps**:
1. User clicks "Import" button on Home Page
2. File picker dialog opens
3. User selects `.json` file
4. System reads and parses JSON
5. System generates new UUID (prevents ID conflicts)
6. Project added to projects list
7. Project persisted to localStorage

**Error Handling**:
- Invalid JSON: Logged to console, no user feedback
- Missing fields: No validation, may cause errors

**Implementation**: [frontend/src/features/home/HomePage.tsx#L32-L46](frontend/src/features/home/HomePage.tsx)

### Workflow 6: Delete Project

**Actor**: User

**Steps**:
1. User clicks "Delete" button (trash icon) on project card
2. **⚠️ No confirmation dialog implemented**
3. Project immediately removed from state
4. Project removed from localStorage
5. If project was open, currentProject set to null

**Data Loss Risk**: No undo functionality

**Implementation**: [frontend/src/lib/store.ts#L43-L48](frontend/src/lib/store.ts)

## Functional Requirements

### FR1.1: Create Project
- ✅ User can create project with name
- ✅ User can add optional description
- ✅ System generates unique UUID
- ✅ System timestamps creation
- ✅ Project persisted to localStorage

### FR1.2: List Projects
- ✅ Display all projects
- ✅ Show project metadata (name, description, schema count)
- ✅ Show empty state when no projects
- ✅ Responsive grid layout (1-3 columns)

### FR1.3: Navigate to Project
- ✅ Click to open project detail view
- ✅ Set current project in state

### FR1.4: Export Project
- ✅ Serialize project to JSON
- ✅ Download as file
- ✅ Include all schemas
- ✅ Preserve all metadata

### FR1.5: Import Project
- ✅ Read JSON file
- ✅ Parse project data
- ✅ Generate new ID to avoid conflicts
- ✅ Add to projects list
- ❌ No validation of imported data
- ❌ No error feedback to user

### FR1.6: Delete Project
- ✅ Remove project from state
- ✅ Remove from localStorage
- ❌ No confirmation dialog
- ❌ No undo capability

## Acceptance Criteria

### AC1.1: Project Creation
- ✅ Name field is required (enforced by UI disable state)
- ✅ Description is optional
- ✅ Project appears immediately after creation
- ✅ Modal closes after creation
- ✅ Form resets after creation

### AC1.2: Project Display
- ✅ Projects displayed in grid layout
- ✅ Each card shows name, description, schema count
- ✅ Actions accessible on each card
- ✅ Empty state shown when no projects

### AC1.3: Export/Import
- ✅ Export creates valid JSON
- ✅ Imported projects get new IDs
- ✅ All schema data preserved
- ❌ No validation feedback

### AC1.4: Deletion
- ✅ Project removed immediately
- ❌ No confirmation (UX gap)
- ❌ No recovery possible

## Dependencies

### Internal Dependencies
- **Zustand Store**: State management and persistence
- **LocalStorage**: Data persistence layer
- **React Router**: Navigation to project pages

### External Dependencies
- None (fully client-side)

## Data Model

**Store Location**: [frontend/src/lib/store.ts](frontend/src/lib/store.ts)

**Interface**: [frontend/src/types/xsd.ts](frontend/src/types/xsd.ts)

```typescript
interface XSDProject {
  id: string              // UUID v4
  name: string            // User-defined
  description?: string    // Optional
  schemas: XSDSchema[]    // Array of schemas
  createdAt: Date        // Creation timestamp
  updatedAt: Date        // Last modification timestamp
}
```

**Storage**:
- Location: `localStorage['nexus-architect-storage']`
- Format: JSON string (Zustand persist)
- Max size: ~5-10MB (browser dependent)

## Implementation Status

### Implemented ✅
- ✅ Project creation with name and description
- ✅ Projects list display
- ✅ Project cards with metadata
- ✅ Export to JSON file
- ✅ Import from JSON file
- ✅ Delete project
- ✅ Navigate to project detail
- ✅ Automatic persistence
- ✅ Empty state UI

### Not Implemented ❌
- ❌ Delete confirmation dialog
- ❌ Project rename/edit
- ❌ Import validation
- ❌ Import error handling UI
- ❌ Undo/redo operations
- ❌ Project search/filter
- ❌ Project sorting options
- ❌ Duplicate project
- ❌ Project templates
- ❌ Cloud backup/sync

## Known Limitations

### Limitation 1: No Delete Confirmation
**Impact**: Users can accidentally delete projects
**Risk**: High (data loss)
**Workaround**: Use export before deletion

### Limitation 2: No Import Validation
**Impact**: Invalid imports may crash application
**Risk**: Medium
**Workaround**: Only import properly exported files

### Limitation 3: No Undo
**Impact**: Deleted projects cannot be recovered
**Risk**: High
**Workaround**: Regular exports as backups

### Limitation 4: Storage Limits
**Impact**: Browser localStorage limited to ~5-10MB
**Risk**: Medium (for large projects)
**Workaround**: Export and clear old projects

### Limitation 5: No Project Editing
**Impact**: Cannot rename project after creation
**Risk**: Low (can export, edit JSON, re-import)
**Workaround**: Manual JSON editing

## Technical Debt

1. **No input validation**: Project name not validated for length or special characters
2. **No storage quota monitoring**: No warning when approaching localStorage limits
3. **No error boundaries**: Import errors may crash entire app
4. **No loading states**: Synchronous operations may feel unresponsive for large projects
5. **Hardcoded strings**: UI text not internationalized

## Future Enhancements (Not Implemented)

1. **Project Settings**: Edit name, description after creation
2. **Project Tags**: Categorize projects with tags
3. **Project Search**: Filter projects by name/description
4. **Project Sorting**: Sort by name, date, schema count
5. **Project Archive**: Soft delete instead of permanent deletion
6. **Project Duplication**: Clone project with all schemas
7. **Project Templates**: Pre-defined project structures
8. **Cloud Sync**: Optional backend storage
9. **Version Control**: Track project history
10. **Collaboration**: Share projects with team members

## Testing Coverage

**Unit Tests**: ❌ Not found for project management features

**E2E Tests**: Partial (basic.spec.ts may cover project creation)

**Recommended Tests**:
- Create project with valid/invalid inputs
- Export and re-import project (data integrity)
- Delete project and verify removal
- LocalStorage persistence
- Import malformed JSON (error handling)

## UI/UX Notes

### Design Patterns
- Modal dialog for creation
- Card-based grid layout
- Icon buttons for actions
- Empty state with call-to-action
- Responsive design (1-3 columns)

### Accessibility
- ✅ Semantic HTML
- ❌ No ARIA labels on icon buttons
- ❌ No keyboard navigation focus management
- ❌ No screen reader announcements for state changes

### Dark Mode
- ✅ Fully supported with Tailwind dark: classes

## Related Features
- [Schema Management](schema-management.md) - Child feature
- [Schema Editor](schema-editor.md) - Downstream feature
