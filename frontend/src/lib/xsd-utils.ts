import { XMLParser, XMLBuilder } from 'fast-xml-parser'
import { XSDSchema, XSDElement, XSDComplexType, XSDSimpleType, ValidationResult } from '../types/xsd'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
})

const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  format: true,
  indentBy: '  ',
})

export function generateXSDString(schema: XSDSchema): string {
  const xsd: any = {
    '?xml': {
      '@_version': '1.0',
      '@_encoding': 'UTF-8',
    },
    'xs:schema': {
      '@_xmlns:xs': 'http://www.w3.org/2001/XMLSchema',
      '@_elementFormDefault': 'qualified',
    },
  }

  if (schema.targetNamespace) {
    xsd['xs:schema']['@_targetNamespace'] = schema.targetNamespace
  }

  // Add imports
  if (schema.imports.length > 0) {
    xsd['xs:schema']['xs:import'] = schema.imports.map((imp) => ({
      '@_namespace': imp.namespace,
      '@_schemaLocation': imp.schemaLocation,
    }))
  }

  // Add simple types
  if (schema.simpleTypes.length > 0) {
    xsd['xs:schema']['xs:simpleType'] = schema.simpleTypes.map((simpleType) =>
      buildSimpleType(simpleType)
    )
  }

  // Add complex types
  if (schema.complexTypes.length > 0) {
    xsd['xs:schema']['xs:complexType'] = schema.complexTypes.map((complexType) =>
      buildComplexType(complexType)
    )
  }

  // Add root elements
  if (schema.elements.length > 0) {
    xsd['xs:schema']['xs:element'] = schema.elements.map((element) => buildElement(element))
  }

  return builder.build(xsd)
}

function buildElement(element: XSDElement): any {
  const xsdElement: any = {
    '@_name': element.name,
    '@_type': element.type,
  }

  if (element.minOccurs) xsdElement['@_minOccurs'] = element.minOccurs
  if (element.maxOccurs) xsdElement['@_maxOccurs'] = element.maxOccurs

  if (element.documentation) {
    xsdElement['xs:annotation'] = {
      'xs:documentation': element.documentation,
    }
  }

  return xsdElement
}

function buildComplexType(complexType: XSDComplexType): any {
  const xsdComplexType: any = {
    '@_name': complexType.name,
  }

  if (complexType.documentation) {
    xsdComplexType['xs:annotation'] = {
      'xs:documentation': complexType.documentation,
    }
  }

  if (complexType.elements.length > 0) {
    xsdComplexType['xs:sequence'] = {
      'xs:element': complexType.elements.map((el) => buildElement(el)),
    }
  }

  if (complexType.attributes.length > 0) {
    xsdComplexType['xs:attribute'] = complexType.attributes.map((attr) => ({
      '@_name': attr.name,
      '@_type': attr.type,
      '@_use': attr.use || 'optional',
    }))
  }

  return xsdComplexType
}

function buildSimpleType(simpleType: XSDSimpleType): any {
  const xsdSimpleType: any = {
    '@_name': simpleType.name,
    'xs:restriction': {
      '@_base': simpleType.base,
    },
  }

  if (simpleType.restrictions && simpleType.restrictions.length > 0) {
    simpleType.restrictions.forEach((restriction) => {
      const key = `xs:${restriction.type}`
      if (!xsdSimpleType['xs:restriction'][key]) {
        xsdSimpleType['xs:restriction'][key] = []
      }
      xsdSimpleType['xs:restriction'][key].push({
        '@_value': restriction.value,
      })
    })
  }

  if (simpleType.documentation) {
    xsdSimpleType['xs:annotation'] = {
      'xs:documentation': simpleType.documentation,
    }
  }

  return xsdSimpleType
}

export function validateXMLAgainstXSD(xml: string, xsd: string): ValidationResult {
  try {
    // Basic XML parsing validation
    parser.parse(xml)
    parser.parse(xsd)

    // For comprehensive validation, we'd need a full XSD validator
    // This is a simplified version that checks basic XML well-formedness
    return {
      valid: true,
      errors: [],
    }
  } catch (error: any) {
    return {
      valid: false,
      errors: [
        {
          message: error.message || 'XML parsing error',
        },
      ],
    }
  }
}

export function parseXSD(xsdString: string): Partial<XSDSchema> {
  try {
    const parsed = parser.parse(xsdString)
    const schema = parsed['xs:schema'] || parsed['xsd:schema']

    if (!schema) {
      throw new Error('Invalid XSD: No schema root element found')
    }

    // Extract basic schema information
    const result: Partial<XSDSchema> = {
      targetNamespace: schema['@_targetNamespace'],
      elements: [],
      complexTypes: [],
      simpleTypes: [],
      imports: [],
    }

    return result
  } catch (error) {
    console.error('Failed to parse XSD:', error)
    return {}
  }
}
