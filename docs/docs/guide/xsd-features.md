# XSD Features

Nexus Architect supports comprehensive XSD schema features for creating robust XML schemas.

## Data Types

### Built-in Simple Types

XSD provides many built-in data types:

**String Types**:
- `xs:string` - Any string value
- `xs:normalizedString` - String without line breaks
- `xs:token` - Normalized string without extra whitespace

**Numeric Types**:
- `xs:integer` - Whole numbers
- `xs:int` - 32-bit integer
- `xs:long` - 64-bit integer
- `xs:decimal` - Decimal numbers
- `xs:float` - Floating-point numbers
- `xs:double` - Double-precision numbers

**Date/Time Types**:
- `xs:date` - Calendar date
- `xs:time` - Time of day
- `xs:dateTime` - Date and time
- `xs:duration` - Time duration

**Other Types**:
- `xs:boolean` - true/false
- `xs:anyURI` - URI reference
- `xs:base64Binary` - Base64-encoded binary
- `xs:hexBinary` - Hex-encoded binary

## Complex Types

Complex types allow you to define structured elements.

### Sequence

Elements must appear in the specified order:

```xml
<xs:complexType name="PersonType">
  <xs:sequence>
    <xs:element name="firstName" type="xs:string"/>
    <xs:element name="lastName" type="xs:string"/>
    <xs:element name="age" type="xs:int"/>
  </xs:sequence>
</xs:complexType>
```

### Attributes

Add attributes to elements:

```xml
<xs:complexType name="BookType">
  <xs:sequence>
    <xs:element name="title" type="xs:string"/>
  </xs:sequence>
  <xs:attribute name="isbn" type="xs:string" use="required"/>
  <xs:attribute name="edition" type="xs:int" use="optional"/>
</xs:complexType>
```

**Attribute Properties**:
- `use`: required | optional | prohibited
- `default`: Default value
- `fixed`: Fixed value

## Simple Types with Restrictions

### Length Restrictions

```xml
<xs:simpleType name="ZipCodeType">
  <xs:restriction base="xs:string">
    <xs:minLength value="5"/>
    <xs:maxLength value="10"/>
  </xs:restriction>
</xs:simpleType>
```

### Pattern Restrictions

Use regular expressions:

```xml
<xs:simpleType name="EmailType">
  <xs:restriction base="xs:string">
    <xs:pattern value="[^@]+@[^@]+\.[^@]+"/>
  </xs:restriction>
</xs:simpleType>
```

### Enumeration Restrictions

Define allowed values:

```xml
<xs:simpleType name="StatusType">
  <xs:restriction base="xs:string">
    <xs:enumeration value="active"/>
    <xs:enumeration value="inactive"/>
    <xs:enumeration value="pending"/>
  </xs:restriction>
</xs:simpleType>
```

### Numeric Restrictions

```xml
<xs:simpleType name="AgeType">
  <xs:restriction base="xs:int">
    <xs:minInclusive value="0"/>
    <xs:maxInclusive value="120"/>
  </xs:restriction>
</xs:simpleType>
```

## Cardinality

Control how many times an element can appear:

- `minOccurs="0"` - Element is optional
- `minOccurs="1"` - Element is required
- `maxOccurs="1"` - Element appears at most once
- `maxOccurs="unbounded"` - Element can appear unlimited times

Examples:

```xml
<!-- Optional element -->
<xs:element name="middleName" type="xs:string" minOccurs="0"/>

<!-- Required element -->
<xs:element name="lastName" type="xs:string" minOccurs="1"/>

<!-- List of items -->
<xs:element name="item" type="xs:string" minOccurs="0" maxOccurs="unbounded"/>
```

## Imports

Import schemas from other files or namespaces:

```xml
<xs:import namespace="http://example.com/common" 
           schemaLocation="common.xsd"/>
```

**Use Cases**:
- Share type definitions across schemas
- Organize large schemas into modules
- Reuse standard schemas

## Documentation

Add human-readable documentation:

```xml
<xs:element name="customer">
  <xs:annotation>
    <xs:documentation>
      Represents a customer in the system with contact information.
    </xs:documentation>
  </xs:annotation>
  <xs:complexType>
    <!-- ... -->
  </xs:complexType>
</xs:element>
```

## Target Namespace

Define a namespace for your schema:

```xml
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"
           targetNamespace="http://example.com/myschema"
           elementFormDefault="qualified">
  <!-- ... -->
</xs:schema>
```

## Best Practices

1. **Use Appropriate Types**: Choose the most specific type for your data
2. **Apply Restrictions**: Add constraints to enforce data quality
3. **Document Complex Structures**: Help future maintainers understand your schema
4. **Organize with Namespaces**: Use namespaces for large or shared schemas
5. **Test Thoroughly**: Validate sample XML to ensure schema works as intended

## Next Steps

- Learn about [Validation](validation.md)
- Try [AI Generation](ai-generation.md)
