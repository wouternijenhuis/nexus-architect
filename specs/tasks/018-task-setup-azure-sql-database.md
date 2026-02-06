# Task 018: Setup Azure SQL Database

**Task ID**: TASK-018
**Order**: 018
**Phase**: Phase 3 - Production Readiness
**Priority**: HIGH
**Estimated Effort**: 5-7 days
**Status**: NOT STARTED

## Description

Replace in-memory/localStorage data persistence with Azure SQL Database. Design the database schema, implement data access layer using an ORM, and migrate existing data structures.

## Dependencies

- Task 013 (Backend Service Layer)

## Technical Requirements

### Database Schema
- Projects table (id, name, description, created_at, updated_at, owner_id)
- Schemas table (id, project_id, name, xsd_content, created_at, updated_at)
- Users table (id, azure_ad_oid, email, display_name, role)
- Audit log table (id, user_id, action, resource_type, resource_id, timestamp, details)

### Backend
- Install Prisma ORM
- Define Prisma schema with models matching above tables
- Create database client singleton
- Implement repository pattern for data access
- Replace in-memory data operations with database queries
- Connection pooling configuration
- Error handling for database operations

### Configuration
- Azure SQL connection string via environment variable
- Support for local development with SQLite or Docker SQL Server
- Connection pool settings

## Acceptance Criteria

- [ ] Database schema created and documented
- [ ] Prisma models match application data types
- [ ] CRUD operations work through database
- [ ] Connection pooling configured
- [ ] Database errors handled gracefully
- [ ] Tests use in-memory/mock database
- [ ] Local development works without Azure
