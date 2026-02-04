import { describe, it, expect } from 'vitest'
import { generateXSDString } from '../lib/xsd-utils'
import { XSDSchema } from '../types/xsd'

describe('XSD Utils', () => {
  it('should generate basic XSD string', () => {
    const schema: XSDSchema = {
      id: '1',
      name: 'test-schema',
      elements: [
        {
          id: '1',
          name: 'testElement',
          type: 'xs:string',
        },
      ],
      complexTypes: [],
      simpleTypes: [],
      imports: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const xsd = generateXSDString(schema)
    expect(xsd).toContain('xs:schema')
    expect(xsd).toContain('testElement')
  })
})
