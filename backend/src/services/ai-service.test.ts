import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @azure/openai
const mockGetChatCompletions = vi.fn()

function createOpenAIMock() {
  return {
    OpenAIClient: class MockOpenAIClient {
      getChatCompletions = mockGetChatCompletions
      constructor(_endpoint: string, _credential: any) {}
    },
    AzureKeyCredential: class MockAzureKeyCredential {
      key: string
      constructor(key: string) { this.key = key }
    },
  }
}

vi.mock('@azure/openai', () => createOpenAIMock())

// Mock cache-service
const mockCacheGet = vi.fn()
const mockCacheSet = vi.fn()

function createCacheMock(keyOverride?: string) {
  return {
    aiCache: {
      get: (...args: any[]) => mockCacheGet(...args),
      set: (...args: any[]) => mockCacheSet(...args),
    },
    generateAICacheKey: keyOverride
      ? vi.fn().mockReturnValue(keyOverride)
      : vi.fn().mockImplementation(
          (xsd: string, ctx: string, temp: number) => `ai:${xsd}:${ctx}:${temp}`
        ),
  }
}

vi.mock('./cache-service.js', () => createCacheMock())

describe('AI Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockCacheGet.mockReset()
    mockCacheSet.mockReset()
    mockGetChatCompletions.mockReset()
  })

  describe('isAzureAIConfigured', () => {
    it('should return false when env vars are not set', async () => {
      const { isAzureAIConfigured } = await import('./ai-service.js')
      expect(isAzureAIConfigured()).toBe(false)
    })
  })

  describe('initializeAzureAI', () => {
    it('should log message when credentials are not configured', async () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const { initializeAzureAI } = await import('./ai-service.js')
      initializeAzureAI()
      expect(spy).toHaveBeenCalled()
    })
  })

  describe('generateXMLSample', () => {
    it('should return error when client is not initialized', async () => {
      const { generateXMLSample } = await import('./ai-service.js')

      const result = await generateXMLSample('<schema/>', 'test', 0.7)

      expect(result.success).toBe(false)
      expect(result.xml).toBe('')
      expect(result.error).toContain('not initialized')
    })

    it('should return cached result when available', async () => {
      const originalEndpoint = process.env.AZURE_OPENAI_ENDPOINT
      const originalKey = process.env.AZURE_OPENAI_API_KEY
      process.env.AZURE_OPENAI_ENDPOINT = 'https://test.openai.azure.com'
      process.env.AZURE_OPENAI_API_KEY = 'test-key'

      vi.resetModules()
      vi.doMock('@azure/openai', () => createOpenAIMock())
      vi.doMock('./cache-service.js', () => createCacheMock('ai:test-key'))

      const { initializeAzureAI, generateXMLSample } = await import('./ai-service.js')
      vi.spyOn(console, 'log').mockImplementation(() => {})
      initializeAzureAI()

      mockCacheGet.mockReturnValue({ xml: '<cached/>', success: true })

      const result = await generateXMLSample('<schema/>', 'test', 0.7)

      expect(result.xml).toBe('<cached/>')
      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
      expect(mockGetChatCompletions).not.toHaveBeenCalled()

      process.env.AZURE_OPENAI_ENDPOINT = originalEndpoint
      process.env.AZURE_OPENAI_API_KEY = originalKey
    })

    it('should call OpenAI and return cleaned XML on success', async () => {
      const originalEndpoint = process.env.AZURE_OPENAI_ENDPOINT
      const originalKey = process.env.AZURE_OPENAI_API_KEY
      process.env.AZURE_OPENAI_ENDPOINT = 'https://test.openai.azure.com'
      process.env.AZURE_OPENAI_API_KEY = 'test-key-2'

      vi.resetModules()
      vi.doMock('@azure/openai', () => createOpenAIMock())
      vi.doMock('./cache-service.js', () => createCacheMock('ai:test-key-2'))

      const { initializeAzureAI, generateXMLSample } = await import('./ai-service.js')
      vi.spyOn(console, 'log').mockImplementation(() => {})
      initializeAzureAI()

      mockCacheGet.mockReturnValue(undefined)
      mockGetChatCompletions.mockResolvedValue({
        choices: [{ message: { content: '<root><item>test</item></root>' } }],
      })

      const result = await generateXMLSample('<schema/>', 'generate items', 0.5)

      expect(result.success).toBe(true)
      expect(result.xml).toBe('<root><item>test</item></root>')
      expect(mockCacheSet).toHaveBeenCalled()

      process.env.AZURE_OPENAI_ENDPOINT = originalEndpoint
      process.env.AZURE_OPENAI_API_KEY = originalKey
    })

    it('should handle API errors gracefully', async () => {
      const originalEndpoint = process.env.AZURE_OPENAI_ENDPOINT
      const originalKey = process.env.AZURE_OPENAI_API_KEY
      process.env.AZURE_OPENAI_ENDPOINT = 'https://test.openai.azure.com'
      process.env.AZURE_OPENAI_API_KEY = 'test-key-3'

      vi.resetModules()
      vi.doMock('@azure/openai', () => createOpenAIMock())
      vi.doMock('./cache-service.js', () => createCacheMock('ai:test-key-3'))

      const { initializeAzureAI, generateXMLSample } = await import('./ai-service.js')
      vi.spyOn(console, 'log').mockImplementation(() => {})
      vi.spyOn(console, 'error').mockImplementation(() => {})
      initializeAzureAI()

      mockCacheGet.mockReturnValue(undefined)
      mockGetChatCompletions.mockRejectedValue(new Error('API rate limit exceeded'))

      const result = await generateXMLSample('<schema/>', 'test', 0.7)

      expect(result.success).toBe(false)
      expect(result.xml).toBe('')
      expect(result.error).toBe('API rate limit exceeded')

      process.env.AZURE_OPENAI_ENDPOINT = originalEndpoint
      process.env.AZURE_OPENAI_API_KEY = originalKey
    })

    it('should strip generic code fences from response', async () => {
      const originalEndpoint = process.env.AZURE_OPENAI_ENDPOINT
      const originalKey = process.env.AZURE_OPENAI_API_KEY
      process.env.AZURE_OPENAI_ENDPOINT = 'https://test.openai.azure.com'
      process.env.AZURE_OPENAI_API_KEY = 'test-key-4'

      vi.resetModules()
      vi.doMock('@azure/openai', () => createOpenAIMock())
      vi.doMock('./cache-service.js', () => createCacheMock('ai:test-key-4'))

      const { initializeAzureAI, generateXMLSample } = await import('./ai-service.js')
      vi.spyOn(console, 'log').mockImplementation(() => {})
      initializeAzureAI()

      mockCacheGet.mockReturnValue(undefined)
      mockGetChatCompletions.mockResolvedValue({
        choices: [{ message: { content: '<data>value</data>' } }],
      })

      const result = await generateXMLSample('<schema/>', 'test', 0.7)

      expect(result.success).toBe(true)
      expect(result.xml).toBe('<data>value</data>')

      process.env.AZURE_OPENAI_ENDPOINT = originalEndpoint
      process.env.AZURE_OPENAI_API_KEY = originalKey
    })
  })
})
