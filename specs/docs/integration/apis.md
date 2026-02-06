# API Reference

## REST API

### Base URL
- **Development**: `http://localhost:3001`
- **Production**: Configurable via environment variable

### API Endpoints

#### Health Check

**Endpoint**: `GET /api/health`

**Description**: Check if the backend server is running and responsive.

**Authentication**: None

**Request**: None

**Response**:
```json
{
  "status": "ok",
  "message": "Nexus Architect API is running"
}
```

**Status Codes**:
- `200 OK`: Server is healthy

**Implementation**: [backend/src/index.ts#L29-L31](backend/src/index.ts)

---

#### Generate XML Sample (AI)

**Endpoint**: `POST /api/generate-xml`

**Description**: Generate an XML sample document based on an XSD schema using Azure OpenAI. This endpoint sends the XSD schema and user context to Azure OpenAI GPT-4 to generate a valid XML sample.

**Authentication**: None (relies on server-side Azure OpenAI credentials)

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "xsdString": "<?xml version=\"1.0\"?><xs:schema xmlns:xs=\"http://www.w3.org/2001/XMLSchema\">...</xs:schema>",
  "context": "Generate data for a customer order with 3 items",
  "temperature": 0.7
}
```

**Request Fields**:
- `xsdString` (string, required): Complete XSD schema as XML string
- `context` (string, required): Description of the data context for AI to generate appropriate values
- `temperature` (number, optional): AI creativity parameter (0.0-1.0), default 0.7

**Success Response** (200 OK):
```json
{
  "success": true,
  "xml": "<?xml version=\"1.0\"?>\n<root>\n  <item>value</item>\n</root>"
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "error": "Missing required fields: xsdString and context"
}
```

**Error Response** (503 Service Unavailable):
```json
{
  "success": false,
  "error": "Azure OpenAI is not configured on the server"
}
```

**Error Response** (500 Internal Server Error):
```json
{
  "success": false,
  "error": "Failed to generate XML sample"
}
```

**Status Codes**:
- `200 OK`: XML successfully generated
- `400 Bad Request`: Missing required fields
- `503 Service Unavailable`: Azure OpenAI not configured
- `500 Internal Server Error`: AI generation failed

**AI Processing**:
1. Sends system prompt: "You are an XML expert. Generate valid XML samples based on XSD schemas and user context."
2. Sends user prompt with XSD and context
3. Receives AI response with XML
4. Strips markdown code blocks if present (```xml or ```)
5. Returns clean XML string

**Implementation**: 
- Endpoint: [backend/src/index.ts#L34-L51](backend/src/index.ts)
- Service: [backend/src/services/ai-service.ts](backend/src/services/ai-service.ts)

**Configuration Required**:
- `AZURE_OPENAI_ENDPOINT`: Azure OpenAI service endpoint
- `AZURE_OPENAI_API_KEY`: API authentication key
- `AZURE_OPENAI_DEPLOYMENT`: Model deployment name (default: 'gpt-4')

**Example cURL**:
```bash
curl -X POST http://localhost:3001/api/generate-xml \
  -H "Content-Type: application/json" \
  -d '{
    "xsdString": "<?xml version=\"1.0\"?><xs:schema xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"><xs:element name=\"root\" type=\"xs:string\"/></xs:schema>",
    "context": "Generate a simple greeting",
    "temperature": 0.7
  }'
```

---

### CORS Configuration

**Allowed Origins**: Configurable via `FRONTEND_URL` environment variable
- **Default**: `http://localhost:3000`
- **Methods**: `GET`, `POST`

**Implementation**: [backend/src/index.ts#L15-L19](backend/src/index.ts)

---

## WebSocket API (Socket.IO)

### Connection

**URL**: Same as REST API base URL (Socket.IO auto-detects)
- **Development**: `http://localhost:3001`
- **Protocol**: WebSocket with fallback transports

**Client Library**: Socket.IO Client v4.8.1

**Connection Code**:
```typescript
import { io } from 'socket.io-client'

const socket = io('http://localhost:3001', {
  transports: ['websocket']
})
```

**Implementation**: [frontend/src/lib/websocket.ts](frontend/src/lib/websocket.ts)

**Connection Lifecycle**:
- `connect`: Emitted when connection established
- `disconnect`: Emitted when connection lost
- Auto-reconnection: Enabled by default

---

### Client → Server Events

#### join-schema

**Description**: User joins a schema editing room to receive real-time updates.

**Payload**:
```typescript
{
  schemaId: string  // UUID of the schema
}
```

**Server Actions**:
1. Adds socket to room `schema:${schemaId}`
2. Tracks user in `schemaRooms` Map
3. Broadcasts `user-joined` event to other room members

**Example**:
```typescript
socket.emit('join-schema', { schemaId: 'uuid-123' })
```

**Implementation**: [backend/src/index.ts#L60-L74](backend/src/index.ts)

---

#### leave-schema

**Description**: User leaves a schema editing room.

**Payload**:
```typescript
{
  schemaId: string  // UUID of the schema
}
```

**Server Actions**:
1. Removes socket from room `schema:${schemaId}`
2. Removes user from `schemaRooms` Map
3. Broadcasts `user-left` event to other room members

**Example**:
```typescript
socket.emit('leave-schema', { schemaId: 'uuid-123' })
```

**Implementation**: [backend/src/index.ts#L76-L88](backend/src/index.ts)

---

#### update-schema

**Description**: User made changes to a schema. Broadcast to collaborators.

**Payload**:
```typescript
{
  schemaId: string    // UUID of the schema
  schema: XSDSchema   // Complete updated schema object
}
```

**Server Actions**:
1. Broadcasts `schema-updated` event to all room members except sender
2. Logs the update

**Example**:
```typescript
socket.emit('update-schema', {
  schemaId: 'uuid-123',
  schema: {
    id: 'uuid-123',
    name: 'MySchema',
    elements: [...]
    // ... full schema object
  }
})
```

**Implementation**: [backend/src/index.ts#L90-L98](backend/src/index.ts)

**Note**: No server-side validation or persistence. Simply broadcasts to collaborators.

---

#### collaboration-update

**Description**: Send cursor position, text selection, or other collaboration metadata.

**Payload**:
```typescript
{
  schemaId: string   // UUID of the schema
  update: any        // Arbitrary collaboration data
}
```

**Server Actions**:
1. Broadcasts `collaboration-update` event to all room members except sender
2. Includes sender's socket ID

**Example**:
```typescript
socket.emit('collaboration-update', {
  schemaId: 'uuid-123',
  update: {
    cursorPosition: { line: 10, column: 5 },
    selection: { start: 100, end: 150 }
  }
})
```

**Implementation**: [backend/src/index.ts#L100-L108](backend/src/index.ts)

**Note**: This event is defined but NOT currently used by the frontend. Future enhancement.

---

### Server → Client Events

#### user-joined

**Description**: Another user joined the same schema room.

**Payload**:
```typescript
{
  userId: string    // Socket ID of the user who joined
  schemaId: string  // Schema they joined
}
```

**Receiver**: All users in the room except the one who joined

**Example Handler**:
```typescript
socket.on('user-joined', (data) => {
  console.log(`User ${data.userId} joined schema ${data.schemaId}`)
})
```

**Implementation**: [backend/src/index.ts#L69-L72](backend/src/index.ts)

---

#### user-left

**Description**: Another user left the schema room.

**Payload**:
```typescript
{
  userId: string    // Socket ID of the user who left
  schemaId: string  // Schema they left
}
```

**Receiver**: All remaining users in the room

**Example Handler**:
```typescript
socket.on('user-left', (data) => {
  console.log(`User ${data.userId} left schema ${data.schemaId}`)
})
```

**Implementation**: [backend/src/index.ts#L83-L86](backend/src/index.ts)

---

#### schema-updated

**Description**: Another user updated the schema content.

**Payload**:
```typescript
{
  schemaId: string     // Schema that was updated
  schema: XSDSchema    // Complete updated schema object
  updatedBy: string    // Socket ID of user who made the update
}
```

**Receiver**: All users in the room except the one who made the update

**Example Handler**:
```typescript
socket.on('schema-updated', (data) => {
  console.log(`Schema ${data.schemaId} updated by ${data.updatedBy}`)
  // Update local state with data.schema
})
```

**Current Implementation**: Event handler exists in [frontend/src/lib/websocket.ts#L25-L28](frontend/src/lib/websocket.ts) but only logs to console. Schema state is NOT automatically merged.

**Conflict Resolution**: NONE. Last write wins. If two users edit simultaneously, changes may be lost.

---

#### collaboration-update

**Description**: Another user's cursor/selection update.

**Payload**:
```typescript
{
  schemaId: string   // Schema being edited
  update: any        // Collaboration data (cursor, selection, etc.)
  userId: string     // Socket ID of the user
}
```

**Receiver**: All users in the room except the one who sent the update

**Example Handler**:
```typescript
socket.on('collaboration-update', (data) => {
  console.log(`Collaboration update from ${data.userId}:`, data.update)
})
```

**Current Implementation**: Event handler exists in [frontend/src/lib/websocket.ts#L30-L33](frontend/src/lib/websocket.ts) but only logs to console. Not used by UI.

---

### Room Management

**Architecture**: Room-based isolation
- **Room ID Pattern**: `schema:${schemaId}`
- **One schema = One room**
- **Users can be in multiple rooms** (if editing multiple schemas)

**State Storage**: In-memory Map on backend
```typescript
schemaRooms: Map<schemaId, Set<socketId>>
```

**Cleanup**:
- On socket disconnect: User removed from all rooms
- Empty rooms: Deleted to prevent memory leaks

**Scalability Limitation**: 
- Rooms stored in memory (single server instance only)
- For multi-instance deployment, would need Redis pub/sub adapter

---

## Authentication & Authorization

**Current Status**: ⚠️ **NONE IMPLEMENTED**

**REST API**: No authentication required
- Any client can call any endpoint
- No rate limiting
- No API keys

**WebSocket**: No authentication required
- Any client can connect
- Any client can join any schema room (if they know the schema ID)
- No permission checks
- No user identity verification

**Security Implications**:
- Suitable for local development or trusted networks
- NOT suitable for public deployment without adding authentication
- Anyone with network access can read/edit any schema

**Design Rationale**: 
- Target use case: Local development tool or internal team use
- Data stored client-side (localStorage)
- No sensitive data expected
- Simplifies deployment

**Future Enhancement**: Would need to add:
1. JWT or session-based authentication
2. User identity management
3. Schema ownership/permissions
4. Rate limiting
5. WebSocket authentication tokens

---

## Error Handling

### REST API Errors

**Standard Error Response Format**:
```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

**HTTP Status Codes Used**:
- `200 OK`: Success
- `400 Bad Request`: Invalid request (missing fields)
- `500 Internal Server Error`: Server-side error
- `503 Service Unavailable`: Feature not configured (Azure OpenAI)

**No Global Error Handler**: Errors handled per-endpoint

---

### WebSocket Error Handling

**No explicit error events**: Socket.IO handles connection errors internally

**Client-side handling**:
- Connection failures: Logged to console
- Emit failures: Silent (no feedback to user)

**Disconnect Handling**:
- Automatic reconnection by Socket.IO
- Rooms rejoined on reconnection: NO (user must rejoin manually)

**Implementation Gap**: No mechanism to rejoin rooms after reconnection. Users would need to refresh the page.

---

## Rate Limiting

**Current Status**: ⚠️ **NOT IMPLEMENTED**

**Implications**:
- AI endpoint can be spammed (expensive Azure OpenAI calls)
- WebSocket rooms can be flooded with updates
- No protection against abuse

**Recommended for Production**:
- Add express-rate-limit for REST API
- Add socket.io rate limiting for events
- Add per-user quotas for AI generation

---

## Data Models

### XSDElement
```typescript
interface XSDElement {
  id: string              // UUID
  name: string            // Element name
  type: string            // XSD type (e.g., "xs:string", "CustomType")
  minOccurs?: string      // Minimum occurrences (default "1")
  maxOccurs?: string      // Maximum occurrences (default "1", "unbounded")
  documentation?: string  // Documentation/description
  attributes?: XSDAttribute[]  // Element attributes
  children?: XSDElement[]      // Nested elements
}
```

### XSDComplexType
```typescript
interface XSDComplexType {
  id: string                // UUID
  name: string              // Type name
  elements: XSDElement[]    // Child elements
  attributes: XSDAttribute[] // Type attributes
  documentation?: string    // Documentation
}
```

### XSDSchema
```typescript
interface XSDSchema {
  id: string                   // UUID
  name: string                 // Schema name
  targetNamespace?: string     // XML namespace
  elements: XSDElement[]       // Root elements
  complexTypes: XSDComplexType[] // Complex type definitions
  simpleTypes: XSDSimpleType[]   // Simple type definitions
  imports: XSDImport[]         // Schema imports
  documentation?: string       // Schema documentation
  createdAt: Date             // Creation timestamp
  updatedAt: Date             // Last update timestamp
}
```

**Type Definitions**: [frontend/src/types/xsd.ts](frontend/src/types/xsd.ts)

---

## API Clients

### Frontend Client (REST)

**File**: [frontend/src/lib/azure-ai.ts](frontend/src/lib/azure-ai.ts)

**Function**: `generateXMLSample(schema, request)`

**Usage**:
```typescript
import { generateXMLSample } from '@/lib/azure-ai'

const result = await generateXMLSample(schema, {
  context: 'Generate sample customer data',
  temperature: 0.7
})

if (result.success) {
  console.log(result.xml)
} else {
  console.error(result.error)
}
```

---

### Frontend Client (WebSocket)

**File**: [frontend/src/lib/websocket.ts](frontend/src/lib/websocket.ts)

**Functions**:
- `connectWebSocket()`: Initialize connection
- `disconnectWebSocket()`: Close connection
- `joinSchemaRoom(schemaId)`: Join a schema room
- `leaveSchemaRoom(schemaId)`: Leave a schema room
- `emitSchemaUpdate(schemaId, schema)`: Broadcast schema changes
- `getSocket()`: Get raw socket instance

**Usage**:
```typescript
import {
  connectWebSocket,
  joinSchemaRoom,
  emitSchemaUpdate,
  leaveSchemaRoom
} from '@/lib/websocket'

// Connect on app startup
connectWebSocket()

// Join schema room when opening editor
joinSchemaRoom('schema-uuid-123')

// Broadcast changes
emitSchemaUpdate('schema-uuid-123', updatedSchema)

// Leave room when closing editor
leaveSchemaRoom('schema-uuid-123')
```

---

## Testing Endpoints

### Manual Testing

**Test Health Endpoint**:
```bash
curl http://localhost:3001/api/health
```

**Test AI Generation** (requires Azure OpenAI):
```bash
curl -X POST http://localhost:3001/api/generate-xml \
  -H "Content-Type: application/json" \
  -d '{
    "xsdString": "<?xml version=\"1.0\"?><xs:schema xmlns:xs=\"http://www.w3.org/2001/XMLSchema\"><xs:element name=\"greeting\" type=\"xs:string\"/></xs:schema>",
    "context": "Say hello",
    "temperature": 0.7
  }'
```

### WebSocket Testing

**Browser Console**:
```javascript
const socket = io('http://localhost:3001')
socket.on('connect', () => console.log('Connected'))
socket.emit('join-schema', { schemaId: 'test' })
```

---

## API Versioning

**Current Version**: Unversioned
- No version number in URLs
- No API version headers
- Breaking changes would affect all clients

**Recommendation**: Add `/api/v1/` prefix for future API versions
