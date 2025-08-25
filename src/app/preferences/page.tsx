'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, RotateCcw, Download, Upload, Trash2, Database, Archive, AlertTriangle } from 'lucide-react'
import { usePreferences, useTheme, useLayout } from '@/contexts/PreferencesContext'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { LayoutToggle } from '@/components/shared/LayoutToggle'
import { Storage } from '@/lib/storage'
import { toolRegistry } from '@/lib/tool-registry'
import { collectionManager } from '@/lib/collections'

export default function PreferencesPage() {
  const { preferences, updatePreferences } = usePreferences()
  const { theme } = useTheme()
  const { layout } = useLayout()
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const handleExportData = () => {
    try {
      const data = {
        preferences,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `app-studio-preferences-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('Failed to export preferences:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }
  }

  const handleExportCompleteBackup = async () => {
    setIsExporting(true)
    try {
      // Get all data
      const tools = toolRegistry.getAll()
      const collections = collectionManager.getAll()
      
      const data = {
        preferences,
        tools: tools.map(tool => ({
          ...tool,
          lastUsed: tool.lastUsed?.toISOString() || null,
          createdAt: tool.createdAt.toISOString()
        })),
        collections: collections.map(collection => ({
          ...collection,
          createdAt: collection.createdAt.toISOString(),
          updatedAt: collection.updatedAt.toISOString()
        })),
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `app-studio-complete-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('Failed to export complete backup:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        
        if (data.preferences) {
          updatePreferences(data.preferences)
        }
        
        // Check if this is a complete backup
        if (data.tools || data.collections) {
          setSaveStatus('saved')
          setTimeout(() => {
            setSaveStatus('idle')
            if (confirm('Complete backup imported! The page will reload to apply all changes.')) {
              window.location.reload()
            }
          }, 1000)
        } else {
          setSaveStatus('saved')
          setTimeout(() => setSaveStatus('idle'), 2000)
        }
      } catch (error) {
        console.error('Failed to import data:', error)
        setSaveStatus('error')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } finally {
        setIsImporting(false)
      }
    }
    reader.readAsText(file)
    
    // Reset the input
    event.target.value = ''
  }

  const handleClearUsageData = () => {
    if (confirm('Are you sure you want to clear all usage data? This will reset usage counts and last used dates for all tools.')) {
      try {
        localStorage.removeItem('app-studio-usage')
        setSaveStatus('saved')
        setTimeout(() => {
          setSaveStatus('idle')
          if (confirm('Usage data cleared! The page will reload to apply changes.')) {
            window.location.reload()
          }
        }, 1000)
      } catch (error) {
        console.error('Failed to clear usage data:', error)
        setSaveStatus('error')
        setTimeout(() => setSaveStatus('idle'), 2000)
      }
    }
  }

  const handleResetPreferences = () => {
    if (showResetConfirm) {
      Storage.clearAll()
      window.location.reload()
    } else {
      setShowResetConfirm(true)
      setTimeout(() => setShowResetConfirm(false), 5000)
    }
  }

  const handleUpdateCategories = (categories: string[]) => {
    updatePreferences({ categories })
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Preferences</h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Customize your App Studio experience</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Appearance Section */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Appearance</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Theme
                </label>
                <ThemeToggle />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Choose your preferred color scheme. System will follow your device settings.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Layout
                </label>
                <LayoutToggle />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Select how tools are displayed on the dashboard.
                </p>
              </div>
            </div>
          </section>

          {/* Favorites Section */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Favorites</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  You have {preferences.favoriteTools.length} favorite tool{preferences.favoriteTools.length !== 1 ? 's' : ''}
                </p>
                {preferences.favoriteTools.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {preferences.favoriteTools.map((toolId) => (
                      <span
                        key={toolId}
                        className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-sm rounded-full"
                      >
                        {toolId}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No favorite tools yet. Click the star icon on any tool to add it to favorites.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Recent Tools Section */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Tools</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Recently used tools (last {preferences.recentTools.length})
                </p>
                {preferences.recentTools.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {preferences.recentTools.map((toolId) => (
                      <span
                        key={toolId}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full"
                      >
                        {toolId}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No recent tools yet. Start using tools to see them here.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Data Management Section */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Data Management</h2>
            <div className="space-y-6">
              {/* Export Options */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Export Data</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleExportData}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export Preferences
                  </button>
                  
                  <button
                    onClick={handleExportCompleteBackup}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Archive className="w-4 h-4" />
                    {isExporting ? 'Exporting...' : 'Complete Backup'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Complete backup includes preferences, tools, collections, and usage data.
                </p>
              </div>

              {/* Import Options */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Import Data</h3>
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
                    <Upload className="w-4 h-4" />
                    {isImporting ? 'Importing...' : 'Import Backup'}
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportData}
                      className="hidden"
                      disabled={isImporting}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Supports both preferences-only and complete backup files.
                </p>
              </div>

              {/* Maintenance Options */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Maintenance</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleClearUsageData}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    <Database className="w-4 h-4" />
                    Clear Usage Data
                  </button>
                  
                  <button
                    onClick={handleResetPreferences}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      showResetConfirm
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                    {showResetConfirm ? 'Confirm Reset All' : 'Reset All Data'}
                  </button>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 space-y-1">
                  <p>• Clear Usage Data: Reset tool usage counts and last used dates</p>
                  <p>• Reset All Data: Clear everything and return to default settings</p>
                </div>
              </div>

              {/* Status Messages */}
              {saveStatus === 'saved' && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <span>✓</span>
                  <span>Operation completed successfully</span>
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Operation failed. Please try again.</span>
                </div>
              )}

              {/* Warning for Reset */}
              {showResetConfirm && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-200 mb-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">Warning: This action cannot be undone!</span>
                  </div>
                  <p className="text-red-700 dark:text-red-300 text-sm">
                    All preferences, tools, collections, and usage data will be permanently deleted.
                    Click "Confirm Reset All" again to proceed.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}