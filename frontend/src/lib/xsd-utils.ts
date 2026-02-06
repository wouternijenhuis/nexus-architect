import { XMLParser, XMLBuilder } from 'fast-xml-parser'
import { XSDSchema, XSDElement, XSDComplexType, XSDSimpleType, XSDAttribute, XSDRestriction, XSDImport, ValidationResult } from '../types/xsd'

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
      // Initialize as array if it doesn't exist
      if (!Array.isArray(xsdSimpleType['xs:restriction'][key])) {
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

export function validateXMLWellFormedness(xml: string, xsd: string): ValidationResult {
  try {
    // Basic XML parsing validation
    parser.parse(xml)
    parser.parse(xsd)

    // Note: This only checks well-formedness, not schema compliance
    // For comprehensive XSD validation, use a dedicated XSD validation library
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

// Alias for backward compatibility
export const validateXMLAgainstXSD = validateXMLWellFormedness

// XSD type to internal type mapping
const XSD_TYPE_MAP: Record<string, string> = {
  'xs:string': 'xs:string',
  'xsd:string': 'xs:string',
  'string': 'xs:string',
  'xs:integer': 'xs:integer',
  'xsd:integer': 'xs:integer',
  'integer': 'xs:integer',
  'xs:int': 'xs:integer',
  'xsd:int': 'xs:integer',
  'int': 'xs:integer',
  'xs:decimal': 'xs:decimal',
  'xsd:decimal': 'xs:decimal',
  'decimal': 'xs:decimal',
  'xs:double': 'xs:double',
  'xsd:double': 'xs:double',
  'double': 'xs:double',
  'xs:float': 'xs:float',
  'xsd:float': 'xs:float',
  'float': 'xs:float',
  'xs:boolean': 'xs:boolean',
  'xsd:boolean': 'xs:boolean',
  'boolean': 'xs:boolean',
  'xs:date': 'xs:date',
  'xsd:date': 'xs:date',
  'date': 'xs:date',
  'xs:dateTime': 'xs:dateTime',
  'xsd:dateTime': 'xs:dateTime',
  'dateTime': 'xs:dateTime',
  'xs:time': 'xs:time',
  'xsd:time': 'xs:time',
  'time': 'xs:time',
  'xs:positiveInteger': 'xs:positiveInteger',
  'xsd:positiveInteger': 'xs:positiveInteger',
  'positiveInteger': 'xs:positiveInteger',
  'xs:nonNegativeInteger': 'xs:nonNegativeInteger',
  'xsd:nonNegativeInteger': 'xs:nonNegativeInteger',
  'nonNegativeInteger': 'xs:nonNegativeInteger',
  'xs:long': 'xs:long',
  'xsd:long': 'xs:long',
  'long': 'xs:long',
  'xs:short': 'xs:short',
  'xsd:short': 'xs:short',
  'short': 'xs:short',
}

export interface ParseResult {
  schema: XSDSchema | null
  errors: Array<{ line?: number; message: string }>
  warnings: Array<{ message: string }>
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

function normalizeType(xsdType: string | undefined): string {
  if (!xsdType) return 'xs:string'
  return XSD_TYPE_MAP[xsdType] || xsdType
}

function ensureArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined || value === null) return []
  return Array.isArray(value) ? value : [value]
}

function parseRestrictions(restrictionNode: any): XSDRestriction[] {
  const restrictions: XSDRestriction[] = []
  
  const restrictionTypes: Array<XSDRestriction['type']> = [
    'minLength', 'maxLength', 'pattern', 'enumeration', 'minInclusive', 'maxInclusive'
  ]
  
  for (const type of restrictionTypes) {
    const xsKey = `xs:${type}`
    const xsdKey = `xsd:${type}`
    const values = ensureArray(restrictionNode[xsKey] || restrictionNode[xsdKey] || restrictionNode[type])
    
    for (const val of values) {
      if (val !== undefined) {
        const value = typeof val === 'object' ? val['@_value'] : val
        if (value !== undefined) {
          restrictions.push({ type, value: String(value) })
        }
      }
    }
  }
  
  return restrictions
}

function parseAttributes(parentNode: any): XSDAttribute[] {
  const attributes: XSDAttribute[] = []
  
  const attrNodes = ensureArray(
    parentNode['xs:attribute'] || parentNode['xsd:attribute'] || parentNode['attribute']
  )
  
  for (const attr of attrNodes) {
    if (attr && attr['@_name']) {
      const attribute: XSDAttribute = {
        id: generateId(),
        name: attr['@_name'],
        type: normalizeType(attr['@_type']),
        use: attr['@_use'] as 'required' | 'optional' | 'prohibited' | undefined,
      }
      
      if (attr['@_default']) attribute.default = attr['@_default']
      if (attr['@_fixed']) attribute.fixed = attr['@_fixed']
      
      // Parse documentation
      const annotation = attr['xs:annotation'] || attr['xsd:annotation'] || attr['annotation']
      if (annotation) {
        const doc = annotation['xs:documentation'] || annotation['xsd:documentation'] || annotation['documentation']
        if (doc) attribute.documentation = typeof doc === 'string' ? doc : doc['#text'] || String(doc)
      }
      
      attributes.push(attribute)
    }
  }
  
  return attributes
}

function parseElementNode(node: any, customTypes: Map<string, any>): XSDElement {
  const element: XSDElement = {
    id: generateId(),
    name: node['@_name'] || 'unnamed',
    type: normalizeType(node['@_type'] || node['@_ref']),
  }
  
  if (node['@_minOccurs']) element.minOccurs = node['@_minOccurs']
  if (node['@_maxOccurs']) element.maxOccurs = node['@_maxOccurs']
  
  // Parse documentation
  const annotation = node['xs:annotation'] || node['xsd:annotation'] || node['annotation']
  if (annotation) {
    const doc = annotation['xs:documentation'] || annotation['xsd:documentation'] || annotation['documentation']
    if (doc) element.documentation = typeof doc === 'string' ? doc : doc['#text'] || String(doc)
  }
  
  // Parse inline complex type
  const complexType = node['xs:complexType'] || node['xsd:complexType'] || node['complexType']
  if (complexType) {
    const { children, attributes } = parseComplexTypeContent(complexType, customTypes)
    if (children.length > 0) element.children = children
    if (attributes.length > 0) element.attributes = attributes
    element.type = 'complexType'
  }
  
  // Parse inline simple type (for restrictions)
  const simpleType = node['xs:simpleType'] || node['xsd:simpleType'] || node['simpleType']
  if (simpleType) {
    const restriction = simpleType['xs:restriction'] || simpleType['xsd:restriction'] || simpleType['restriction']
    if (restriction) {
      element.type = normalizeType(restriction['@_base'])
    }
  }
  
  return element
}

function parseComplexTypeContent(
  complexType: any,
  customTypes: Map<string, any>
): { children: XSDElement[]; attributes: XSDAttribute[] } {
  const children: XSDElement[] = []
  
  // Parse sequence
  const sequence = complexType['xs:sequence'] || complexType['xsd:sequence'] || complexType['sequence']
  if (sequence) {
    const elements = ensureArray(sequence['xs:element'] || sequence['xsd:element'] || sequence['element'])
    for (const el of elements) {
      if (el) children.push(parseElementNode(el, customTypes))
    }
  }
  
  // Parse choice
  const choice = complexType['xs:choice'] || complexType['xsd:choice'] || complexType['choice']
  if (choice) {
    const elements = ensureArray(choice['xs:element'] || choice['xsd:element'] || choice['element'])
    for (const el of elements) {
      if (el) children.push(parseElementNode(el, customTypes))
    }
  }
  
  // Parse all
  const all = complexType['xs:all'] || complexType['xsd:all'] || complexType['all']
  if (all) {
    const elements = ensureArray(all['xs:element'] || all['xsd:element'] || all['element'])
    for (const el of elements) {
      if (el) children.push(parseElementNode(el, customTypes))
    }
  }
  
  // Parse attributes
  const attributes = parseAttributes(complexType)
  
  return { children, attributes }
}

function parseComplexTypes(schemaNode: any, customTypes: Map<string, any>): XSDComplexType[] {
  const complexTypes: XSDComplexType[] = []
  
  const ctNodes = ensureArray(
    schemaNode['xs:complexType'] || schemaNode['xsd:complexType'] || schemaNode['complexType']
  )
  
  for (const ct of ctNodes) {
    if (ct && ct['@_name']) {
      const { children, attributes } = parseComplexTypeContent(ct, customTypes)
      
      const complexType: XSDComplexType = {
        id: generateId(),
        name: ct['@_name'],
        elements: children,
        attributes: attributes,
      }
      
      // Parse documentation
      const annotation = ct['xs:annotation'] || ct['xsd:annotation'] || ct['annotation']
      if (annotation) {
        const doc = annotation['xs:documentation'] || annotation['xsd:documentation'] || annotation['documentation']
        if (doc) complexType.documentation = typeof doc === 'string' ? doc : doc['#text'] || String(doc)
      }
      
      complexTypes.push(complexType)
      customTypes.set(ct['@_name'], complexType)
    }
  }
  
  return complexTypes
}

function parseSimpleTypes(schemaNode: any): XSDSimpleType[] {
  const simpleTypes: XSDSimpleType[] = []
  
  const stNodes = ensureArray(
    schemaNode['xs:simpleType'] || schemaNode['xsd:simpleType'] || schemaNode['simpleType']
  )
  
  for (const st of stNodes) {
    if (st && st['@_name']) {
      const restriction = st['xs:restriction'] || st['xsd:restriction'] || st['restriction']
      
      const simpleType: XSDSimpleType = {
        id: generateId(),
        name: st['@_name'],
        base: normalizeType(restriction?.['@_base'] || 'xs:string'),
        restrictions: restriction ? parseRestrictions(restriction) : [],
      }
      
      // Parse documentation
      const annotation = st['xs:annotation'] || st['xsd:annotation'] || st['annotation']
      if (annotation) {
        const doc = annotation['xs:documentation'] || annotation['xsd:documentation'] || annotation['documentation']
        if (doc) simpleType.documentation = typeof doc === 'string' ? doc : doc['#text'] || String(doc)
      }
      
      simpleTypes.push(simpleType)
    }
  }
  
  return simpleTypes
}

function parseImports(schemaNode: any): XSDImport[] {
  const imports: XSDImport[] = []
  
  const importNodes = ensureArray(
    schemaNode['xs:import'] || schemaNode['xsd:import'] || schemaNode['import']
  )
  
  for (const imp of importNodes) {
    if (imp) {
      imports.push({
        id: generateId(),
        namespace: imp['@_namespace'] || '',
        schemaLocation: imp['@_schemaLocation'] || '',
      })
    }
  }
  
  return imports
}

function parseElements(schemaNode: any, customTypes: Map<string, any>): XSDElement[] {
  const elements: XSDElement[] = []
  
  const elNodes = ensureArray(
    schemaNode['xs:element'] || schemaNode['xsd:element'] || schemaNode['element']
  )
  
  for (const el of elNodes) {
    if (el) {
      elements.push(parseElementNode(el, customTypes))
    }
  }
  
  return elements
}

export function parseXSD(xsdString: string): ParseResult {
  const errors: Array<{ line?: number; message: string }> = []
  const warnings: Array<{ message: string }> = []
  
  if (!xsdString || typeof xsdString !== 'string' || xsdString.trim() === '') {
    return {
      schema: null,
      errors: [{ message: 'Empty or invalid XSD string provided' }],
      warnings: [],
    }
  }
  
  try {
    const parsed = parser.parse(xsdString)
    
    // Find schema root element with different namespace prefixes
    const schemaNode = parsed['xs:schema'] || parsed['xsd:schema'] || parsed['schema']
    
    if (!schemaNode) {
      return {
        schema: null,
        errors: [{ message: 'No xs:schema root element found' }],
        warnings: [],
      }
    }
    
    // Track custom types for reference resolution
    const customTypes = new Map<string, any>()
    
    // Parse all schema components
    const simpleTypes = parseSimpleTypes(schemaNode)
    const complexTypes = parseComplexTypes(schemaNode, customTypes)
    const imports = parseImports(schemaNode)
    const elements = parseElements(schemaNode, customTypes)
    
    // Parse schema-level documentation
    let documentation: string | undefined
    const annotation = schemaNode['xs:annotation'] || schemaNode['xsd:annotation'] || schemaNode['annotation']
    if (annotation) {
      const doc = annotation['xs:documentation'] || annotation['xsd:documentation'] || annotation['documentation']
      if (doc) documentation = typeof doc === 'string' ? doc : doc['#text'] || String(doc)
    }
    
    // Build the schema object
    const schema: XSDSchema = {
      id: generateId(),
      name: schemaNode['@_name'] || 'Imported Schema',
      targetNamespace: schemaNode['@_targetNamespace'],
      elements,
      complexTypes,
      simpleTypes,
      imports,
      documentation,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    // Add warnings for unsupported features
    if (schemaNode['xs:include'] || schemaNode['xsd:include']) {
      warnings.push({ message: 'xs:include elements are not fully supported' })
    }
    if (schemaNode['xs:redefine'] || schemaNode['xsd:redefine']) {
      warnings.push({ message: 'xs:redefine elements are not supported' })
    }
    if (schemaNode['xs:group'] || schemaNode['xsd:group']) {
      warnings.push({ message: 'xs:group elements are not fully supported' })
    }
    if (schemaNode['xs:attributeGroup'] || schemaNode['xsd:attributeGroup']) {
      warnings.push({ message: 'xs:attributeGroup elements are not fully supported' })
    }
    
    return { schema, errors, warnings }
  } catch (error: any) {
    return {
      schema: null,
      errors: [{ message: `Failed to parse XSD: ${error.message || 'Unknown error'}` }],
      warnings: [],
    }
  }
}
