# REST API

The Nexus Architect backend provides a REST API for health checks and future extensibility.

## Base URL

```
http://localhost:3001/api
```

## Endpoints

### Health Check

Check if the API is running.

**Request**:
```http
GET /api/health
```

**Response**:
```json
{
  "status": "ok",
  "message": "Nexus Architect API is running"
}
```

**Status Codes**:
- `200 OK`: Server is running
- `500 Internal Server Error`: Server error

## Future Endpoints

The following endpoints are planned for future releases:

### Projects

- `GET /api/projects` - List all projects
- `POST /api/projects` - Create a project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update a project
- `DELETE /api/projects/:id` - Delete a project

### Schemas

- `GET /api/projects/:projectId/schemas` - List schemas
- `POST /api/projects/:projectId/schemas` - Create a schema
- `GET /api/schemas/:id` - Get schema details
- `PUT /api/schemas/:id` - Update a schema
- `DELETE /api/schemas/:id` - Delete a schema

### Validation

- `POST /api/validate` - Validate XML against XSD

## Error Handling

All errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

## Authentication

Currently, no authentication is required. Future versions will support:
- API keys
- OAuth 2.0
- JWT tokens

## Rate Limiting

No rate limiting is currently enforced. This may be added in future versions.

## CORS

CORS is enabled for the frontend URL configured in `.env`:

```
FRONTEND_URL=http://localhost:3000
```

## Next Steps

- Learn about [WebSocket API](websocket.md)
- Explore [Architecture](../dev/architecture.md)
