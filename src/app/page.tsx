'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Star, Clock, Wand2 } from 'lucide-react'
import { toolRegistry, Tool, ToolCategory } from '@/lib/tool-registry'
import { DEFAULT_TOOLS } from '@/data/tools'

export default function Dashboard() {
  const [tools, setTools] = useState<Tool[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | 'all'>('all')
  const [isLoading, setIsLoading] = useState(true)

  const categories: (ToolCategory | 'all')[] = ['all', ToolCategory.PRODUCTIVITY, ToolCategory.DEVELOPMENT, ToolCategory.DESIGN, ToolCategory.UTILITIES]

  useEffect(() => {
    const initializeRegistry = async () => {
      await toolRegistry.initialize(DEFAULT_TOOLS)
      setTools(toolRegistry.getAll())
      setIsLoading(false)
    }
    
    initializeRegistry()
  }, [])

  const filteredTools = toolRegistry.getFiltered({
    category: selectedCategory,
    search: searchQuery,
    sortBy: 'name',
    favoritesFirst: true
  })

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">App Studio</h1>
              <p className="text-gray-600 mt-1">Your personal productivity toolkit</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                {tools.length} tool{tools.length !== 1 ? 's' : ''} available
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
            
            <div className="flex gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Wand2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading tools...</h3>
          </div>
        ) : (
          <>
            {/* Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTools.map((tool) => (
                <Link
                  key={tool.id}
                  href={tool.path as any}
                  className="group block bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-indigo-300 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                          <Wand2 className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {tool.name}
                          </h3>
                          <p className="text-sm text-gray-500 capitalize">{tool.category}</p>
                        </div>
                      </div>
                      {tool.isFavorite && (
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      )}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {tool.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatLastUsed(tool.lastUsed)}
                      </div>
                      <div>
                        Used {tool.usageCount} time{tool.usageCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                    
                    {tool.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {tool.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                          >
                            {tag}
                          </span>
                        ))}
                        {tool.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                            +{tool.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {filteredTools.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tools found</h3>
                <p className="text-gray-500">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}