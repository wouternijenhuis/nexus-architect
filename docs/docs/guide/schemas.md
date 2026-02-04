# Schemas

Schemas are XSD definitions within a project. Each schema can contain elements, complex types, and simple types.

## Creating a Schema

1. Open a project
2. Click **"New Schema"**
3. Enter a schema name
4. Click **"Create"**

## Schema Editor

The schema editor has five main tabs:

### 1. Elements Tab

Root elements that can appear in XML documents.

**Adding an Element**:
1. Click **"Add Element"**
2. A new element is created with default properties:
   - Name: "newElement"
   - Type: "xs:string"
   - Min/Max Occurs: 1

**Element Properties**:
- **Name**: The element name in XML
- **Type**: Data type (xs:string, xs:int, or custom types)
- **minOccurs**: Minimum occurrences (default: 1)
- **maxOccurs**: Maximum occurrences (default: 1, use "unbounded" for unlimited)

### 2. Complex Types Tab

Complex types define structured elements with child elements and attributes.

**Adding a Complex Type**:
1. Click **"Add Complex Type"**
2. Configure:
   - Name
   - Child elements
   - Attributes

**Use Cases**:
- Grouped data structures
- Elements with attributes
- Nested hierarchies

### 3. Simple Types Tab

Simple types extend basic XSD types with restrictions.

**Adding a Simple Type**:
1. Click **"Add Simple Type"**
2. Configure:
   - Name
   - Base type (xs:string, xs:int, etc.)
   - Restrictions

**Available Restrictions**:
- `minLength` / `maxLength`: String length constraints
- `pattern`: Regular expression validation
- `enumeration`: Allowed values list
- `minInclusive` / `maxInclusive`: Number ranges

### 4. XSD Preview Tab

View the generated XSD code in real-time.

**Features**:
- Syntax-highlighted XML
- Auto-updates as you edit
- Copy-paste ready

### 5. Validate XML Tab

Test your XML against the schema.

**Steps**:
1. Paste XML content
2. Click **"Validate"**
3. View validation results

## Exporting Schemas

Click **"Export XSD"** to download the schema as a `.xsd` file.

**Export Format**: Standard XSD 1.0 XML format compatible with all XML tools.

## Schema Features

### Imports

Import other XSD schemas:
- Namespace support
- Schema location references
- Reusable type libraries

### Documentation

Add documentation to:
- Schemas
- Elements
- Types

Documentation appears in `<xs:annotation>` elements.

### Target Namespace

Set a target namespace for your schema to:
- Avoid naming conflicts
- Enable schema composition
- Follow XML standards

## Best Practices

1. **Use Meaningful Names**: Element and type names should be descriptive
2. **Document Your Schema**: Add documentation for complex structures
3. **Organize with Types**: Use complex and simple types for reusability
4. **Set Proper Cardinality**: Use minOccurs/maxOccurs appropriately
5. **Test with Validation**: Regularly validate sample XML

## Next Steps

- Learn about [XSD Features](xsd-features.md)
- Understand [Validation](validation.md)
- Try [AI Generation](ai-generation.md)
