# Task 005: Add Delete Confirmation Dialogs

**Task ID**: TASK-005  
**Order**: 005  
**Phase**: Foundation - User Experience  
**Priority**: MEDIUM  
**Estimated Effort**: 4 hours
**Status**: ✅ COMPLETE

## Description

Add confirmation dialogs for all destructive operations (delete project, delete schema) to prevent accidental data loss. Currently users can delete projects and schemas with a single click, risking unintentional loss of work.

## Dependencies

- None

## Technical Requirements

### Scope

Implement confirmation dialogs for:

1. **Delete Project**: Prompt before deleting project and all its schemas
2. **Delete Schema**: Prompt before deleting individual schema

### Dialog Requirements

**Confirmation Dialog Component**:

- Modal overlay (dims background)
- Clear warning message
- Shows what will be deleted (project name or schema name)
- Two buttons: "Cancel" (default focus) and "Delete" (destructive style)
- Keyboard navigation (ESC to cancel, Enter to confirm)
- Accessible (ARIA labels, focus trap)

**Message Content**:

```
Delete Project?

Are you sure you want to delete "{projectName}"?
This will permanently delete the project and all {schemaCount} schema(s) within it.

This action cannot be undone.

[Cancel]  [Delete]
```

```
Delete Schema?

Are you sure you want to delete "{schemaName}"?

This action cannot be undone.

[Cancel]  [Delete]
```

### Implementation Approach

**Reusable Component**:

```
frontend/src/components/ConfirmDialog.tsx
```

**Props**:

```typescript
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;  // default: "Delete"
  cancelLabel?: string;   // default: "Cancel"
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';  // default: 'danger'
}
```

**Usage**:

```typescript
// In ProjectPage component
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

<ConfirmDialog
  open={deleteDialogOpen}
  title="Delete Project?"
  message={`Are you sure you want to delete "${project.name}"? This will permanently delete the project and all ${project.schemas.length} schema(s).`}
  onConfirm={handleDeleteConfirmed}
  onCancel={() => setDeleteDialogOpen(false)}
/>
```

### Styling

- Use Tailwind CSS for modal styling
- Danger button: red background (`bg-red-600 hover:bg-red-700`)
- Cancel button: neutral (`bg-gray-200 hover:bg-gray-300`)
- Modal backdrop: semi-transparent black (`bg-black bg-opacity-50`)
- Focus visible indicator for accessibility

## Acceptance Criteria

- ✅ ConfirmDialog component created in `frontend/src/components/ConfirmDialog.tsx`
- ✅ Delete project triggers confirmation dialog
- ✅ Delete schema triggers confirmation dialog
- ✅ Dialog shows entity name (project/schema name)
- ✅ Dialog shows impact (e.g., "will delete X schemas")
- ✅ Cancel button closes dialog without deleting
- ✅ Delete button proceeds with deletion
- ✅ ESC key closes dialog (cancel)
- ✅ Modal backdrop click closes dialog (cancel)
- ✅ Focus trapped in dialog when open
- ✅ Focus returns to trigger element when closed
- ✅ Accessible (screen reader compatible, keyboard navigable)

## Testing Requirements

### Unit Tests (≥85% coverage)

**Test File**: `frontend/src/components/ConfirmDialog.test.tsx`

```typescript
describe('ConfirmDialog', () => {
  it('should render when open', () => {})
  it('should not render when closed', () => {})
  it('should display title and message', () => {})
  it('should call onConfirm when Delete clicked', () => {})
  it('should call onCancel when Cancel clicked', () => {})
  it('should call onCancel when ESC pressed', () => {})
  it('should call onCancel when backdrop clicked', () => {})
  it('should trap focus within dialog', () => {})
  it('should focus Cancel button by default', () => {})
  it('should restore focus on close', () => {})
})
```

### Integration Tests

**Test File**: `frontend/src/features/project/ProjectPage.test.tsx`

```typescript
describe('Project Delete Confirmation', () => {
  it('should show confirmation before deleting project', () => {
    // Render ProjectPage with projects
    // Click delete on a project
    // Verify confirmation dialog appears
    // Click Cancel
    // Verify project still exists
  })

  it('should delete project after confirmation', () => {
    // Render ProjectPage with projects
    // Click delete on a project
    // Verify confirmation dialog appears
    // Click Delete
    // Verify project removed from list
    // Verify API called
  })
})
```

**Test File**: `frontend/src/features/schema/SchemaEditor.test.tsx`

```typescript
describe('Schema Delete Confirmation', () => {
  it('should show confirmation before deleting schema', () => {})
  it('should delete schema after confirmation', () => {})
})
```

### E2E Tests

**Test File**: `tests/e2e/tests/delete-confirmation.spec.ts`

```typescript
test('should confirm before deleting project', async ({ page }) => {
  // Create a project with schemas
  // Navigate to projects page
  // Click delete button
  // Verify confirmation dialog appears
  // Verify dialog shows project name and schema count
  // Click Cancel
  // Verify project still exists
  // Click delete again
  // Click Delete in dialog
  // Verify project removed
});

test('should handle ESC key to cancel delete', async ({ page }) => {
  // Click delete
  // Press ESC
  // Verify dialog closes
  // Verify project not deleted
});
```

### Accessibility Tests

- Test with screen reader (VoiceOver/NVDA)
- Test keyboard navigation (Tab, Shift+Tab, ESC, Enter)
- Test focus trap (Tab cycles through dialog elements only)
- Verify ARIA labels present and correct
- Test color contrast (WCAG AA compliant)

## Related Documentation

- [specs/modernize/assessment/technical-debt.md](../modernize/assessment/technical-debt.md) - Section 4.3: Missing Delete Confirmation
- [specs/modernize/strategy/roadmap.md](../modernize/strategy/roadmap.md) - Phase 1, Week 1
- [specs/features/project-management.md](../features/project-management.md) - F001: Project Management

---

**Next Tasks**: 006 (Complete Real-Time Collaboration UI)
