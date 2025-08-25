'use client'

import { Grid3X3, List } from 'lucide-react'
import { useLayout } from '@/contexts/PreferencesContext'

export function LayoutToggle() {
  const { layout, setLayout } = useLayout()

  const layouts = [
    { value: 'grid' as const, icon: Grid3X3, label: 'Grid' },
    { value: 'list' as const, icon: List, label: 'List' }
  ]

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
      {layouts.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setLayout(value)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all
            ${layout === value
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }
          `}
          title={`Switch to ${label.toLowerCase()} layout (L)`}
        >
          <Icon className="w-4 h-4" />
          <span className="sr-only">{label}</span>
        </button>
      ))}
    </div>
  )
}