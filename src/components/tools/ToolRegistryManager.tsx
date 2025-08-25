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
  Settings, 
  Star, 
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { toolRegistry, Tool, ToolCategory } from '@/lib/tool-registry'

interface ToolFormData {
  id: string
  name: string
  description: string
  category: ToolCategory
  icon: string
  path: string
  tags: string
  version: string
  isFavorite: boolean
  isEnabled: boolean
}

const ToolRegistryManager = () => {
  const [tools, setTools] = useState<Tool[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTool, setEditingTool] = useState<Tool | null>(null)
  const [formData, setFormData] = useState<ToolFormData>({
    id: '',
    name: '',
    description: '',
    category: ToolCategory.UTILITIES,
    icon: 'Tool',
    path: '',
    tags: '',
    version: '1.0.0',
    isFavorite: false,
    isEnabled: true
  })
  const [errors, setErrors] = useState<string[]>([])
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    loadTools()
  }, [])

  const loadTools = () => {
    setTools(toolRegistry.getAll())
    setIsLoading(false)
  }

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      description: '',
      category: ToolCategory.UTILITIES,
      icon: 'Tool',
      path: '',
      tags: '',
      version: '1.0.0',
      isFavorite: false,
      isEnabled: true
    })
    setErrors([])
    setSuccessMessage('')
  }

  const handleInputChange = (field: keyof ToolFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Auto-generate path from ID
    if (field === 'id' && typeof value === 'string') {
      setFormData(prev => ({
        ...prev,
        path: `/tools/${value}`
      }))
    }
  }

  const handleAddTool = () => {
    setShowAddForm(true)
    setEditingTool(null)
    resetForm()
  }

  const handleEditTool = (tool: Tool) => {
    setEditingTool(tool)
    setShowAddForm(true)
    setFormData({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      category: tool.category,
      icon: tool.icon,
      path: tool.path,
      tags: tool.tags.join(', '),
      version: tool.version,
      isFavorite: tool.isFavorite,
      isEnabled: tool.isEnabled ?? true
    })
    setErrors([])
    setSuccessMessage('')
  }

  const handleSaveTool = () => {
    const toolData = {
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    }

    let result
    if (editingTool) {
      result = toolRegistry.updateTool(editingTool.id, toolData)
    } else {
      result = toolRegistry.addTool(toolData)
    }

    if (result.success) {
      setSuccessMessage(editingTool ? 'Tool updated successfully!' : 'Tool added successfully!')
      setShowAddForm(false)
      setEditingTool(null)
      resetForm()
      loadTools()
      setTimeout(() => setSuccessMessage(''), 3000)
    } else {
      setErrors(result.errors)
    }
  }

  const handleDeleteTool = (tool: Tool) => {
    if (confirm(`Are you sure you want to delete "${tool.name}"? This action cannot be undone.`)) {
      const success = toolRegistry.removeTool(tool.id)
      if (success) {
        setSuccessMessage('Tool deleted successfully!')
        loadTools()
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    }
  }

  const handleToggleFavorite = (tool: Tool) => {
    toolRegistry.toggleFavorite(tool.id)
    loadTools()
  }

  const formatLastUsed = (date: Date | null) => {
    if (!date) return 'Never used'
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const categories = Object.values(ToolCategory)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Settings className="w-8 h-8 text-indigo-600" />
                <h1 className="text-3xl font-bold text-gray-900">Tool Registry Manager</h1>
              </div>
              <p className="text-gray-600 max-w-2xl">
                Manage your tool collection. Add new tools, edit existing ones, and configure tool settings.
              </p>
            </div>
            <button
              onClick={handleAddTool}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Tool
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800">
            <CheckCircle className="w-5 h-5" />
            {successMessage}
          </div>
        )}

        {/* Add/Edit Tool Form */}
        {showAddForm && (
          <div className="mb-8 bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingTool ? 'Edit Tool' : 'Add New Tool'}
              </h2>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setEditingTool(null)
                  resetForm()
                }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Messages */}
            {errors.length > 0 && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800 mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Please fix the following errors:</span>
                </div>
                <ul className="list-disc list-inside text-red-700 text-sm">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tool ID *
                </label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => handleInputChange('id', e.target.value)}
                  placeholder="e.g., json-formatter"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  disabled={!!editingTool}
                />
                <p className="text-xs text-gray-500 mt-1">URL-safe slug (lowercase, hyphen-separated)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tool Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., JSON Formatter"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of what this tool does..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon *
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => handleInputChange('icon', e.target.value)}
                  placeholder="e.g., FileText, Settings, Tool"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Lucide icon name</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Path *
                </label>
                <input
                  type="text"
                  value={formData.path}
                  onChange={(e) => handleInputChange('path', e.target.value)}
                  placeholder="/tools/tool-id"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Version *
                </label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => handleInputChange('version', e.target.value)}
                  placeholder="1.0.0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  placeholder="formatting, json, utility (comma-separated)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="md:col-span-2 flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isFavorite}
                    onChange={(e) => handleInputChange('isFavorite', e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Mark as favorite</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isEnabled}
                    onChange={(e) => handleInputChange('isEnabled', e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Enabled</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setEditingTool(null)
                  resetForm()
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTool}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                {editingTool ? 'Update Tool' : 'Add Tool'}
              </button>
            </div>
          </div>
        )}

        {/* Tools List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Registered Tools ({tools.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
              <p className="text-gray-500">Loading tools...</p>
            </div>
          ) : tools.length === 0 ? (
            <div className="p-8 text-center">
              <Settings className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tools registered</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first tool.</p>
              <button
                onClick={handleAddTool}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Tool
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {tools.map((tool) => (
                <div key={tool.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">{tool.name}</h3>
                          {tool.isFavorite && (
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          )}
                          {!tool.isEnabled && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                              Disabled
                            </span>
                          )}
                        </div>
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-md capitalize">
                          {tool.category}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{tool.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>ID: {tool.id}</span>
                        <span>Path: {tool.path}</span>
                        <span>Version: {tool.version}</span>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatLastUsed(tool.lastUsed)}
                        </div>
                        <span>Used {tool.usageCount} times</span>
                      </div>
                      
                      {tool.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {tool.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleToggleFavorite(tool)}
                        className={`p-2 rounded-lg transition-colors ${
                          tool.isFavorite
                            ? 'text-yellow-600 hover:bg-yellow-50'
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                        title={tool.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Star className={`w-4 h-4 ${tool.isFavorite ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleEditTool(tool)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit tool"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTool(tool)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete tool"
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

export default ToolRegistryManager