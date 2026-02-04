export interface XSDElement {
  id: string
  name: string
  type: string
  minOccurs?: string
  maxOccurs?: string
  documentation?: string
  attributes?: XSDAttribute[]
  children?: XSDElement[]
}

export interface XSDAttribute {
  id: string
  name: string
  type: string
  use?: 'required' | 'optional' | 'prohibited'
  default?: string
  fixed?: string
  documentation?: string
}

export interface XSDComplexType {
  id: string
  name: string
  elements: XSDElement[]
  attributes: XSDAttribute[]
  documentation?: string
}

export interface XSDSimpleType {
  id: string
  name: string
  base: string
  restrictions?: XSDRestriction[]
  documentation?: string
}

export interface XSDRestriction {
  type: 'minLength' | 'maxLength' | 'pattern' | 'enumeration' | 'minInclusive' | 'maxInclusive'
  value: string
}

export interface XSDSchema {
  id: string
  name: string
  targetNamespace?: string
  elements: XSDElement[]
  complexTypes: XSDComplexType[]
  simpleTypes: XSDSimpleType[]
  imports: XSDImport[]
  documentation?: string
  createdAt: Date
  updatedAt: Date
}

export interface XSDImport {
  id: string
  namespace: string
  schemaLocation: string
}

export interface XSDProject {
  id: string
  name: string
  description?: string
  schemas: XSDSchema[]
  createdAt: Date
  updatedAt: Date
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

export interface ValidationError {
  line?: number
  column?: number
  message: string
  path?: string
}

export interface AIGenerationRequest {
  context: string
  schemaId: string
  temperature?: number
}

export interface AIGenerationResult {
  xml: string
  success: boolean
  error?: string
}
