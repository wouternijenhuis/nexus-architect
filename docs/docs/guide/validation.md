# Validation

Nexus Architect provides XML validation capabilities to ensure your XML documents conform to your XSD schemas.

## How Validation Works

The validator checks your XML against the XSD schema and reports:

1. **Well-formedness**: Is the XML syntactically correct?
2. **Schema Compliance**: Does the XML follow the schema rules?
3. **Type Validation**: Do values match their declared types?
4. **Cardinality**: Are min/max occurs constraints met?

## Using the Validator

### Step 1: Navigate to Validate Tab

1. Open a schema in the editor
2. Click the **"Validate XML"** tab

### Step 2: Enter XML

Paste or type your XML content in the text area.

Example XML:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<person>
  <firstName>John</firstName>
  <lastName>Doe</lastName>
  <age>30</age>
</person>
```

### Step 3: Run Validation

Click the **"Validate"** button.

### Step 4: Review Results

**Valid XML**:
- Green success indicator
- "Valid XML" message
- No errors listed

**Invalid XML**:
- Red error indicator
- "Invalid XML" message
- List of validation errors with details

## Common Validation Errors

### Syntax Errors

**Missing closing tag**:
```xml
<person>
  <name>John</name>
<!-- Missing </person> -->
```

Error: "End tag expected"

**Mismatched tags**:
```xml
<person>
  <name>John</firstName>
</person>
```

Error: "End tag mismatch"

### Schema Violations

**Missing required element**:
Schema requires `lastName`, but XML only has:
```xml
<person>
  <firstName>John</firstName>
</person>
```

Error: "Required element 'lastName' is missing"

**Wrong data type**:
Schema expects `xs:int` for age:
```xml
<person>
  <age>thirty</age>
</person>
```

Error: "Invalid value for type xs:int"

**Cardinality violation**:
Schema allows max 1 email, but XML has:
```xml
<person>
  <email>john@example.com</email>
  <email>john2@example.com</email>
</person>
```

Error: "Element 'email' appears too many times"

## Validation Best Practices

### 1. Start Simple

Begin with basic XML and gradually add complexity.

### 2. Validate Early and Often

Don't wait until the XML is complete. Validate incrementally.

### 3. Use Sample Data

Create representative test cases that cover:
- Minimum required elements
- Maximum allowed elements
- Edge cases for restrictions
- Invalid data to test error handling

### 4. Check All Paths

If your schema has optional elements or choice groups, test different combinations.

### 5. Verify Restrictions

Test boundary conditions:
- Minimum/maximum lengths
- Pattern matching
- Enumeration values
- Numeric ranges

## Limitations

### Current Limitations

The built-in validator provides:
- ✅ XML well-formedness checking
- ✅ Basic syntax validation
- ⚠️  Limited full XSD validation

### For Comprehensive Validation

For production use, consider using dedicated XML validation tools:

**Command Line**:
- `xmllint` (libxml2)
- `xmlstarlet`

**Libraries**:
- Java: JAXP
- Python: lxml
- .NET: XmlReader

**Online Tools**:
- FreeFormatter.com XML Validator
- XMLValidation.com

## Integration with External Tools

Export your XSD and use it with:

1. **IDE Integration**: Most IDEs (VS Code, IntelliJ, Eclipse) have XSD validation plugins

2. **Build Tools**: Integrate validation into CI/CD pipelines

3. **Runtime Validation**: Use XSD in application code for input validation

## Troubleshooting

### Validator Says Valid, But Tool Shows Errors

The built-in validator is simplified. For production validation, use specialized tools.

### Large XML Performance

Very large XML documents may take time to validate. Consider:
- Validating smaller sections
- Using external tools for large files
- Optimizing schema complexity

### False Positives

If validation reports errors that seem incorrect:
1. Check XSD syntax
2. Verify namespace declarations
3. Ensure element names match exactly (case-sensitive)

## Next Steps

- Learn about [AI Generation](ai-generation.md)
- Explore [API Reference](../api/rest.md)
