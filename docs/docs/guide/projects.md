# Projects

Projects are the top-level containers in Nexus Architect that help you organize related XSD schemas.

## Creating a Project

1. From the home page, click **"New Project"**
2. Enter a **name** for your project (required)
3. Optionally add a **description**
4. Click **"Create"**

## Managing Projects

### Opening a Project

Click the **"Open"** button on any project card to view its schemas.

### Exporting a Project

1. Click the download icon on a project card
2. The project and all its schemas will be exported as a JSON file
3. This file can be shared or used as a backup

### Importing a Project

1. Click the **"Import"** button on the home page
2. Select a previously exported JSON file
3. The project will be added to your workspace

### Deleting a Project

1. Click the trash icon on a project card
2. Confirm the deletion
3. **Warning**: This action cannot be undone

## Project Storage

Projects are stored in your browser's local storage by default. This means:

- ✅ No server required for basic functionality
- ✅ Data persists between sessions
- ✅ Fast access and updates
- ⚠️ Data is stored per browser
- ⚠️ Clearing browser data will delete projects

**Best Practice**: Regularly export important projects as backups.

## Collaboration

When working with the backend server:

- Multiple users can open the same schema
- Real-time updates are broadcast via WebSocket
- Changes are synchronized across all connected clients
- User presence indicators show who's editing

## Next Steps

- Learn about [Schemas](schemas.md)
- Explore [XSD Features](xsd-features.md)
