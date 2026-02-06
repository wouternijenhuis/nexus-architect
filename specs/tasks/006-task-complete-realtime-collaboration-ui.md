# Task 006: Complete Real-Time Collaboration Frontend UI

**Task ID**: TASK-006  
**Order**: 006  
**Phase**: Foundation - Feature Completion  
**Priority**: HIGH  
**Estimated Effort**: 3-5 days
**Status**: ✅ COMPLETE

## Description

Complete the real-time collaboration feature by implementing frontend UI integration. Backend WebSocket infrastructure is fully implemented, but frontend never connects or handles collaboration events. This task bridges the gap to make F003 feature functional.

## Dependencies

- None (backend already complete)

## Technical Requirements

### Current State

**Backend (COMPLETE)**:

- WebSocket server running on port 3001
- Room management (join, leave)
- Schema update broadcasting
- Active user tracking
- User presence events

**Frontend (MISSING)**:

- No WebSocket connection initialization
- SchemaEditor never calls `joinSchemaRoom()`
- No event handlers for collaboration events
- No UI for active users display
- No presence indicators
- No conflict resolution

### Implementation Scope

**WebSocket Client Integration**:

1. Connect to WebSocket server on component mount
2. Join schema room when SchemaEditor opens
3. Leave room when SchemaEditor unmounts or navigates away
4. Handle connection lifecycle (connect, disconnect, reconnect)

**Event Handlers**:

- `user-joined`: Update active users list, show notification
- `user-left`: Update active users list, show notification
- `schema-updated`: Receive remote changes, apply to local state
- `disconnect`: Handle connection loss, show offline indicator
- `reconnect`: Rejoin room, sync state

**UI Components**:

1. **Active Users List**:
   - Avatar/icon for each connected user
   - User count badge
   - Expand to show user names
   - Color-coded presence indicators

2. **Presence Indicators**:
   - Cursor positions (optional for v1)
   - User currently editing indicator
   - Last activity timestamp

3. **Notifications**:
   - Toast/snackbar for join/leave events
   - Alert for connection issues
   - Conflict detection warnings

4. **Conflict Resolution**:
   - Detect when remote and local edits conflict
   - Show conflict warning
   - Provide options: Keep Local, Use Remote, Merge (manual)

**State Management**:

```typescript
// Add to Zustand store
interface CollaborationState {
  activeUsers: Array<{ id: string; name: string; color: string }>;
  isConnected: boolean;
  currentRoom: string | null;
  lastSync: Date | null;
}
```

### WebSocket Integration

**Connection Setup** (`frontend/src/lib/websocket.ts`):

```typescript
// Initialize on app load
wsService.connect();

// In SchemaEditor component
useEffect(() => {
  if (schemaId) {
    wsService.joinSchemaRoom(schemaId, userId, userName);
    
    // Subscribe to events
    wsService.on('user-joined', handleUserJoined);
    wsService.on('user-left', handleUserLeft);
    wsService.on('schema-updated', handleSchemaUpdated);
    
    return () => {
      wsService.leaveSchemaRoom(schemaId, userId);
      wsService.off('user-joined', handleUserJoined);
      // ... cleanup other listeners
    };
  }
}, [schemaId]);
```

**Update Broadcasting**:

```typescript
// When user edits schema
const handleSchemaChange = (updatedSchema: Schema) => {
  // Update local state immediately
  setSchema(updatedSchema);
  
  // Broadcast to other users
  wsService.broadcastSchemaUpdate(schemaId, updatedSchema, userId);
  
  // Save to localStorage (debounced)
  debouncedSave(updatedSchema);
};
```

### Conflict Resolution Strategy

**Last-Write-Wins (Simple)**:

- Accept remote changes if they arrive
- Show notification: "Schema updated by [UserName]"
- User can undo if needed

**Optional Enhancement (Future)**:

- Operational Transform (OT) for concurrent edits
- Merge non-conflicting changes automatically
- Show diff view for conflicts

## Acceptance Criteria

- ✅ WebSocket client connects on application load
- ✅ SchemaEditor joins room when opening schema
- ✅ SchemaEditor leaves room when navigating away or unmounting
- ✅ Active users list displays all connected users
- ✅ User join/leave events show notifications
- ✅ Remote schema updates received and applied to UI
- ✅ Local schema updates broadcast to other users
- ✅ Connection status indicator (online/offline)
- ✅ Reconnection handling (rejoin room on reconnect)
- ✅ Graceful degradation (works offline, no errors)
- ✅ Conflict detection when remote and local edits overlap
- ✅ Tests pass with ≥85% coverage

## Testing Requirements

### Unit Tests

**Test File**: `frontend/src/lib/websocket.test.ts`

```typescript
describe('WebSocket Service', () => {
  it('should connect to WebSocket server', () => {})
  it('should join schema room', () => {})
  it('should leave schema room', () => {})
  it('should emit schema updates', () => {})
  it('should handle disconnect', () => {})
  it('should reconnect and rejoin room', () => {})
  it('should remove all listeners on cleanup', () => {})
})
```

**Test File**: `frontend/src/features/schema/SchemaEditor.collaboration.test.tsx`

```typescript
describe('SchemaEditor Collaboration', () => {
  it('should join room on mount', () => {})
  it('should leave room on unmount', () => {})
  it('should display active users', () => {})
  it('should update UI when user joins', () => {})
  it('should update UI when user leaves', () => {})
  it('should apply remote schema updates', () => {})
  it('should broadcast local updates', () => {})
  it('should handle connection loss gracefully', () => {})
})
```

### Integration Tests

**Test File**: `frontend/src/test/collaboration.integration.test.tsx`

```typescript
describe('Collaboration Integration', () => {
  it('should sync changes between two clients', async () => {
    // Simulate two browser tabs/windows
    // Client A edits schema
    // Verify Client B receives update
  })

  it('should handle multiple users in same room', async () => {
    // Simulate 3 users in same schema
    // Verify all receive each other's updates
  })

  it('should clean up on room leave', async () => {
    // Join room
    // Leave room
    // Verify no more events received
  })
})
```

### E2E Tests

**Test File**: `tests/e2e/tests/collaboration.spec.ts`

```typescript
test('should show active users in real-time', async ({ browser }) => {
  // Open schema in tab 1
  const page1 = await browser.newPage();
  await page1.goto('/schema/123');
  
  // Open same schema in tab 2
  const page2 = await browser.newPage();
  await page2.goto('/schema/123');
  
  // Verify tab 1 shows "2 users online"
  await expect(page1.locator('[data-testid="active-users"]')).toContainText('2');
  
  // Verify tab 2 shows "2 users online"
  await expect(page2.locator('[data-testid="active-users"]')).toContainText('2');
  
  // Close tab 2
  await page2.close();
  
  // Verify tab 1 shows "1 user online"
  await expect(page1.locator('[data-testid="active-users"]')).toContainText('1');
});

test('should sync schema changes in real-time', async ({ browser }) => {
  // Open schema in two tabs
  // Edit in tab 1
  // Verify change appears in tab 2
});

test('should handle offline/online transitions', async ({ page }) => {
  // Open schema
  // Go offline
  // Verify offline indicator
  // Go online
  // Verify reconnection
  // Verify room rejoined
});
```

### Manual Testing

1. Open schema in two browser windows side-by-side
2. Edit schema in window 1, verify changes appear in window 2
3. Close window 2, verify window 1 shows updated user count
4. Simulate connection loss (disconnect network), verify UI updates
5. Restore connection, verify automatic reconnection
6. Test with 3+ simultaneous users

## Related Documentation

- [specs/features/real-time-collaboration.md](../features/real-time-collaboration.md) - F003: Real-Time Collaboration Feature
- [specs/modernize/MODERNIZATION_SUMMARY.md](../modernize/MODERNIZATION_SUMMARY.md) - Critical Finding #1: Half-Built Collaboration Feature
- [specs/modernize/assessment/technical-debt.md](../modernize/assessment/technical-debt.md) - Section 4.1: Incomplete Real-Time Collaboration
- [specs/modernize/strategy/roadmap.md](../modernize/strategy/roadmap.md) - Phase 1, Weeks 2-3
- [backend/src/index.ts](../../backend/src/index.ts) - Lines 60-120: WebSocket server implementation

---

**Next Tasks**: 007 (Implement XSD Import Parser)
