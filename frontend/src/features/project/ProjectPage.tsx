import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, FileCode, Trash2, Download, ArrowLeft } from 'lucide-react'
import { useStore } from '../../lib/store'
import { generateXSDString } from '../../lib/xsd-utils'

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { projects, createSchema, deleteSchema } = useStore()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newSchemaName, setNewSchemaName] = useState('')

  const project = projects.find((p) => p.id === projectId)

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Project not found</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Back to Projects
        </button>
      </div>
    )
  }

  const handleCreateSchema = () => {
    if (newSchemaName.trim() && projectId) {
      createSchema(projectId, newSchemaName)
      setNewSchemaName('')
      setShowCreateModal(false)
    }
  }

  const handleExportSchema = (schemaId: string) => {
    const schema = project.schemas.find((s) => s.id === schemaId)
    if (schema) {
      const xsdString = generateXSDString(schema)
      const blob = new Blob([xsdString], { type: 'application/xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${schema.name}.xsd`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/')}
          className="text-gray-600 dark:text-gray-400 hover:text-primary-600"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{project.name}</h2>
          {project.description && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">{project.description}</p>
          )}
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-5 h-5" />
          <span>New Schema</span>
        </button>
      </div>

      {project.schemas.length === 0 ? (
        <div className="text-center py-12">
          <FileCode className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">No schemas yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Create Your First Schema
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {project.schemas.map((schema) => (
            <div
              key={schema.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {schema.name}
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleExportSchema(schema.id)}
                    className="text-gray-600 hover:text-primary-600"
                    title="Export XSD"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteSchema(projectId!, schema.id)}
                    className="text-gray-600 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="space-y-2 mb-4 text-sm text-gray-500">
                <div>Elements: {schema.elements.length}</div>
                <div>Complex Types: {schema.complexTypes.length}</div>
                <div>Simple Types: {schema.simpleTypes.length}</div>
              </div>
              <button
                onClick={() => navigate(`/schema/${projectId}/${schema.id}`)}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                Edit Schema
              </button>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Create New Schema
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Schema Name
                </label>
                <input
                  type="text"
                  value={newSchemaName}
                  onChange={(e) => setNewSchemaName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="my-schema"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewSchemaName('')
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSchema}
                  disabled={!newSchemaName.trim()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
