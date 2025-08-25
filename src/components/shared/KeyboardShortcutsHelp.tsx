'use client'

import React from 'react'
import { X, Keyboard } from 'lucide-react'
import { useKeyboardShortcuts } from '@/contexts/KeyboardShortcutsContext'
import { KeyboardShortcutsManager } from '@/lib/keyboard-shortcuts'

export function KeyboardShortcutsHelp() {
  const { shortcuts, isHelpVisible, hideHelp } = useKeyboardShortcuts()

  if (!isHelpVisible) return null

  const categories = {
    navigation: 'Navigation',
    search: 'Search',
    tools: 'Tools',
    general: 'General'
  }

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = []
    }
    acc[shortcut.category].push(shortcut)
    return acc
  }, {} as Record<string, typeof shortcuts>)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
              <Keyboard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Keyboard Shortcuts
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Navigate App Studio faster with these shortcuts
              </p>
            </div>
          </div>
          <button
            onClick={hideHelp}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close shortcuts help"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          <div className="space-y-6">
            {Object.entries(categories).map(([categoryKey, categoryName]) => {
              const categoryShortcuts = groupedShortcuts[categoryKey]
              if (!categoryShortcuts || categoryShortcuts.length === 0) return null

              return (
                <div key={categoryKey}>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
                    {categoryName}
                  </h3>
                  <div className="space-y-2">
                    {categoryShortcuts.map((shortcut, index) => (
                      <div
                        key={`${categoryKey}-${index}`}
                        className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <span className="text-gray-700 dark:text-gray-300">
                          {shortcut.description}
                        </span>
                        <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono text-gray-600 dark:text-gray-400 shadow-sm">
                          {KeyboardShortcutsManager.formatShortcut(shortcut)}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Tips */}
          <div className="mt-8 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <h4 className="text-sm font-medium text-indigo-900 dark:text-indigo-100 mb-2">
              💡 Pro Tips
            </h4>
            <ul className="text-sm text-indigo-700 dark:text-indigo-300 space-y-1">
              <li>• Shortcuts work from anywhere except when typing in inputs</li>
              <li>• Press <kbd className="px-1 py-0.5 bg-indigo-100 dark:bg-indigo-800 rounded text-xs">Esc</kbd> to close this dialog or clear search</li>
              <li>• Use <kbd className="px-1 py-0.5 bg-indigo-100 dark:bg-indigo-800 rounded text-xs">/</kbd> or <kbd className="px-1 py-0.5 bg-indigo-100 dark:bg-indigo-800 rounded text-xs">Ctrl+F</kbd> to quickly focus search</li>
              <li>• Navigate between tools using the number keys (coming soon)</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              Press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">?</kbd> to toggle this help
            </span>
            <button
              onClick={hideHelp}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-700"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}