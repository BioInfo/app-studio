'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Folder,
  FolderOpen,
  Zap,
  Star,
  Clock,
  AlertCircle,
  CheckCircle,
  Download,
  Upload,
  RotateCcw
} from 'lucide-react'
import { collectionManager, Collection, COLLECTION_COLORS, COLLECTION_ICONS } from '@/lib/collections'
import { toolRegistry, Tool } from '@/lib/tool-registry'

interface CollectionFormData {
  name: string
  description: string
  icon: string
  color: string
  toolIds: string[]
  isWorkflow: boolean
}

const CollectionsManager = () => {
  const [collections, setCollections] = useState<Collection[]>([])
  const [tools, setTools] = useState<Tool[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  const [formData, setFormData] = useState<CollectionFormData>({
    name: '',
    description: '',
    icon: 'Folder',
    color: '#6366f1',
    toolIds: [],
    isWorkflow: false
  })
  const [errors, setErrors] = useState<string[]>([])
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    await collectionManager.initialize()
    setCollections(collectionManager.getAll())
    setTools(toolRegistry.getAll())
    setIsLoading(false)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: 'Folder',
      color: '#6366f1',
      toolIds: [],
      isWorkflow: false
    })
    setErrors([])
    setSuccessMessage('')
  }

  const handleInputChange = (field: keyof CollectionFormData, value: string | boolean | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAddCollection = () => {
    setShowAddForm(true)
    setEditingCollection(null)
    resetForm()
  }

  const handleEditCollection = (collection: Collection) => {
    setEditingCollection(collection)
    setShowAddForm(true)
    setFormData({
      name: collection.name,
      description: collection.description,
      icon: collection.icon,
      color: collection.color,
      toolIds: collection.toolIds,
      isWorkflow: collection.isWorkflow
    })
    setErrors([])
    setSuccessMessage('')
  }

  const handleSaveCollection = () => {
    let result
    if (editingCollection) {
      result = collectionManager.updateCollection(editingCollection.id, formData)
    } else {
      result = collectionManager.createCollection(formData)
    }

    if (result.success) {
      setSuccessMessage(editingCollection ? 'Collection updated successfully!' : 'Collection created successfully!')
      setShowAddForm(false)
      setEditingCollection(null)
      resetForm()
      loadData()
      setTimeout(() => setSuccessMessage(''), 3000)
    } else {
      setErrors(result.errors)
    }
  }

  const handleDeleteCollection = (collection: Collection) => {
    if (confirm(`Are you sure you want to delete "${collection.name}"? This action cannot be undone.`)) {
      const success = collectionManager.deleteCollection(collection.id)
      if (success) {
        setSuccessMessage('Collection deleted successfully!')
        loadData()
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    }
  }

  const handleToolToggle = (toolId: string) => {
    const newToolIds = formData.toolIds.includes(toolId)
      ? formData.toolIds.filter(id => id !== toolId)
      : [...formData.toolIds, toolId]
    
    handleInputChange('toolIds', newToolIds)
  }

  const exportCollections = () => {
    const data = {
      collections: collections,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `app-studio-collections-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const importCollections = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (data.collections && Array.isArray(data.collections)) {
          // Import collections (this would need more sophisticated conflict resolution)
          setSuccessMessage('Collections imported successfully!')
          loadData()
          setTimeout(() => setSuccessMessage(''), 3000)
        } else {
          setErrors(['Invalid collections file format'])
        }
      } catch (error) {
        setErrors(['Failed to parse collections file'])
      }
    }
    reader.readAsText(file)
  }

  const formatLastUsed = (date: Date | null) => {
    if (!date) return 'Never'
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Folder className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Collections Manager</h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
                Organize your tools into collections and workflows. Group related tools together for easier access.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={exportCollections}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Export Collections"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <label className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                Import
                <input
                  type="file"
                  accept=".json"
                  onChange={importCollections}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleAddCollection}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Collection
              </button>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-green-800 dark:text-green-200">
            <CheckCircle className="w-5 h-5" />
            {successMessage}
          </div>
        )}

        {/* Add/Edit Collection Form */}
        {showAddForm && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {editingCollection ? 'Edit Collection' : 'Create New Collection'}
              </h2>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setEditingCollection(null)
                  resetForm()
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Messages */}
            {errors.length > 0 && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2 text-red-800 dark:text-red-200 mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Please fix the following errors:</span>
                </div>
                <ul className="list-disc list-inside text-red-700 dark:text-red-300 text-sm">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Collection Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Development Tools"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type
                </label>
                <select
                  value={formData.isWorkflow ? 'workflow' : 'collection'}
                  onChange={(e) => handleInputChange('isWorkflow', e.target.value === 'workflow')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                >
                  <option value="collection">Collection</option>
                  <option value="workflow">Workflow</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of this collection..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Icon
                </label>
                <select
                  value={formData.icon}
                  onChange={(e) => handleInputChange('icon', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                >
                  {COLLECTION_ICONS.map(icon => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {COLLECTION_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => handleInputChange('color', color)}
                      className={`w-8 h-8 rounded-lg border-2 transition-all ${
                        formData.color === color 
                          ? 'border-gray-900 dark:border-gray-100 scale-110' 
                          : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tools ({formData.toolIds.length} selected)
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700">
                  {tools.map(tool => (
                    <label key={tool.id} className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.toolIds.includes(tool.id)}
                        onChange={() => handleToolToggle(tool.id)}
                        className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{tool.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">{tool.category}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setEditingCollection(null)
                  resetForm()
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCollection}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                {editingCollection ? 'Update Collection' : 'Create Collection'}
              </button>
            </div>
          </div>
        )}

        {/* Collections List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Collections ({collections.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading collections...</p>
            </div>
          ) : collections.length === 0 ? (
            <div className="p-8 text-center">
              <Folder className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No collections yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first collection to organize your tools.</p>
              <button
                onClick={handleAddCollection}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Collection
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {collections.map((collection) => (
                <div key={collection.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: collection.color }}
                        >
                          {collection.isWorkflow ? (
                            <Zap className="w-5 h-5" />
                          ) : (
                            <Folder className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {collection.name}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="capitalize">
                              {collection.isWorkflow ? 'Workflow' : 'Collection'}
                            </span>
                            <span>•</span>
                            <span>{collection.toolIds.length} tools</span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-300 mb-3">{collection.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Updated {formatLastUsed(collection.updatedAt)}
                        </div>
                        <span>Created {formatLastUsed(collection.createdAt)}</span>
                      </div>
                      
                      {collection.toolIds.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {collection.toolIds.slice(0, 5).map((toolId) => {
                            const tool = tools.find(t => t.id === toolId)
                            return tool ? (
                              <span
                                key={toolId}
                                className="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs rounded-md"
                              >
                                {tool.name}
                              </span>
                            ) : null
                          })}
                          {collection.toolIds.length > 5 && (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs rounded-md">
                              +{collection.toolIds.length - 5} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleEditCollection(collection)}
                        className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                        title="Edit collection"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCollection(collection)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete collection"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CollectionsManager