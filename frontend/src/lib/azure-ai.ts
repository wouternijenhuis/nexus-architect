import { AIGenerationRequest, AIGenerationResult, XSDSchema } from '../types/xsd'
import { generateXSDString } from './xsd-utils'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export async function generateXMLSample(
  schema: XSDSchema,
  request: AIGenerationRequest
): Promise<AIGenerationResult> {
  try {
    const xsdString = generateXSDString(schema)
    
    const response = await fetch(`${API_URL}/api/generate-xml`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        xsdString,
        context: request.context,
        temperature: request.temperature || 0.7,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return {
        xml: '',
        success: false,
        error: error.error || 'Failed to generate XML sample',
      }
    }

    const result = await response.json()
    return result
  } catch (error: any) {
    return {
      xml: '',
      success: false,
      error: error.message || 'Failed to connect to server',
    }
  }
}

export function isAzureAIConfigured(): boolean {
  // This would need to be checked via an API call to the backend
  // For now, we assume it's configured if the backend is running
  return true
}
