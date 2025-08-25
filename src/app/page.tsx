'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Star, Clock, Wand2, Settings, Zap, Filter, SortAsc, Folder, Plus, FolderOpen, Keyboard, BarChart3 } from 'lucide-react'
import { toolRegistry, Tool, ToolCategory } from '@/lib/tool-registry'
import { collectionManager, Collection } from '@/lib/collections'
import { DEFAULT_TOOLS } from '@/data/tools'
import { usePreferences, useLayout } from '@/contexts/PreferencesContext'
import { useKeyboardShortcuts } from '@/contexts/KeyboardShortcutsContext'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { LayoutToggle } from '@/components/shared/LayoutToggle'
import { FavoriteButton } from '@/components/shared/FavoriteButton'
import { highlightMatches } from '@/lib/fuzzy-search'

export default function Dashboard() {
  const [tools, setTools] = useState<Tool[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | 'all'>('all')
  const [selectedCollection, setSelectedCollection] = useState<string | 'all'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'recent' | 'relevance'>('name')
  const [useFuzzySearch, setUseFuzzySearch] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [searchMatches, setSearchMatches] = useState(new Map())
  
  const { preferences, addToRecent } = usePreferences()
  const { layout } = useLayout()
  const { showHelp } = useKeyboardShortcuts()

  const categories: (ToolCategory | 'all')[] = ['all', ToolCategory.PRODUCTIVITY, ToolCategory.DEVELOPMENT, ToolCategory.DESIGN, ToolCategory.UTILITIES]

  useEffect(() => {
    const initializeData = async () => {
      await toolRegistry.initialize(DEFAULT_TOOLS)
      await collectionManager.initialize()
      setTools(toolRegistry.getAll())
      setCollections(collectionManager.getAll())
      setIsLoading(false)
    }
    
    initializeData()
  }, [])

  // Get filtered tools with search matches for highlighting
  const { tools: filteredToolsRaw, matches } = toolRegistry.getFilteredWithMatches({
    category: selectedCategory,
    search: searchQuery,
    sortBy: searchQuery && useFuzzySearch ? 'relevance' : sortBy,
    favoritesFirst: true,
    useFuzzySearch: useFuzzySearch && searchQuery.length > 0
  })

  // Apply collection filter if selected
  let filteredTools = filteredToolsRaw
  if (selectedCollection !== 'all') {
    const collection = collections.find(c => c.id === selectedCollection)
    if (collection) {
      filteredTools = filteredTools.filter(tool => collection.toolIds.includes(tool.id))
    }
  }

  // Add favorite status and search matches
  const toolsWithMetadata = filteredTools.map(tool => ({
    ...tool,
    isFavorite: preferences.favoriteTools.includes(tool.id),
    searchMatch: matches.get(tool.id)
  }))

  // Get recent tools
  const recentTools = preferences.recentTools
    .map(id => tools.find(tool => tool.id === id))
    .filter(Boolean)
    .slice(0, 5) as Tool[]

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">App Studio</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Your personal productivity toolkit</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {tools.length} tool{tools.length !== 1 ? 's' : ''} available
              </div>
              <div className="flex items-center gap-1">
                {/* Primary Navigation */}
                <div className="flex items-center gap-1 mr-3">
                  <Link
                    href="/analytics"
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                    title="Analytics"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden lg:inline text-sm">Analytics</span>
                  </Link>
                  <Link
                    href="/collections"
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                    title="Collections (C)"
                  >
                    <FolderOpen className="w-4 h-4" />
                    <span className="hidden lg:inline text-sm">Collections</span>
                  </Link>
                  <Link
                    href="/tools/registry"
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                    title="Tool Registry (R)"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="hidden lg:inline text-sm">Registry</span>
                  </Link>
                  <Link
                    href="/preferences"
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                    title="Preferences (P)"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="hidden lg:inline text-sm">Preferences</span>
                  </Link>
                </div>

                {/* Secondary Actions */}
                <div className="flex items-center gap-1 border-l border-gray-200 dark:border-gray-700 pl-3">
                  <button
                    onClick={showHelp}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                    title="Keyboard Shortcuts (?)"
                    aria-label="Show keyboard shortcuts"
                  >
                    <Keyboard className="w-4 h-4" />
                  </button>
                  <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    <ThemeToggle />
                    <LayoutToggle />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Recent Tools Section */}
        {recentTools.length > 0 && !searchQuery && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Tools</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {recentTools.map((tool) => (
                <Link
                  key={tool.id}
                  href={tool.path as any}
                  onClick={() => addToRecent(tool.id)}
                  className="flex-shrink-0 group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500 p-3 transition-all duration-200 hover:shadow-md min-w-[140px]"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800 transition-colors">
                      <Wand2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <FavoriteButton toolId={tool.id} />
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {tool.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {tool.category}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={useFuzzySearch ? "Smart search tools... (Press / to focus)" : "Search tools... (Press / to focus)"}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  aria-label="Search tools"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    ×
                  </button>
                )}
              </div>
              
              {/* Search Options */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUseFuzzySearch(!useFuzzySearch)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                    useFuzzySearch
                      ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  title={useFuzzySearch ? 'Smart search enabled' : 'Enable smart search'}
                >
                  <Zap className="w-3 h-3" />
                  Smart
                </button>
                
                {!searchQuery && (
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  >
                    <option value="name">Name</option>
                    <option value="usage">Most Used</option>
                    <option value="recent">Recently Used</option>
                  </select>
                )}
              </div>
            </div>

            {/* Category and Collection Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Categories */}
              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>

              {/* Collections */}
              {collections.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  <select
                    value={selectedCollection}
                    onChange={(e) => setSelectedCollection(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  >
                    <option value="all">All Collections</option>
                    {collections.map((collection) => (
                      <option key={collection.id} value={collection.id}>
                        {collection.isWorkflow ? '⚡' : '📁'} {collection.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Wand2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Loading tools...</h3>
          </div>
        ) : (
          <>
            {/* Search Results Info */}
            {searchQuery && (
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {toolsWithMetadata.length} result{toolsWithMetadata.length !== 1 ? 's' : ''} for "{searchQuery}"
                  {useFuzzySearch && <span className="ml-2 text-indigo-600 dark:text-indigo-400">• Smart search</span>}
                </div>
                {toolsWithMetadata.length > 0 && useFuzzySearch && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Sorted by relevance
                  </div>
                )}
              </div>
            )}

            {/* Tools Grid/List */}
            <div className={layout === 'grid'
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
            }>
              {toolsWithMetadata.map((tool) => {
                const searchMatch = tool.searchMatch
                const nameMatch = searchMatch?.matches.find(m => m.key === 'name')
                const descMatch = searchMatch?.matches.find(m => m.key === 'description')
                
                return (
                  <Link
                    key={tool.id}
                    href={tool.path as any}
                    onClick={() => addToRecent(tool.id)}
                    className={`
                      group block bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200
                      border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500 overflow-hidden
                      ${layout === 'list' ? 'flex items-center' : ''}
                      ${searchMatch ? 'ring-1 ring-indigo-200 dark:ring-indigo-800' : ''}
                    `}
                  >
                    <div className={layout === 'grid' ? "p-6" : "p-4 flex-1 flex items-center gap-4"}>
                      <div className={`flex items-start justify-between ${layout === 'grid' ? 'mb-4' : 'flex-1'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`
                            bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center
                            group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800 transition-colors
                            ${layout === 'grid' ? 'w-12 h-12' : 'w-10 h-10'}
                            ${searchMatch ? 'ring-2 ring-indigo-300 dark:ring-indigo-600' : ''}
                          `}>
                            <Wand2 className={`text-indigo-600 dark:text-indigo-400 ${layout === 'grid' ? 'w-6 h-6' : 'w-5 h-5'}`} />
                          </div>
                          <div className={layout === 'list' ? 'flex-1' : ''}>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {nameMatch && useFuzzySearch ? (
                                <span dangerouslySetInnerHTML={{
                                  __html: highlightMatches(tool.name, nameMatch.indices, 'bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded')
                                }} />
                              ) : (
                                tool.name
                              )}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{tool.category}</p>
                            {layout === 'list' && (
                              <p className="text-gray-600 dark:text-gray-300 text-sm mt-1 line-clamp-1">
                                {descMatch && useFuzzySearch ? (
                                  <span dangerouslySetInnerHTML={{
                                    __html: highlightMatches(tool.description, descMatch.indices, 'bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded')
                                  }} />
                                ) : (
                                  tool.description
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {searchMatch && (
                            <div className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-md">
                              {Math.round(searchMatch.score * 100)}%
                            </div>
                          )}
                          <FavoriteButton toolId={tool.id} />
                        </div>
                      </div>
                      
                      {layout === 'grid' && (
                        <>
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                            {descMatch && useFuzzySearch ? (
                              <span dangerouslySetInnerHTML={{
                                __html: highlightMatches(tool.description, descMatch.indices, 'bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded')
                              }} />
                            ) : (
                              tool.description
                            )}
                          </p>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
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
                                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-md"
                                >
                                  {tag}
                                </span>
                              ))}
                              {tool.tags.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-md">
                                  +{tool.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </>
                      )}
                      
                      {layout === 'list' && (
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatLastUsed(tool.lastUsed)}
                          </div>
                          <div>
                            Used {tool.usageCount} time{tool.usageCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>

            {toolsWithMetadata.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No tools found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {searchQuery
                    ? `No tools match "${searchQuery}"`
                    : 'Try adjusting your search or filter criteria'
                  }
                </p>
                {searchQuery && useFuzzySearch && (
                  <button
                    onClick={() => setUseFuzzySearch(false)}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm"
                  >
                    Try exact search instead
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}