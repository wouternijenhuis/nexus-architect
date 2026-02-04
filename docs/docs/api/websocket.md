# WebSocket API

Nexus Architect uses Socket.IO for real-time collaboration and updates.

## Connection

Connect to the WebSocket server:

```typescript
import { io } from 'socket.io-client'

const socket = io('http://localhost:3001', {
  transports: ['websocket']
})
```

## Events

### Client to Server

#### join-schema

Join a schema room for real-time updates.

**Emit**:
```typescript
socket.emit('join-schema', {
  schemaId: 'schema-123'
})
```

#### leave-schema

Leave a schema room.

**Emit**:
```typescript
socket.emit('leave-schema', {
  schemaId: 'schema-123'
})
```

#### update-schema

Broadcast schema changes to other users.

**Emit**:
```typescript
socket.emit('update-schema', {
  schemaId: 'schema-123',
  schema: { /* schema object */ }
})
```

#### collaboration-update

Send collaboration updates (cursor position, selections, etc.).

**Emit**:
```typescript
socket.emit('collaboration-update', {
  schemaId: 'schema-123',
  update: {
    type: 'cursor',
    position: { x: 100, y: 200 }
  }
})
```

### Server to Client

#### connect

Triggered when connection is established.

**Listen**:
```typescript
socket.on('connect', () => {
  console.log('Connected:', socket.id)
})
```

#### disconnect

Triggered when connection is lost.

**Listen**:
```typescript
socket.on('disconnect', () => {
  console.log('Disconnected')
})
```

#### user-joined

Notifies when another user joins a schema room.

**Listen**:
```typescript
socket.on('user-joined', (data) => {
  console.log('User joined:', data.userId)
  // data: { userId, schemaId }
})
```

#### user-left

Notifies when another user leaves a schema room.

**Listen**:
```typescript
socket.on('user-left', (data) => {
  console.log('User left:', data.userId)
  // data: { userId, schemaId }
})
```

#### schema-updated

Receives schema updates from other users.

**Listen**:
```typescript
socket.on('schema-updated', (data) => {
  console.log('Schema updated by:', data.updatedBy)
  // data: { schemaId, schema, updatedBy }
  // Update local schema state
})
```

#### collaboration-update

Receives collaboration updates from other users.

**Listen**:
```typescript
socket.on('collaboration-update', (data) => {
  console.log('Collaboration update:', data)
  // data: { schemaId, update, userId }
})
```

## Rooms

Schemas use rooms for isolated communication:

- Room format: `schema:{schemaId}`
- Users in the same room receive each other's updates
- Leaving a room stops receiving updates

## Best Practices

### 1. Join on Mount

Join the schema room when opening the editor:

```typescript
useEffect(() => {
  if (schemaId) {
    joinSchemaRoom(schemaId)
  }
  return () => {
    if (schemaId) {
      leaveSchemaRoom(schemaId)
    }
  }
}, [schemaId])
```

### 2. Throttle Updates

Don't send updates on every keystroke:

```typescript
import { debounce } from 'lodash'

const updateSchema = debounce((schema) => {
  emitSchemaUpdate(schemaId, schema)
}, 1000)
```

### 3. Handle Reconnection

Socket.IO automatically reconnects, but you should rejoin rooms:

```typescript
socket.on('connect', () => {
  if (currentSchemaId) {
    joinSchemaRoom(currentSchemaId)
  }
})
```

### 4. Conflict Resolution

Implement optimistic updates with conflict resolution:

```typescript
socket.on('schema-updated', (data) => {
  // Merge remote changes with local changes
  const merged = mergeSchemas(localSchema, data.schema)
  setSchema(merged)
})
```

## Connection States

Monitor connection state:

```typescript
socket.on('connect', () => {
  setConnectionState('connected')
})

socket.on('disconnect', () => {
  setConnectionState('disconnected')
})

socket.on('connect_error', (error) => {
  console.error('Connection error:', error)
  setConnectionState('error')
})
```

## Troubleshooting

### Connection Fails

1. Check backend is running on port 3001
2. Verify CORS settings in backend
3. Check browser console for errors

### Updates Not Received

1. Verify you've joined the schema room
2. Check socket connection state
3. Ensure schemaId is correct

### Multiple Connections

Each browser tab creates a separate connection. This is normal and expected.

## Security Considerations

### Current State

- No authentication required
- All connected clients can send/receive updates
- Suitable for development and trusted environments

### Future Enhancements

- Authentication tokens
- Room access control
- Message validation
- Rate limiting

## Next Steps

- Learn about [Architecture](../dev/architecture.md)
- Read [Contributing Guide](../dev/contributing.md)
