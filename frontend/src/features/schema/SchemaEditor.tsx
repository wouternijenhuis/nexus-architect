import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  Download,
  Sparkles,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { useStore, useCollaborationStore } from '../../lib/store'
import { generateXSDString, validateXMLAgainstXSD } from '../../lib/xsd-utils'
import { generateXMLSample } from '../../lib/azure-ai'
import { XSDElement, XSDComplexType, XSDSimpleType, XSDSchema } from '../../types/xsd'
import {
  joinSchemaRoom,
  leaveSchemaRoom,
  broadcastSchemaUpdate,
  onConnectionChange,
  onUserJoined,
  onUserLeft,
  onSchemaUpdated,
  getSocketId,
  isConnected,
} from '../../lib/websocket'
import ActiveUsers from '../../components/ActiveUsers'
import ConnectionStatus from '../../components/ConnectionStatus'

export default function SchemaEditor() {
  const { projectId, schemaId } = useParams<{ projectId: string; schemaId: string }>()
  const navigate = useNavigate()
  const { projects, updateSchema } = useStore()
  
  // Collaboration state
  const {
    activeUsers,
    isConnected: wsConnected,
    addUser,
    removeUser,
    setConnected,
    setCurrentRoom,
    clearCollaboration,
  } = useCollaborationStore()

  const project = projects.find((p) => p.id === projectId)
  const schema = project?.schemas.find((s) => s.id === schemaId)
  
  // Track if update came from remote to avoid echo
  const isRemoteUpdateRef = useRef(false)
  const lastLocalUpdateRef = useRef<string | null>(null)

  const [activeTab, setActiveTab] = useState<'elements' | 'complex' | 'simple' | 'preview' | 'validate'>('elements')
  const [xsdPreview, setXsdPreview] = useState('')
  const [xmlInput, setXmlInput] = useState('')
  const [validationResult, setValidationResult] = useState<any>(null)
  const [aiContext, setAiContext] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState('')

  // Join/leave schema room for collaboration
  useEffect(() => {
    if (!schemaId) return

    // Join the schema room
    const userId = getSocketId() || crypto.randomUUID()
    joinSchemaRoom(schemaId, userId)
    setCurrentRoom(schemaId)
    
    // Add self to active users
    addUser({
      id: userId,
      name: `User ${userId.slice(0, 4)}`,
    })

    // Cleanup on unmount or when schemaId changes
    return () => {
      leaveSchemaRoom(schemaId)
      clearCollaboration()
    }
  }, [schemaId, setCurrentRoom, addUser, clearCollaboration])

  // Subscribe to collaboration events
  useEffect(() => {
    const unsubConnection = onConnectionChange((connected) => {
      setConnected(connected)
    })

    const unsubUserJoined = onUserJoined((data) => {
      if (data.schemaId === schemaId) {
        addUser({
          id: data.userId,
          name: `User ${data.userId.slice(0, 4)}`,
        })
      }
    })

    const unsubUserLeft = onUserLeft((data) => {
      if (data.schemaId === schemaId) {
        removeUser(data.userId)
      }
    })

    const unsubSchemaUpdated = onSchemaUpdated((data) => {
      if (data.schemaId === schemaId && projectId) {
        // Skip if this is our own update echoed back
        const updateId = JSON.stringify(data.schema)
        if (updateId === lastLocalUpdateRef.current) {
          return
        }
        
        // Mark as remote update to avoid broadcasting back
        isRemoteUpdateRef.current = true
        updateSchema(projectId, data.schema)
        
        // Reset after a short delay
        setTimeout(() => {
          isRemoteUpdateRef.current = false
        }, 100)
      }
    })

    // Set initial connection state
    setConnected(isConnected())

    return () => {
      unsubConnection()
      unsubUserJoined()
      unsubUserLeft()
      unsubSchemaUpdated()
    }
  }, [schemaId, projectId, addUser, removeUser, setConnected, updateSchema])

  useEffect(() => {
    if (schema) {
      setXsdPreview(generateXSDString(schema))
    }
  }, [schema])

  if (!project || !schema) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Schema not found</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Back to Projects
        </button>
      </div>
    )
  }

  // Helper to update schema locally and broadcast to other users
  const updateSchemaWithBroadcast = useCallback((updatedSchema: XSDSchema) => {
    if (!projectId || !schemaId) return
    
    // Update local state
    updateSchema(projectId, updatedSchema)
    
    // Only broadcast if this is a local change, not a remote update
    if (!isRemoteUpdateRef.current) {
      lastLocalUpdateRef.current = JSON.stringify(updatedSchema)
      broadcastSchemaUpdate(schemaId, updatedSchema)
    }
  }, [projectId, schemaId, updateSchema])

  const handleAddElement = () => {
    const newElement: XSDElement = {
      id: crypto.randomUUID(),
      name: 'newElement',
      type: 'xs:string',
      minOccurs: '1',
      maxOccurs: '1',
    }
    const updatedSchema = {
      ...schema,
      elements: [...schema.elements, newElement],
    }
    updateSchemaWithBroadcast(updatedSchema)
  }

  const handleAddComplexType = () => {
    const newComplexType: XSDComplexType = {
      id: crypto.randomUUID(),
      name: 'NewComplexType',
      elements: [],
      attributes: [],
    }
    const updatedSchema = {
      ...schema,
      complexTypes: [...schema.complexTypes, newComplexType],
    }
    updateSchemaWithBroadcast(updatedSchema)
  }

  const handleAddSimpleType = () => {
    const newSimpleType: XSDSimpleType = {
      id: crypto.randomUUID(),
      name: 'NewSimpleType',
      base: 'xs:string',
      restrictions: [],
    }
    const updatedSchema = {
      ...schema,
      simpleTypes: [...schema.simpleTypes, newSimpleType],
    }
    updateSchemaWithBroadcast(updatedSchema)
  }

  const handleExportXSD = () => {
    const blob = new Blob([xsdPreview], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${schema.name}.xsd`
    a.click()
    // Delay revocation to ensure download completes
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }

  const [errorMessage, setErrorMessage] = useState('')

  const handleValidateXML = () => {
    const result = validateXMLAgainstXSD(xmlInput, xsdPreview)
    setValidationResult(result)
  }

  const handleGenerateAI = async () => {
    setErrorMessage('')
    setAiLoading(true)
    const result = await generateXMLSample(schema, {
      context: aiContext,
      schemaId: schema.id,
    })
    setAiLoading(false)

    if (result.success) {
      setAiResult(result.xml)
    } else {
      setErrorMessage(result.error || 'Failed to generate XML')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(`/project/${projectId}`)}
          className="text-gray-600 dark:text-gray-400 hover:text-primary-600"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{schema.name}</h2>
          <p className="text-gray-600 dark:text-gray-400">{project.name}</p>
        </div>
        
        {/* Collaboration Status */}
        <div className="flex items-center gap-4">
          <ConnectionStatus isConnected={wsConnected} showLabel={false} />
          <ActiveUsers users={activeUsers} />
        </div>
        
        <button
          onClick={handleExportXSD}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Download className="w-5 h-5" />
          <span>Export XSD</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'elements', label: 'Elements' },
              { id: 'complex', label: 'Complex Types' },
              { id: 'simple', label: 'Simple Types' },
              { id: 'preview', label: 'XSD Preview' },
              { id: 'validate', label: 'Validate XML' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'elements' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Root Elements
                </h3>
                <button
                  onClick={handleAddElement}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Element</span>
                </button>
              </div>
              {schema.elements.length === 0 ? (
                <p className="text-gray-500">No elements defined yet</p>
              ) : (
                <div className="space-y-2">
                  {schema.elements.map((element) => (
                    <div
                      key={element.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono text-sm text-gray-900 dark:text-white">
                            {element.name}
                          </span>
                          <span className="ml-2 text-sm text-gray-500">: {element.type}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {element.minOccurs}..{element.maxOccurs}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'complex' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Complex Types
                </h3>
                <button
                  onClick={handleAddComplexType}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Complex Type</span>
                </button>
              </div>
              {schema.complexTypes.length === 0 ? (
                <p className="text-gray-500">No complex types defined yet</p>
              ) : (
                <div className="space-y-2">
                  {schema.complexTypes.map((complexType) => (
                    <div
                      key={complexType.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="font-mono text-sm text-gray-900 dark:text-white">
                        {complexType.name}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        {complexType.elements.length} elements, {complexType.attributes.length}{' '}
                        attributes
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'simple' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Simple Types
                </h3>
                <button
                  onClick={handleAddSimpleType}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Simple Type</span>
                </button>
              </div>
              {schema.simpleTypes.length === 0 ? (
                <p className="text-gray-500">No simple types defined yet</p>
              ) : (
                <div className="space-y-2">
                  {schema.simpleTypes.map((simpleType) => (
                    <div
                      key={simpleType.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex justify-between">
                        <span className="font-mono text-sm text-gray-900 dark:text-white">
                          {simpleType.name}
                        </span>
                        <span className="text-xs text-gray-500">base: {simpleType.base}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  XSD Preview
                </h3>
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={aiContext}
                    onChange={(e) => setAiContext(e.target.value)}
                    placeholder="Describe the data context..."
                    className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <button
                    onClick={handleGenerateAI}
                    disabled={aiLoading}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>{aiLoading ? 'Generating...' : 'Generate Sample'}</span>
                  </button>
                </div>
              </div>
              {errorMessage && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-800 dark:text-red-200 text-sm">{errorMessage}</p>
                </div>
              )}
              <pre className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-x-auto text-sm">
                <code className="text-gray-900 dark:text-gray-100">{xsdPreview}</code>
              </pre>
              {aiResult && (
                <div className="mt-4">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-2">
                    AI Generated XML Sample
                  </h4>
                  <pre className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg overflow-x-auto text-sm">
                    <code className="text-gray-900 dark:text-gray-100">{aiResult}</code>
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeTab === 'validate' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Validate XML
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Paste your XML here
                </label>
                <textarea
                  value={xmlInput}
                  onChange={(e) => setXmlInput(e.target.value)}
                  className="w-full h-48 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="<root>...</root>"
                />
              </div>
              <button
                onClick={handleValidateXML}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Validate
              </button>
              {validationResult && (
                <div
                  className={`p-4 rounded-lg ${
                    validationResult.valid
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : 'bg-red-50 dark:bg-red-900/20'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {validationResult.valid ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-green-800 dark:text-green-200 font-medium">
                          Valid XML
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span className="text-red-800 dark:text-red-200 font-medium">
                          Invalid XML
                        </span>
                      </>
                    )}
                  </div>
                  {validationResult.errors.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {validationResult.errors.map((error: any, idx: number) => (
                        <div key={idx} className="text-sm text-red-700 dark:text-red-300">
                          {error.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
