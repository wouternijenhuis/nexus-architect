import { OpenAIClient, AzureKeyCredential } from '@azure/openai'
import { AIGenerationRequest, AIGenerationResult, XSDSchema } from '../types/xsd'
import { generateXSDString } from './xsd-utils'

// These would typically come from environment variables
const endpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT || ''
const apiKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY || ''
const deploymentName = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT || 'gpt-4'

let client: OpenAIClient | null = null

export function initializeAzureAI() {
  if (endpoint && apiKey) {
    client = new OpenAIClient(endpoint, new AzureKeyCredential(apiKey))
  }
}

export async function generateXMLSample(
  schema: XSDSchema,
  request: AIGenerationRequest
): Promise<AIGenerationResult> {
  if (!client) {
    return {
      xml: '',
      success: false,
      error: 'Azure OpenAI client not initialized. Please configure your API credentials.',
    }
  }

  try {
    const xsdString = generateXSDString(schema)
    
    const messages = [
      {
        role: 'system' as const,
        content: 'You are an XML expert. Generate valid XML samples based on XSD schemas and user context.',
      },
      {
        role: 'user' as const,
        content: `Given this XSD schema:\n\n${xsdString}\n\nAnd this context: ${request.context}\n\nGenerate a valid XML sample that conforms to the schema. Only output the XML, no explanations.`,
      },
    ]

    const result = await client.getChatCompletions(
      deploymentName,
      messages,
      {
        temperature: request.temperature || 0.7,
        maxTokens: 2000,
      }
    )

    const xmlContent = result.choices[0]?.message?.content?.trim() || ''

    // Clean up markdown code blocks if present
    let cleanedXML = xmlContent
    if (cleanedXML.startsWith('```xml')) {
      cleanedXML = cleanedXML.replace(/```xml\n?/g, '').replace(/```\n?$/g, '')
    } else if (cleanedXML.startsWith('```')) {
      cleanedXML = cleanedXML.replace(/```\n?/g, '').replace(/```\n?$/g, '')
    }

    return {
      xml: cleanedXML,
      success: true,
    }
  } catch (error: any) {
    return {
      xml: '',
      success: false,
      error: error.message || 'Failed to generate XML sample',
    }
  }
}

export function isAzureAIConfigured(): boolean {
  return !!(endpoint && apiKey)
}
