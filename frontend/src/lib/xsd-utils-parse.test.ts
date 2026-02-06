import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseXSD, validateXMLWellFormedness, validateXMLAgainstXSD, generateXSDString } from './xsd-utils'
import type { XSDSchema } from '../types/xsd'

describe('parseXSD', () => {
  describe('empty/invalid input', () => {
    it('returns error for empty string', () => {
      const result = parseXSD('')
      expect(result.schema).toBeNull()
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].message).toContain('Empty or invalid XSD string')
    })

    it('returns error for whitespace-only string', () => {
      const result = parseXSD('   ')
      expect(result.schema).toBeNull()
      expect(result.errors[0].message).toContain('Empty or invalid XSD string')
    })

    it('returns error for null/undefined input', () => {
      const result = parseXSD(null as any)
      expect(result.schema).toBeNull()
      expect(result.errors).toHaveLength(1)
    })

    it('returns error for non-string input', () => {
      const result = parseXSD(123 as any)
      expect(result.schema).toBeNull()
      expect(result.errors).toHaveLength(1)
    })

    it('returns error when no xs:schema root element', () => {
      const result = parseXSD('<root><child/></root>')
      expect(result.schema).toBeNull()
      expect(result.errors[0].message).toContain('No xs:schema root element found')
    })

    it('returns error for malformed XML', () => {
      const result = parseXSD('<xs:schema><unclosed')
      expect(result.schema).toBeNull()
      expect(result.errors[0].message).toContain('Failed to parse XSD')
    })
  })

  describe('minimal valid XSD', () => {
    it('parses a schema with just a root element', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
</xs:schema>`
      const result = parseXSD(xsd)
      expect(result.errors).toHaveLength(0)
      expect(result.schema).not.toBeNull()
      expect(result.schema!.elements).toHaveLength(0)
      expect(result.schema!.complexTypes).toHaveLength(0)
      expect(result.schema!.simpleTypes).toHaveLength(0)
      expect(result.schema!.imports).toHaveLength(0)
      expect(result.schema!.name).toBe('Imported Schema')
    })
  })

  describe('targetNamespace', () => {
    it('parses targetNamespace from schema element', () => {
      const xsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" 
                      targetNamespace="http://example.com/ns">
      </xs:schema>`
      const result = parseXSD(xsd)
      expect(result.schema).not.toBeNull()
      expect(result.schema!.targetNamespace).toBe('http://example.com/ns')
    })
  })

  describe('elements', () => {
    it('parses a simple element with name and type', () => {
      const xsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:element name="firstName" type="xs:string"/>
      </xs:schema>`
      const result = parseXSD(xsd)
      expect(result.schema).not.toBeNull()
      expect(result.schema!.elements).toHaveLength(1)
      expect(result.schema!.elements[0].name).toBe('firstName')
      expect(result.schema!.elements[0].type).toBe('xs:string')
    })

    it('parses multiple elements', () => {
      const xsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:element name="firstName" type="xs:string"/>
        <xs:element name="age" type="xs:integer"/>
      </xs:schema>`
      const result = parseXSD(xsd)
      expect(result.schema!.elements).toHaveLength(2)
      expect(result.schema!.elements[1].name).toBe('age')
      expect(result.schema!.elements[1].type).toBe('xs:integer')
    })

    it('parses element with minOccurs and maxOccurs', () => {
      const xsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:element name="item" type="xs:string" minOccurs="0" maxOccurs="unbounded"/>
      </xs:schema>`
      const result = parseXSD(xsd)
      expect(result.schema!.elements[0].minOccurs).toBe('0')
      expect(result.schema!.elements[0].maxOccurs).toBe('unbounded')
    })

    it('parses element with documentation', () => {
      const xsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:element name="firstName" type="xs:string">
          <xs:annotation>
            <xs:documentation>The first name of the person</xs:documentation>
          </xs:annotation>
        </xs:element>
      </xs:schema>`
      const result = parseXSD(xsd)
      expect(result.schema!.elements[0].documentation).toBe('The first name of the person')
    })

    it('normalizes xsd: prefix types to xs: prefix', () => {
      const xsd = `<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema">
        <xsd:element name="age" type="xsd:integer"/>
      </xsd:schema>`
      const result = parseXSD(xsd)
      expect(result.schema!.elements[0].type).toBe('xs:integer')
    })

    it('normalizes bare type names', () => {
      const xsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:element name="active" type="boolean"/>
      </xs:schema>`
      const result = parseXSD(xsd)
      expect(result.schema!.elements[0].type).toBe('xs:boolean')
    })

    it('preserves unknown type names', () => {
      const xsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:element name="data" type="MyCustomType"/>
      </xs:schema>`
      const result = parseXSD(xsd)
      expect(result.schema!.elements[0].type).toBe('MyCustomType')
    })

    it('defaults type to xs:string when missing', () => {
      const xsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:element name="data"/>
      </xs:schema>`
      const result = parseXSD(xsd)
      expect(result.schema!.elements[0].type).toBe('xs:string')
    })
  })

  describe('elements with inline complex types', () => {
    it('parses element with inline complexType containing sequence', () => {
      const xsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:element name="person">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="name" type="xs:string"/>
              <xs:element name="age" type="xs:integer"/>
            </xs:sequence>
          </xs:complexType>
        </xs:element>
      </xs:schema>`
      const result = parseXSD(xsd)
      expect(result.schema!.elements).toHaveLength(1)
      expect(result.schema!.elements[0].type).toBe('complexType')
      expect(result.schema!.elements[0].children).toHaveLength(2)
      expect(result.schema!.elements[0].children![0].name).toBe('name')
      expect(result.schema!.elements[0].children![1].name).toBe('age')
    })

    it('parses element with inline complexType containing attributes', () => {
      const xsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:element name="product">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="title" type="xs:string"/>
            </xs:sequence>
            <xs:attribute name="id" type="xs:integer" use="required"/>
          </xs:complexType>
        </xs:element>
      </xs:schema>`
      const result = parseXSD(xsd)
      expect(result.schema!.elements[0].attributes).toHaveLength(1)
      expect(result.schema!.elements[0].attributes![0].name).toBe('id')
      expect(result.schema!.elements[0].attributes![0].use).toBe('required')
    })
  })

  describe('elements with inline simple types', () => {
    it('parses element with inline simpleType restriction', () => {
      const xsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:element name="age">
          <xs:simpleType>
            <xs:restriction base="xs:integer">
              <xs:minInclusive value="0"/>
              <xs:maxInclusive value="120"/>
            </xs:restriction>
          </xs:simpleType>
        </xs:element>
      </xs:schema>`
      const result = parseXSD(xsd)
      expect(result.schema!.elements[0].type).toBe('xs:integer')
    })
  })

  describe('complexTypes', () => {
    it('parses named complexType with sequence', () => {
      const xsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:complexType name="PersonType">
          <xs:sequence>
            <xs:element name="firstName" type="xs:string"/>
            <xs:element name="lastName" type="xs:string"/>
          </xs:sequence>
        </xs:complexType>
      </xs:schema>`
      const result = parseXSD(xsd)
      expect(result.schema!.complexTypes).toHaveLength(1)
      expect(result.schema!.complexTypes[0].name).toBe('PersonType')
      expect(result.schema!.complexTypes[0].elements).toHaveLength(2)
    })

    it('parses complexType with choice', () => {
      const xsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:complexType name="PaymentType">
          <xs:choice>
            <xs:element name="cash" type="xs:decimal"/>
            <xs:element name="card" type="xs:string"/>
          </xs:choice>
        </xs:complexType>
      </xs:schema>`
      const result = parseXSD(xsd)
      expect(result.schema!.complexTypes[0].elements).toHaveLength(2)
    })

    it('parses complexType with all', () => {
      const xsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:complexType name="AddressType">
          <xs:all>
            <xs:element name="street" type="xs:string"/>
            <xs:element name="city" type="xs:string"/>
          </xs:all>
        </xs:complexType>
      </xs:schema>`
      const result = parseXSD(xsd)
      expect(result.schema!.complexTypes[0].elements).toHaveLength(2)
    })

    it('parses complexType with attributes', () => {
      const xsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:complexType name="BookType">
          <xs:sequence>
            <xs:element name="title" type="xs:string"/>
          </xs:sequence>
          <xs:attribute name="isbn" type="xs:string" use="required"/>
          <xs:attribute name="lang" type="xs:string" use="optional"/>
        </xs:complexType>
      </xs:schema>`
      const result = parseXSD(xsd)
      expect(result.schema!.complexTypes[0].attributes).toHaveLength(2)
      expect(result.schema!.complexTypes[0].attributes[0].name).toBe('isbn')
      expect(result.schema!.complexTypes[0].attributes[0].use).toBe('required')
      expect(result.schema!.complexTypes[0].attributes[1].name).toBe('lang')
    })

    it('parses complexType with documentation', () => {
      const xsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:complexType name="PersonType">
          <xs:annotation>
            <xs:documentation>Represents a person</xs:documentation>
          </xs:annotation>
          <xs:sequence>
            <xs:element name="name" type="xs:string"/>
          </xs:sequence>
        </xs:complexType>
      </xs:schema>`
      const result = parseXSD(xsd)
      expect(result.schema!.complexTypes[0].documentation).toBe('Represents a person')
    })
  })

  describe('simpleTypes', () => {
    it('parses simpleType with minLength and maxLength restrictions', () => {
      const xsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:simpleType name="ShortString">
          <xs:restriction base="xs:string">
            <xs:minLength value="1"/>
            <xs:maxLength value="50"/>
          </xs:restriction>
        </xs:simpleType>
      </xs:schema>`
      const result = parseXSD(xsd)
      expect(result.schema!.simpleTypes).toHaveLength(1)
      expect(result.schema!.simpleTypes[0].name).toBe('ShortString')
      expect(result.schema!.simpleTypes[0].base).toBe('xs:string')
      expect(result.schema!.simpleTypes[0].restrictions).toHaveLength(2)
      expect(result.schema!.simpleTypes[0].restrictions![0]).toEqual({ type: 'minLength', value: '1' })
      expect(result.schema!.simpleTypes[0].restrictions![1]).toEqual({ type: 'maxLength', value: '50' })
    })

    it('parses simpleType with pattern restriction', () => {
      const xsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:simpleType name="PhoneNumber">
          <xs:restriction base="xs:string">
            <xs:pattern value="[0-9]{3}-[0-9]{4}"/>
          </xs:restriction>
        </xs:simpleType>
      </xs:schema>`
      const result = parseXSD(xsd)
      expect(result.schema!.simpleTypes[0].restrictions![0]).toEqual({
        type: 'pattern',
        value: '[0-9]{3}-[0-9]{4}',
      })
    })

    it('parses simpleType with enumeration restrictions', () => {
      const xsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:simpleType name="ColorType">
          <xs:restriction base="xs:string">
            <xs:enumeration value="Red"/>
            <xs:enumeration value="Green"/>
            <xs:enumeration value="Blue"/>
          </xs:restriction>
        </xs:simpleType>
      </xs:schema>`
      const result = parseXSD(xsd)
      const restrictions = result.schema!.simpleTypes[0].restrictions!
      expect(restrictions).toHaveLength(3)
      expect(restrictions[0]).toEqual({ type: 'enumeration', value: 'Red' })
      expect(restrictions[1]).toEqual({ type: 'enumeration', value: 'Green' })
      expect(restrictions[2]).toEqual({ type: 'enumeration', value: 'Blue' })
    })

    it('parses simpleType with minInclusive and maxInclusive', () => {
      const xsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:simpleType name="PercentType">
          <xs:restriction base="xs:integer">
            <xs:minInclusive value="0"/>
            <xs:maxInclusive value="100"/>
          </xs:restriction>
        </xs:simpleType>
      </xs:schema>`
      const result = parseXSD(xsd)
      const restrictions = result.schema!.simpleTypes[0].restrictions!
      expect(restrictions).toHaveLength(2)
      expect(restrictions[0]).toEqual({ type: 'minInclusive', value: '0' })
      expect(restrictions[1]).toEqual({ type: 'maxInclusive', value: '100' })
    })

    it('parses simpleType with documentation', () => {
      const xsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:simpleType name="EmailType">
          <xs:annotation>
            <xs:documentation>Email address format</xs:documentation>
          </xs:annotation>
          <xs:restriction base="xs:string">
            <xs:pattern value=".+@.+"/>
          </xs:restriction>
        </xs:simpleType>
      </xs:schema>`
      const result = parseXSD(xsd)
      expect(result.schema!.simpleTypes[0].documentation).toBe('Email address format')
    })

    it('defaults base to xs:string when restriction has no base', () => {
      const xsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:simpleType name="NoBase">
          <xs:restriction>
            <xs:minLength value="1"/>
          </xs:restriction>
        </xs:simpleType>
      </xs:schema>`
      const result = parseXSD(xsd)
      expect(result.schema!.simpleTypes[0].base).toBe('xs:string')
    })

    it('handles simpleType without restriction', () => {
      const xsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:simpleType name="NoRestriction">
        </xs:simpleType>
      </xs:schema>`
      const result = parseXSD(xsd)
      expect(result.schema!.simpleTypes[0].base).toBe('xs:string')
      expect(result.schema!.simpleTypes[0].restrictions).toHaveLength(0)
    })
  })

  describe('imports', () => {
    it('parses import with namespace and schemaLocation', () => {
      const xsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:import namespace="http://example.com/types" schemaLocation="types.xsd"/>
      </xs:schema>`
      const result = parseXSD(xsd)
      expect(result.schema!.imports).toHaveLength(1)
      expect(result.schema!.imports[0].namespace).toBe('http://example.com/types')
      expect(result.schema!.imports[0].schemaLocation).toBe('types.xsd')
    })

    it('parses multiple imports', () => {
      const xsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:import namespace="http://example.com/a" schemaLocation="a.xsd"/>
        <xs:import namespace="http://example.com/b" schemaLocation="b.xsd"/>
      </xs:schema>`
      const result = parseXSD(xsd)
      expect(result.schema!.imports).toHaveLength(2)
    })

    it('defaults missing namespace/schemaLocation to empty string', () => {
      const xsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:import namespace="" schemaLocation=""/>
      </xs:schema>`
      const result = parseXSD(xsd)
      expect(result.schema!.imports[0].namespace).toBe('')
      expect(result.schema!.imports[0].schemaLocation).toBe('')
    })
  })

  describe('schema-level documentation', () => {
    it('parses schema-level annotation/documentation', () => {
      const xsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:annotation>
          <xs:documentation>This is the schema documentation</xs:documentation>
        </xs:annotation>
      </xs:schema>`
      const result = parseXSD(xsd)
      expect(result.schema!.documentation).toBe('This is the schema documentation')
    })
  })

  describe('warnings for unsupported features', () => {
    it('warns about xs:include', () => {
      const xsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:include schemaLocation="common.xsd"/>
      </xs:schema>`
      const result = parseXSD(xsd)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].message).toContain('xs:include')
    })

    it('warns about xs:redefine', () => {
      const xsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:redefine schemaLocation="base.xsd"/>
      </xs:schema>`
      const result = parseXSD(xsd)
      expect(result.warnings.some(w => w.message.includes('xs:redefine'))).toBe(true)
    })

    it('warns about xs:group', () => {
      const xsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:group name="PersonGroup">
          <xs:sequence>
            <xs:element name="name" type="xs:string"/>
          </xs:sequence>
        </xs:group>
      </xs:schema>`
      const result = parseXSD(xsd)
      expect(result.warnings.some(w => w.message.includes('xs:group'))).toBe(true)
    })

    it('warns about xs:attributeGroup', () => {
      const xsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:attributeGroup name="CommonAttrs">
          <xs:attribute name="id" type="xs:string"/>
        </xs:attributeGroup>
      </xs:schema>`
      const result = parseXSD(xsd)
      expect(result.warnings.some(w => w.message.includes('xs:attributeGroup'))).toBe(true)
    })
  })

  describe('xsd: namespace prefix', () => {
    it('parses schema with xsd: prefix instead of xs:', () => {
      const xsd = `<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema">
        <xsd:element name="name" type="xsd:string"/>
        <xsd:complexType name="PersonType">
          <xsd:sequence>
            <xsd:element name="first" type="xsd:string"/>
          </xsd:sequence>
          <xsd:attribute name="id" type="xsd:integer"/>
        </xsd:complexType>
        <xsd:simpleType name="CodeType">
          <xsd:restriction base="xsd:string">
            <xsd:maxLength value="10"/>
          </xsd:restriction>
        </xsd:simpleType>
        <xsd:import namespace="http://example.com" schemaLocation="ext.xsd"/>
      </xsd:schema>`
      const result = parseXSD(xsd)
      expect(result.schema).not.toBeNull()
      expect(result.schema!.elements).toHaveLength(1)
      expect(result.schema!.complexTypes).toHaveLength(1)
      expect(result.schema!.simpleTypes).toHaveLength(1)
      expect(result.schema!.imports).toHaveLength(1)
    })
  })

  describe('attribute details', () => {
    it('parses attribute with default value', () => {
      const xsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:complexType name="ItemType">
          <xs:sequence>
            <xs:element name="name" type="xs:string"/>
          </xs:sequence>
          <xs:attribute name="lang" type="xs:string" default="en"/>
        </xs:complexType>
      </xs:schema>`
      const result = parseXSD(xsd)
      expect(result.schema!.complexTypes[0].attributes[0].default).toBe('en')
    })

    it('parses attribute with fixed value', () => {
      const xsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:complexType name="ItemType">
          <xs:sequence>
            <xs:element name="name" type="xs:string"/>
          </xs:sequence>
          <xs:attribute name="version" type="xs:string" fixed="1.0"/>
        </xs:complexType>
      </xs:schema>`
      const result = parseXSD(xsd)
      expect(result.schema!.complexTypes[0].attributes[0].fixed).toBe('1.0')
    })

    it('parses attribute with documentation', () => {
      const xsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
        <xs:complexType name="ItemType">
          <xs:sequence>
            <xs:element name="name" type="xs:string"/>
          </xs:sequence>
          <xs:attribute name="id" type="xs:string">
            <xs:annotation>
              <xs:documentation>Unique identifier</xs:documentation>
            </xs:annotation>
          </xs:attribute>
        </xs:complexType>
      </xs:schema>`
      const result = parseXSD(xsd)
      expect(result.schema!.complexTypes[0].attributes[0].documentation).toBe('Unique identifier')
    })
  })

  describe('comprehensive schema', () => {
    it('parses a full schema with elements, complex types, simple types, and imports', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" 
           targetNamespace="http://example.com/order"
           elementFormDefault="qualified">
  <xs:annotation>
    <xs:documentation>Order management schema</xs:documentation>
  </xs:annotation>
  
  <xs:import namespace="http://example.com/common" schemaLocation="common.xsd"/>
  
  <xs:simpleType name="StatusType">
    <xs:restriction base="xs:string">
      <xs:enumeration value="pending"/>
      <xs:enumeration value="completed"/>
    </xs:restriction>
  </xs:simpleType>
  
  <xs:complexType name="OrderType">
    <xs:sequence>
      <xs:element name="item" type="xs:string" maxOccurs="unbounded"/>
      <xs:element name="total" type="xs:decimal"/>
    </xs:sequence>
    <xs:attribute name="orderId" type="xs:string" use="required"/>
  </xs:complexType>
  
  <xs:element name="order" type="OrderType"/>
</xs:schema>`
      const result = parseXSD(xsd)
      expect(result.errors).toHaveLength(0)
      expect(result.schema).not.toBeNull()
      expect(result.schema!.targetNamespace).toBe('http://example.com/order')
      expect(result.schema!.documentation).toBe('Order management schema')
      expect(result.schema!.imports).toHaveLength(1)
      expect(result.schema!.simpleTypes).toHaveLength(1)
      expect(result.schema!.complexTypes).toHaveLength(1)
      expect(result.schema!.complexTypes[0].attributes).toHaveLength(1)
      expect(result.schema!.elements).toHaveLength(1)
    })
  })

  describe('type normalization across common types', () => {
    const typeTests = [
      ['xs:date', 'xs:date'],
      ['xsd:dateTime', 'xs:dateTime'],
      ['float', 'xs:float'],
      ['xs:double', 'xs:double'],
      ['xs:long', 'xs:long'],
      ['xsd:short', 'xs:short'],
      ['xs:positiveInteger', 'xs:positiveInteger'],
      ['xsd:nonNegativeInteger', 'xs:nonNegativeInteger'],
      ['xs:time', 'xs:time'],
      ['decimal', 'xs:decimal'],
    ] as const

    for (const [input, expected] of typeTests) {
      it(`normalizes "${input}" to "${expected}"`, () => {
        const xsd = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
          <xs:element name="test" type="${input}"/>
        </xs:schema>`
        const result = parseXSD(xsd)
        expect(result.schema!.elements[0].type).toBe(expected)
      })
    }
  })
})

describe('validateXMLWellFormedness', () => {
  it('returns valid for well-formed XML and XSD', () => {
    const xml = '<root><child>text</child></root>'
    const xsd = '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"></xs:schema>'
    const result = validateXMLWellFormedness(xml, xsd)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('returns invalid for malformed XML', () => {
    const xml = '<root><unclosed'
    const xsd = '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"></xs:schema>'
    const result = validateXMLWellFormedness(xml, xsd)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0].message).toBeTruthy()
  })

  it('returns invalid for malformed XSD', () => {
    const xml = '<root/>'
    const xsd = '<xs:schema><broken'
    const result = validateXMLWellFormedness(xml, xsd)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})

describe('validateXMLAgainstXSD alias', () => {
  it('is the same function as validateXMLWellFormedness', () => {
    expect(validateXMLAgainstXSD).toBe(validateXMLWellFormedness)
  })
})

describe('generateXSDString extended', () => {
  it('generates XSD with targetNamespace', () => {
    const schema: XSDSchema = {
      id: '1',
      name: 'Test',
      targetNamespace: 'http://example.com',
      elements: [],
      complexTypes: [],
      simpleTypes: [],
      imports: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const result = generateXSDString(schema)
    expect(result).toContain('targetNamespace')
    expect(result).toContain('http://example.com')
  })

  it('generates XSD with imports', () => {
    const schema: XSDSchema = {
      id: '1',
      name: 'Test',
      elements: [],
      complexTypes: [],
      simpleTypes: [],
      imports: [
        { id: 'i1', namespace: 'http://example.com/types', schemaLocation: 'types.xsd' },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const result = generateXSDString(schema)
    expect(result).toContain('xs:import')
    expect(result).toContain('http://example.com/types')
    expect(result).toContain('types.xsd')
  })

  it('generates XSD with simpleTypes', () => {
    const schema: XSDSchema = {
      id: '1',
      name: 'Test',
      elements: [],
      complexTypes: [],
      simpleTypes: [
        {
          id: 's1',
          name: 'StatusType',
          base: 'xs:string',
          restrictions: [
            { type: 'enumeration', value: 'active' },
            { type: 'enumeration', value: 'inactive' },
          ],
          documentation: 'Status values',
        },
      ],
      imports: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const result = generateXSDString(schema)
    expect(result).toContain('xs:simpleType')
    expect(result).toContain('StatusType')
    expect(result).toContain('xs:enumeration')
    expect(result).toContain('active')
    expect(result).toContain('xs:annotation')
    expect(result).toContain('Status values')
  })

  it('generates XSD with complexTypes containing attributes and documentation', () => {
    const schema: XSDSchema = {
      id: '1',
      name: 'Test',
      elements: [],
      complexTypes: [
        {
          id: 'c1',
          name: 'PersonType',
          elements: [
            { id: 'e1', name: 'name', type: 'xs:string' },
          ],
          attributes: [
            { id: 'a1', name: 'id', type: 'xs:integer', use: 'required' },
          ],
          documentation: 'Person complex type',
        },
      ],
      simpleTypes: [],
      imports: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const result = generateXSDString(schema)
    expect(result).toContain('xs:complexType')
    expect(result).toContain('PersonType')
    expect(result).toContain('xs:attribute')
    expect(result).toContain('Person complex type')
  })

  it('generates XSD with elements that have documentation, minOccurs, maxOccurs', () => {
    const schema: XSDSchema = {
      id: '1',
      name: 'Test',
      elements: [
        {
          id: 'e1',
          name: 'item',
          type: 'xs:string',
          minOccurs: '0',
          maxOccurs: 'unbounded',
          documentation: 'An item element',
        },
      ],
      complexTypes: [],
      simpleTypes: [],
      imports: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const result = generateXSDString(schema)
    expect(result).toContain('minOccurs')
    expect(result).toContain('maxOccurs')
    expect(result).toContain('An item element')
  })
})
