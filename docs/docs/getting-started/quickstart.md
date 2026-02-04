# Quick Start

This guide will walk you through creating your first XSD schema with Nexus Architect.

## Step 1: Create a Project

1. Open Nexus Architect in your browser (http://localhost:3000)
2. Click the **"New Project"** button
3. Enter a project name (e.g., "My First XSD Project")
4. Optionally add a description
5. Click **"Create"**

## Step 2: Create a Schema

1. Click **"Open"** on your newly created project
2. Click the **"New Schema"** button
3. Enter a schema name (e.g., "person-schema")
4. Click **"Create"**

## Step 3: Add Elements

1. Click **"Edit Schema"** on your schema
2. You'll see tabs for: Elements, Complex Types, Simple Types, XSD Preview, and Validate XML
3. On the **Elements** tab, click **"Add Element"**
4. A new element called "newElement" will be added
5. Repeat to add more elements

## Step 4: View XSD Preview

1. Click on the **"XSD Preview"** tab
2. You'll see the generated XSD code
3. This updates automatically as you add elements and types

## Step 5: Export Your Schema

1. Click the **"Export XSD"** button in the top right
2. Your schema will be downloaded as a `.xsd` file
3. You can use this file in your XML applications

## Step 6: Validate XML (Optional)

1. Click on the **"Validate XML"** tab
2. Paste your XML content in the text area
3. Click **"Validate"**
4. The validator will check if your XML conforms to the schema

## Step 7: Generate AI Sample (Optional)

If you have configured Azure OpenAI:

1. Go to the **"XSD Preview"** tab
2. Enter a context description (e.g., "A person with name and age")
3. Click **"Generate Sample"**
4. An XML sample will be generated based on your schema and context

## Next Steps

- Learn more about [Projects](../guide/projects.md)
- Explore [Complex Types](../guide/xsd-features.md)
- Understand [Validation](../guide/validation.md)
- Set up [AI Generation](../guide/ai-generation.md)
