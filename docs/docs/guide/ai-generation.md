# AI Generation

Nexus Architect integrates with Azure OpenAI to automatically generate XML samples based on your XSD schemas and contextual descriptions.

## Overview

The AI generation feature uses advanced language models to:
- Understand your XSD schema structure
- Generate realistic sample data
- Create context-appropriate XML content
- Follow schema constraints and types

## Prerequisites

To use AI generation, you need:

1. An Azure OpenAI account
2. A deployed GPT model (GPT-3.5 or GPT-4 recommended)
3. API credentials (endpoint and key)

## Configuration

### Step 1: Get Azure OpenAI Credentials

1. Go to the [Azure Portal](https://portal.azure.com)
2. Navigate to your Azure OpenAI resource
3. Copy the endpoint URL and API key
4. Note your deployment name

### Step 2: Configure Environment Variables

Create or edit `frontend/.env`:

```env
VITE_AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
VITE_AZURE_OPENAI_API_KEY=your-api-key-here
VITE_AZURE_OPENAI_DEPLOYMENT=gpt-4
```

**Security Note**: Never commit `.env` files to version control.

### Step 3: Restart the Application

```bash
npm run dev
```

## Using AI Generation

### Step 1: Open Schema Editor

1. Navigate to a schema
2. Click on the **"XSD Preview"** tab

### Step 2: Enter Context

In the context input field, describe the data you want:

**Examples**:
- "A customer order with 3 items"
- "Employee data for a software engineer"
- "Medical record for a routine checkup"
- "Invoice for consulting services"

### Step 3: Generate

Click the **"Generate Sample"** button.

### Step 4: Review Output

The AI will generate XML that:
- Conforms to your schema
- Contains contextually appropriate data
- Includes realistic values

## Context Best Practices

### Be Specific

❌ Bad: "Some data"
✅ Good: "A person named Sarah, age 25, living in New York"

### Provide Domain Context

❌ Bad: "An order"
✅ Good: "A book order with 2 fiction books and express shipping"

### Include Edge Cases

When testing, try:
- Minimum data: "A person with only required fields"
- Maximum data: "A person with all optional fields filled"
- Boundary values: "A person aged exactly 100"

## Advanced Usage

### Temperature Parameter

The temperature parameter controls randomness:

- **0.0-0.3**: Deterministic, consistent output
- **0.4-0.7**: Balanced creativity and consistency (default: 0.7)
- **0.8-1.0**: More creative, varied output

Modify in the code:
```typescript
const result = await generateXMLSample(schema, {
  context: 'Your context',
  temperature: 0.5, // Adjust as needed
})
```

### Prompt Engineering

For better results, structure your context:

```
Context: E-commerce order
Customer: Premium member
Products: 2 electronics items
Shipping: Next-day delivery
Payment: Credit card
```

## Use Cases

### 1. Testing

Generate test data for:
- Unit tests
- Integration tests
- Load testing
- Edge case validation

### 2. Documentation

Create example XML for:
- API documentation
- User guides
- Training materials
- Schema demonstrations

### 3. Prototyping

Quickly generate:
- Sample data for demos
- Initial dataset for development
- Mock responses for testing

### 4. Data Migration

Generate template data for:
- Data transformation scripts
- Migration planning
- Schema validation

## Limitations

### What AI Can Do

✅ Generate realistic sample data
✅ Follow schema structure
✅ Create contextually appropriate values
✅ Handle complex nested structures

### What AI Cannot Do

❌ Guarantee uniqueness of generated data
❌ Access real databases or systems
❌ Validate business logic beyond schema
❌ Generate cryptographically secure data

## Cost Considerations

Azure OpenAI usage is metered:

- Charged per token (input + output)
- Costs vary by model (GPT-4 > GPT-3.5)
- Check your Azure billing for details

**Cost Optimization**:
- Use GPT-3.5 for simple schemas
- Limit generation frequency during development
- Set reasonable token limits

## Troubleshooting

### "Azure AI not configured" Error

1. Check `.env` file exists in `frontend/`
2. Verify variable names start with `VITE_`
3. Restart the dev server after changes

### Poor Quality Output

1. Provide more specific context
2. Try adjusting temperature
3. Ensure schema is well-defined
4. Use a more capable model (GPT-4)

### Rate Limit Errors

Azure OpenAI has rate limits:
- Wait before retrying
- Check quota in Azure Portal
- Consider upgrading your tier

### Timeout Errors

For complex schemas:
- Simplify the schema temporarily
- Increase timeout in code
- Check network connectivity

## Privacy and Security

### Data Handling

- Schemas sent to Azure OpenAI are processed but not stored permanently
- Avoid including sensitive information in context descriptions
- Generated data is synthetic and random

### API Key Security

- Never commit API keys to repositories
- Use environment variables
- Rotate keys periodically
- Restrict access in Azure IAM

## Next Steps

- Explore [API Reference](../api/rest.md)
- Learn about [WebSocket API](../api/websocket.md)
- Read [Architecture](../dev/architecture.md)
