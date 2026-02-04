import { OpenAIClient, AzureKeyCredential } from '@azure/openai'

const endpoint = process.env.AZURE_OPENAI_ENDPOINT || ''
const apiKey = process.env.AZURE_OPENAI_API_KEY || ''
const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4'

let client: OpenAIClient | null = null

export function initializeAzureAI() {
  if (endpoint && apiKey) {
    client = new OpenAIClient(endpoint, new AzureKeyCredential(apiKey))
    console.log('Azure OpenAI client initialized')
  } else {
    console.log('Azure OpenAI credentials not configured')
  }
}

export async function generateXMLSample(
  xsdString: string,
  context: string,
  temperature = 0.7
): Promise<{ xml: string; success: boolean; error?: string }> {
  if (!client) {
    return {
      xml: '',
      success: false,
      error: 'Azure OpenAI client not initialized. Please configure your API credentials on the server.',
    }
  }

  try {
    const messages = [
      {
        role: 'system' as const,
        content: 'You are an XML expert. Generate valid XML samples based on XSD schemas and user context.',
      },
      {
        role: 'user' as const,
        content: `Given this XSD schema:\n\n${xsdString}\n\nAnd this context: ${context}\n\nGenerate a valid XML sample that conforms to the schema. Only output the XML, no explanations.`,
      },
    ]

    const result = await client.getChatCompletions(deploymentName, messages, {
      temperature,
      maxTokens: 2000,
    })

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
    console.error('AI generation error:', error)
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
