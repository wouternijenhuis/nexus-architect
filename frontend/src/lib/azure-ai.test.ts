import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateXMLSample, isAzureAIConfigured } from './azure-ai'
import type { XSDSchema, AIGenerationRequest } from '../types/xsd'

const mockSchema: XSDSchema = {
  id: 'test-schema',
  name: 'TestSchema',
  elements: [{ id: 'e1', name: 'root', type: 'xs:string' }],
  complexTypes: [],
  simpleTypes: [],
  imports: [],
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockRequest: AIGenerationRequest = {
  context: 'Generate a sample XML',
  schemaId: 'test-schema',
  temperature: 0.7,
}

describe('generateXMLSample', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns result on successful response', async () => {
    const mockResult = { xml: '<root>test</root>', success: true }
    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResult),
    })

    const result = await generateXMLSample(mockSchema, mockRequest)
    expect(result).toEqual(mockResult)
    expect(fetch).toHaveBeenCalledTimes(1)
    
    const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(callArgs[0]).toContain('/api/generate-xml')
    expect(callArgs[1].method).toBe('POST')
    expect(callArgs[1].headers['Content-Type']).toBe('application/json')
    
    const body = JSON.parse(callArgs[1].body)
    expect(body.context).toBe('Generate a sample XML')
    expect(body.temperature).toBe(0.7)
    expect(body.xsdString).toBeTruthy()
  })

  it('uses default temperature when not provided', async () => {
    const mockResult = { xml: '<root/>', success: true }
    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResult),
    })

    const requestNoTemp: AIGenerationRequest = {
      context: 'test',
      schemaId: 'test-schema',
    }

    await generateXMLSample(mockSchema, requestNoTemp)
    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body)
    expect(body.temperature).toBe(0.7)
  })

  it('returns error on non-ok response', async () => {
    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Server error occurred' }),
    })

    const result = await generateXMLSample(mockSchema, mockRequest)
    expect(result.success).toBe(false)
    expect(result.xml).toBe('')
    expect(result.error).toBe('Server error occurred')
  })

  it('returns fallback error message when server provides no error detail', async () => {
    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    })

    const result = await generateXMLSample(mockSchema, mockRequest)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Failed to generate XML sample')
  })

  it('returns error when fetch throws', async () => {
    ;(fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network failure'))

    const result = await generateXMLSample(mockSchema, mockRequest)
    expect(result.success).toBe(false)
    expect(result.xml).toBe('')
    expect(result.error).toBe('Network failure')
  })

  it('returns fallback error when fetch throws non-Error', async () => {
    ;(fetch as ReturnType<typeof vi.fn>).mockRejectedValue('unknown error')

    const result = await generateXMLSample(mockSchema, mockRequest)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Failed to connect to server')
  })
})

describe('isAzureAIConfigured', () => {
  it('returns true', () => {
    expect(isAzureAIConfigured()).toBe(true)
  })
})
