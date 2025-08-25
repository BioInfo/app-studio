'use client'

import React, { useState } from 'react'
import { 
  Download, 
  Upload, 
  Package, 
  AlertCircle, 
  CheckCircle, 
  X, 
  FileText,
  Share2,
  Settings
} from 'lucide-react'
import { toolRegistry } from '@/lib/tool-registry'
import { collectionManager } from '@/lib/collections'
import { ToolImportExport, ToolPackage, ImportResult } from '@/lib/tool-import-export'
import { usePreferences } from '@/contexts/PreferencesContext'

interface ImportExportManagerProps {
  isOpen: boolean
  onClose: () => void
}

export function ImportExportManager({ isOpen, onClose }: ImportExportManagerProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export')
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [exportOptions, setExportOptions] = useState({
    includeCollections: true,
    includePreferences: false,
    selectedTools: [] as string[]
  })
  const [importOptions, setImportOptions] = useState({
    overwriteExisting: false,
    importCollections: true,
    importPreferences: false,
    toolIdPrefix: ''
  })
  const [packageMetadata, setPackageMetadata] = useState({
    name: 'My Tool Package',
    description: 'A collection of productivity tools',
    version: '1.0.0',
    author: '',
    website: '',
    license: 'MIT'
  })

  const { preferences } = usePreferences()

  if (!isOpen) return null

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await toolRegistry.initialize()
      await collectionManager.initialize()

      const allTools = toolRegistry.getAll()
      const selectedTools = exportOptions.selectedTools.length > 0 
        ? allTools.filter(tool => exportOptions.selectedTools.includes(tool.id))
        : allTools

      const collections = exportOptions.includeCollections ? collectionManager.getAll() : undefined
      const prefs = exportOptions.includePreferences ? preferences : undefined

      const toolPackage = ToolImportExport.exportTools({
        tools: selectedTools,
        collections,
        preferences: prefs,
        metadata: packageMetadata
      })

      await ToolImportExport.exportToFile(toolPackage)
    } catch (error) {
      console.error('Export failed:', error)
      alert(`Export failed: ${error}`)
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async (file: File) => {
    setIsImporting(true)
    setImportResult(null)
    
    try {
      const result = await ToolImportExport.importFromFile(file, importOptions)
      setImportResult(result)
    } catch (error) {
      console.error('Import failed:', error)
      setImportResult({
        success: false,
        imported: { tools: 0, collections: 0, preferences: false },
        skipped: { tools: [], collections: [], reasons: [] },
        errors: [`Import failed: ${error}`]
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleImport(file)
    }
  }

  const toggleToolSelection = (toolId: string) => {
    setExportOptions(prev => ({
      ...prev,
      selectedTools: prev.selectedTools.includes(toolId)
        ? prev.selectedTools.filter(id => id !== toolId)
        : [...prev.selectedTools, toolId]
    }))
  }

  const allTools = toolRegistry.getAll()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Import/Export Tools
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Share and backup your tool configurations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close import/export manager"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'export'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Download className="w-4 h-4 inline mr-2" />
            Export
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'import'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Import
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'export' ? (
            <div className="space-y-6">
              {/* Package Metadata */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Package Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Package Name
                    </label>
                    <input
                      type="text"
                      value={packageMetadata.name}
                      onChange={(e) => setPackageMetadata(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Version
                    </label>
                    <input
                      type="text"
                      value={packageMetadata.version}
                      onChange={(e) => setPackageMetadata(prev => ({ ...prev, version: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={packageMetadata.description}
                      onChange={(e) => setPackageMetadata(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Export Options */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Export Options
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeCollections}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includeCollections: e.target.checked }))}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Include collections and workflows
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.includePreferences}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includePreferences: e.target.checked }))}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Include preferences (theme, layout)
                    </span>
                  </label>
                </div>
              </div>

              {/* Tool Selection */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Select Tools ({exportOptions.selectedTools.length === 0 ? 'All' : exportOptions.selectedTools.length})
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {allTools.map(tool => (
                    <label key={tool.id} className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                      <input
                        type="checkbox"
                        checked={exportOptions.selectedTools.length === 0 || exportOptions.selectedTools.includes(tool.id)}
                        onChange={() => toggleToolSelection(tool.id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                        {tool.name}
                      </span>
                      <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {tool.category}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Export Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  {isExporting ? 'Exporting...' : 'Export Package'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Import Options */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Import Options
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={importOptions.overwriteExisting}
                      onChange={(e) => setImportOptions(prev => ({ ...prev, overwriteExisting: e.target.checked }))}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Overwrite existing tools
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={importOptions.importCollections}
                      onChange={(e) => setImportOptions(prev => ({ ...prev, importCollections: e.target.checked }))}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Import collections and workflows
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={importOptions.importPreferences}
                      onChange={(e) => setImportOptions(prev => ({ ...prev, importPreferences: e.target.checked }))}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Import preferences (theme, layout)
                    </span>
                  </label>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Select Package File
                </h3>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Choose a tool package file to import
                  </p>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    disabled={isImporting}
                    className="hidden"
                    id="import-file"
                  />
                  <label
                    htmlFor="import-file"
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer transition-colors"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isImporting ? 'Importing...' : 'Choose File'}
                  </label>
                </div>
              </div>

              {/* Import Result */}
              {importResult && (
                <div className={`p-4 rounded-lg ${
                  importResult.success 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {importResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    )}
                    <h4 className={`font-medium ${
                      importResult.success 
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-red-800 dark:text-red-200'
                    }`}>
                      {importResult.success ? 'Import Successful' : 'Import Failed'}
                    </h4>
                  </div>
                  
                  <div className="text-sm space-y-1">
                    <p className={importResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                      Imported: {importResult.imported.tools} tools, {importResult.imported.collections} collections
                      {importResult.imported.preferences && ', preferences'}
                    </p>
                    
                    {importResult.skipped.tools.length > 0 && (
                      <p className="text-yellow-700 dark:text-yellow-300">
                        Skipped: {importResult.skipped.tools.join(', ')}
                      </p>
                    )}
                    
                    {importResult.errors.length > 0 && (
                      <div className="text-red-700 dark:text-red-300">
                        <p>Errors:</p>
                        <ul className="list-disc list-inside ml-2">
                          {importResult.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}