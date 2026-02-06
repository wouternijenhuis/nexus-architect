# Feature: Real-Time Collaboration

## Feature Overview

**Feature ID**: F003  
**Feature Name**: Real-Time Collaboration  
**Priority**: Medium  
**Status**: ⚠️ Partially Implemented

### Purpose
Enable multiple users to work on the same XSD schema simultaneously, seeing each other's presence and changes in real-time through WebSocket communication.

### Business Value
- Improve team productivity with simultaneous editing
- Reduce merge conflicts through live updates
- Enhance awareness of teammate activity
- Enable pair programming on schema design

## Implementation Status: ⚠️ PARTIAL

**What's Implemented**:
- ✅ WebSocket connection establishment
- ✅ Room-based schema isolation
- ✅ Join/leave schema events
- ✅ Schema update broadcasting
- ✅ User presence notifications (join/left)
- ✅ Collaboration update event infrastructure

**What's NOT Implemented**:
- ❌ UI integration for real-time updates
- ❌ Conflict resolution
- ❌ User cursors/selections display
- ❌ User list UI
- ❌ Automatic schema merging
- ❌ Collision detection
- ❌ Optimistic UI updates

## User Workflows

### Workflow 1: Join Collaboration Session

**Actor**: User A

**Precondition**: User A opens schema editor

**Steps**:
1. User navigates to `/schema/:projectId/:schemaId`
2. SchemaEditor component mounts
3. ❌ Frontend **does NOT** emit `join-schema` event (not implemented in SchemaEditor)
4. ⚠️ App.tsx connects WebSocket on mount, but doesn't join rooms

**Expected Behavior** (Not Implemented):
1. Frontend should call `joinSchemaRoom(schemaId)` on mount
2. Backend adds user to room `schema:${schemaId}`
3. Backend broadcasts `user-joined` event to other users in room
4. Other users see "User joined" notification

**Current Reality**: WebSocket connected but rooms not used for schemas

**Implementation Gap**: 
- WebSocket client: [frontend/src/lib/websocket.ts](frontend/src/lib/websocket.ts) has functions
- SchemaEditor: [frontend/src/features/schema/SchemaEditor.tsx](frontend/src/features/schema/SchemaEditor.tsx) **doesn't call them**

### Workflow 2: Receive Real-Time Updates

**Actor**: User B (receiving updates from User A)

**Expected Flow**:
1. User A makes schema changes
2. User A's client emits `update-schema` event
3. Backend broadcasts to all room members except User A
4. User B's client receives `schema-updated` event
5. User B's UI automatically updates with new schema

**Current Implementation**:
- ✅ Event handler exists: [frontend/src/lib/websocket.ts#L25-L28](frontend/src/lib/websocket.ts)
- ❌ Handler only logs to console
- ❌ **Does NOT update Zustand store**
- ❌ **Does NOT update UI**

**Code**:
```typescript
socket.on('schema-updated', (data: { schemaId: string; schema: XSDSchema }) => {
  console.log('Schema updated from server:', data)
  // ❌ TODO: Update local state - NOT IMPLEMENTED
})
```

### Workflow 3: Broadcast Schema Changes

**Actor**: User A (making changes)

**Expected Flow**:
1. User edits schema in SchemaEditor
2. Schema saved to Zustand store (✅ works)
3. Frontend emits `update-schema` event to broadcast
4. Backend broadcasts to collaborators

**Current Implementation**:
- ❌ SchemaEditor **never calls** `emitSchemaUpdate()`
- ✅ Function exists: [frontend/src/lib/websocket.ts#L51-L55](frontend/src/lib/websocket.ts)
- ❌ No integration with schema edit operations

### Workflow 4: Leave Collaboration Session

**Actor**: User A

**Expected Flow**:
1. User closes SchemaEditor (navigates away)
2. Frontend emits `leave-schema` event
3. Backend removes user from room
4. Backend broadcasts `user-left` event
5. Other users notified

**Current Implementation**:
- ❌ SchemaEditor doesn't call `leaveSchemaRoom()` on unmount
- ✅ Function exists: [frontend/src/lib/websocket.ts#L57-L61](frontend/src/lib/websocket.ts)
- ⚠️ WebSocket disconnected on App unmount (entire app close)

## Functional Requirements

### FR3.1: Connection Management
- ✅ Establish WebSocket connection on app start
- ✅ Auto-reconnect on disconnect
- ❌ Rejoin rooms after reconnection
- ✅ Disconnect on app close

**Status**: Partial (no room rejoining)

### FR3.2: Room Management
- ✅ Backend: Room creation and tracking
- ✅ Backend: User join/leave events
- ✅ Backend: Room cleanup on disconnect
- ❌ Frontend: Join room on schema open
- ❌ Frontend: Leave room on schema close

**Status**: Backend complete, frontend not integrated

### FR3.3: Schema Broadcasting
- ✅ Backend: Broadcast infrastructure
- ✅ Backend: Room-based message routing
- ❌ Frontend: Emit updates on schema changes
- ❌ Frontend: Receive and apply updates

**Status**: Backend complete, frontend not integrated

### FR3.4: User Presence
- ✅ Backend: Track active users per room
- ✅ Backend: Broadcast join/leave events
- ❌ Frontend: Display active users
- ❌ Frontend: Show user avatars/names

**Status**: Backend complete, UI not implemented

### FR3.5: Conflict Resolution
- ❌ Detect simultaneous edits
- ❌ Operational Transform or CRDT
- ❌ Last-write-wins strategy
- ❌ User notification of conflicts

**Status**: Not implemented

### FR3.6: Cursor/Selection Sharing
- ✅ Backend: Collaboration update events
- ❌ Frontend: Emit cursor position
- ❌ Frontend: Display other users' cursors
- ❌ Frontend: Display other users' selections

**Status**: Infrastructure exists, not used

## Acceptance Criteria

### AC3.1: Connection
- ✅ WebSocket connects on app start
- ✅ Connection status logged to console
- ❌ Connection status shown in UI
- ✅ Auto-reconnect on network failure

### AC3.2: Room Isolation
- ✅ Users in different schemas don't receive each other's updates
- ✅ Room-based message routing works
- ❌ Frontend actually uses rooms (not integrated)

### AC3.3: Real-Time Updates
- ❌ Changes visible to all users within 1 second
- ❌ UI updates without page refresh
- ❌ No data loss during concurrent edits

**Status**: None of these work (frontend not integrated)

### AC3.4: User Awareness
- ❌ See list of active users on schema
- ❌ See when users join/leave
- ❌ See other users' cursors/selections

**Status**: None implemented

## Dependencies

### Internal Dependencies
- **Socket.IO Client**: WebSocket communication
- **Zustand Store**: State management (needs integration)
- **SchemaEditor**: UI component (needs integration)

### External Dependencies
- **Socket.IO Server**: Backend WebSocket handling

### Backend Dependencies
- **Express Server**: HTTP server for Socket.IO
- **In-Memory State**: Room tracking (schemaRooms Map)

## Technical Architecture

### Backend Implementation

**File**: [backend/src/index.ts#L53-L138](backend/src/index.ts)

**Room Structure**:
```typescript
schemaRooms: Map<schemaId, Set<socketId>>
```

**Events Handled**:
- `join-schema`: Add user to room
- `leave-schema`: Remove user from room
- `update-schema`: Broadcast schema changes
- `collaboration-update`: Broadcast cursor/selection
- `disconnect`: Clean up user from all rooms

**Broadcasting Strategy**: 
- Exclude sender from broadcasts (`socket.to(room)`)
- All users in room receive updates except originator

### Frontend Implementation

**WebSocket Client**: [frontend/src/lib/websocket.ts](frontend/src/lib/websocket.ts)

**Functions Available**:
```typescript
connectWebSocket()            // ✅ Called in App.tsx
disconnectWebSocket()         // ✅ Called in App.tsx
joinSchemaRoom(schemaId)      // ❌ Never called
leaveSchemaRoom(schemaId)     // ❌ Never called
emitSchemaUpdate(schemaId, schema)  // ❌ Never called
getSocket()                   // ✅ Available
```

**Event Handlers**:
```typescript
socket.on('connect')           // ✅ Logs to console
socket.on('disconnect')        // ✅ Logs to console
socket.on('schema-updated')    // ❌ Logs only, no UI update
socket.on('collaboration-update')  // ❌ Logs only, no action
```

**Connection Code**: [frontend/src/App.tsx#L11-L17](frontend/src/App.tsx)
```typescript
useEffect(() => {
  connectWebSocket()  // ✅ Connects on mount
  return () => {
    disconnectWebSocket()  // ✅ Disconnects on unmount
  }
}, [])
```

## Known Issues

### Issue 1: No Schema Room Integration
**Severity**: High  
**Impact**: Collaboration feature completely non-functional  
**Cause**: SchemaEditor doesn't call `joinSchemaRoom()` or `leaveSchemaRoom()`  
**Fix Required**: Add useEffect in SchemaEditor to join/leave rooms

### Issue 2: Updates Not Applied
**Severity**: High  
**Impact**: Users don't see each other's changes  
**Cause**: `schema-updated` handler doesn't update store or UI  
**Fix Required**: Call `updateSchema()` from Zustand store in event handler

### Issue 3: No Broadcast on Edit
**Severity**: High  
**Impact**: User changes not sent to collaborators  
**Cause**: SchemaEditor doesn't call `emitSchemaUpdate()`  
**Fix Required**: Call emit function after schema updates

### Issue 4: No Conflict Resolution
**Severity**: High  
**Impact**: Last write wins, potential data loss  
**Cause**: No merge strategy  
**Fix Required**: Implement OT, CRDT, or at least show conflict warnings

### Issue 5: No User Presence UI
**Severity**: Medium  
**Impact**: Users unaware of collaborators  
**Cause**: No UI component for user list  
**Fix Required**: Create component to show active users

### Issue 6: No Room Rejoin After Reconnect
**Severity**: Medium  
**Impact**: After network interruption, user doesn't rejoin schema room  
**Cause**: Socket.IO reconnects connection but doesn't rejoin rooms  
**Fix Required**: Store active schema ID and rejoin on reconnect

## Why Is This Partially Implemented?

### Infrastructure Complete ✅
- WebSocket connection works
- Backend room management works
- Event routing works
- Broadcast mechanism works

### UI Integration Missing ❌
- SchemaEditor not connected to WebSocket
- No calls to join/leave functions
- No calls to emit updates
- Event handlers don't update UI
- No visual feedback for collaboration

### Likely Scenario
- Backend collaboration was implemented first
- Frontend WebSocket client created with all functions
- UI integration planned but not completed
- Event handlers stubbed (console.log only)
- Feature works technically but not connected to UI

## Required Integration Work

### Step 1: Join/Leave Rooms
Add to SchemaEditor.tsx:
```typescript
useEffect(() => {
  if (schema) {
    joinSchemaRoom(schema.id)
  }
  return () => {
    if (schema) {
      leaveSchemaRoom(schema.id)
    }
  }
}, [schema?.id])
```

### Step 2: Broadcast Updates
After updating schema:
```typescript
const handleUpdateSchema = (updatedSchema) => {
  updateSchema(projectId!, updatedSchema)
  emitSchemaUpdate(schema.id, updatedSchema)  // Add this
}
```

### Step 3: Apply Received Updates
In websocket.ts:
```typescript
socket.on('schema-updated', (data) => {
  // Need access to store - requires refactoring
  useStore.getState().updateSchema(projectId, data.schema)
})
```

### Step 4: Show User Presence
Create new component:
```typescript
<ActiveUsers 
  schemaId={schema.id} 
  onUserJoin={(userId) => {...}}
  onUserLeave={(userId) => {...}}
/>
```

## Testing Coverage

**Backend Tests**: ❌ Not found  
**Frontend Tests**: ❌ Not found for collaboration  
**E2E Tests**: ❌ Not found

**Recommended Tests**:
- Multiple clients join same schema room
- Schema update broadcast to all clients
- User disconnect cleanup
- Room isolation (updates don't leak between schemas)
- Reconnection and room rejoin

## Security Considerations

### No Authentication
- ⚠️ Anyone can join any schema room
- ⚠️ No permission checks
- ⚠️ No user identification

### No Rate Limiting
- ⚠️ Can spam schema updates
- ⚠️ Can flood WebSocket events
- ⚠️ Potential DoS vector

### No Data Validation
- ⚠️ Schema data not validated on broadcast
- ⚠️ Malicious schema could crash other clients

## Future Enhancements (Not Implemented)

1. **Operational Transform**: Proper conflict resolution
2. **CRDT**: Conflict-free replicated data types
3. **User Authentication**: Identify collaborators
4. **Permissions**: Owner, editor, viewer roles
5. **Cursor Sharing**: See where others are editing
6. **Selection Sharing**: See what others have selected
7. **Chat**: In-schema communication
8. **Version History**: Revert to previous states
9. **Change Tracking**: See who changed what
10. **Locking**: Prevent simultaneous edits to same element

## Related Features
- [Schema Management](schema-management.md) - Parent feature
- [Schema Editor](schema-editor.md) - Needs integration
- WebSocket API - Backend implementation
