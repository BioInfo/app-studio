// Advanced Search Filters and Saved Searches for App Studio
// Provides sophisticated search capabilities with filters, sorting, and saved search functionality

import { Tool, ToolCategory } from './tool-registry'
import { Collection } from './collections'

export interface SearchFilter {
  id: string
  type: 'category' | 'tag' | 'usage' | 'date' | 'favorite' | 'collection' | 'custom'
  field: string
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in'
  value: any
  label: string
  isActive: boolean
}

export interface SavedSearch {
  id: string
  name: string
  description: string
  query: string
  filters: SearchFilter[]
  sortBy: string
  sortOrder: 'asc' | 'desc'
  createdAt: Date
  lastUsed: Date
  useCount: number
  isPublic: boolean
  tags: string[]
  userId: string
}

export interface SearchPreset {
  id: string
  name: string
  description: string
  icon: string
  filters: Omit<SearchFilter, 'id' | 'isActive'>[]
  sortBy: string
  sortOrder: 'asc' | 'desc'
  category: 'productivity' | 'discovery' | 'maintenance' | 'analysis'
}

export interface SearchResult {
  tools: Tool[]
  totalCount: number
  appliedFilters: SearchFilter[]
  searchTime: number
  suggestions: SearchSuggestion[]
  facets: SearchFacet[]
}

export interface SearchSuggestion {
  type: 'query' | 'filter' | 'sort'
  text: string
  description: string
  action: () => void
}

export interface SearchFacet {
  field: string
  label: string
  values: Array<{
    value: string
    label: string
    count: number
    selected: boolean
  }>
}

export interface SearchHistory {
  id: string
  query: string
  filters: SearchFilter[]
  timestamp: Date
  resultCount: number
  clickedTools: string[]
}

/**
 * Advanced Search Manager
 */
export class AdvancedSearchManager {
  private savedSearches: Map<string, SavedSearch> = new Map()
  private searchHistory: SearchHistory[] = []
  private searchPresets: Map<string, SearchPreset> = new Map()
  private activeFilters: SearchFilter[] = []
  private initialized = false

  /**
   * Initialize the search manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    this.loadDefaultPresets()
    this.loadFromStorage()
    this.initialized = true
  }

  /**
   * Perform advanced search with filters
   */
  search(
    tools: Tool[],
    query: string = '',
    filters: SearchFilter[] = [],
    sortBy: string = 'relevance',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): SearchResult {
    const startTime = performance.now()
    
    // Apply text search
    let filteredTools = this.applyTextSearch(tools, query)
    
    // Apply filters
    filteredTools = this.applyFilters(filteredTools, filters)
    
    // Apply sorting
    filteredTools = this.applySorting(filteredTools, sortBy, sortOrder, query)
    
    const searchTime = performance.now() - startTime
    
    // Generate suggestions and facets
    const suggestions = this.generateSuggestions(query, filters, filteredTools.length)
    const facets = this.generateFacets(tools, filters)
    
    // Record search in history
    this.recordSearch(query, filters, filteredTools.length)
    
    return {
      tools: filteredTools,
      totalCount: filteredTools.length,
      appliedFilters: filters.filter(f => f.isActive),
      searchTime,
      suggestions,
      facets
    }
  }

  /**
   * Create a new search filter
   */
  createFilter(
    type: SearchFilter['type'],
    field: string,
    operator: SearchFilter['operator'],
    value: any,
    label?: string
  ): SearchFilter {
    return {
      id: this.generateFilterId(),
      type,
      field,
      operator,
      value,
      label: label || this.generateFilterLabel(type, field, operator, value),
      isActive: true
    }
  }

  /**
   * Save a search configuration
   */
  saveSearch(
    name: string,
    description: string,
    query: string,
    filters: SearchFilter[],
    sortBy: string,
    sortOrder: 'asc' | 'desc',
    tags: string[] = []
  ): SavedSearch {
    const savedSearch: SavedSearch = {
      id: this.generateSearchId(),
      name,
      description,
      query,
      filters: filters.map(f => ({ ...f, isActive: true })),
      sortBy,
      sortOrder,
      createdAt: new Date(),
      lastUsed: new Date(),
      useCount: 0,
      isPublic: false,
      tags,
      userId: this.getUserId()
    }

    this.savedSearches.set(savedSearch.id, savedSearch)
    this.persistToStorage()
    
    return savedSearch
  }

  /**
   * Load a saved search
   */
  loadSavedSearch(searchId: string): SavedSearch | null {
    const savedSearch = this.savedSearches.get(searchId)
    if (!savedSearch) return null

    savedSearch.lastUsed = new Date()
    savedSearch.useCount++
    this.persistToStorage()

    return savedSearch
  }

  /**
   * Get all saved searches
   */
  getSavedSearches(): SavedSearch[] {
    return Array.from(this.savedSearches.values())
      .sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime())
  }

  /**
   * Delete a saved search
   */
  deleteSavedSearch(searchId: string): boolean {
    const success = this.savedSearches.delete(searchId)
    if (success) {
      this.persistToStorage()
    }
    return success
  }

  /**
   * Get search presets
   */
  getSearchPresets(): SearchPreset[] {
    return Array.from(this.searchPresets.values())
  }

  /**
   * Apply a search preset
   */
  applyPreset(presetId: string): { filters: SearchFilter[], sortBy: string, sortOrder: 'asc' | 'desc' } | null {
    const preset = this.searchPresets.get(presetId)
    if (!preset) return null

    const filters = preset.filters.map(f => ({
      ...f,
      id: this.generateFilterId(),
      isActive: true
    }))

    return {
      filters,
      sortBy: preset.sortBy,
      sortOrder: preset.sortOrder
    }
  }

  /**
   * Get search history
   */
  getSearchHistory(limit: number = 20): SearchHistory[] {
    return this.searchHistory
      .slice(-limit)
      .reverse()
  }

  /**
   * Clear search history
   */
  clearSearchHistory(): void {
    this.searchHistory = []
    this.persistToStorage()
  }

  /**
   * Get popular search terms
   */
  getPopularSearchTerms(limit: number = 10): Array<{ term: string, count: number }> {
    const termCounts = new Map<string, number>()
    
    this.searchHistory.forEach(search => {
      if (search.query.trim()) {
        const terms = search.query.toLowerCase().split(/\s+/)
        terms.forEach(term => {
          if (term.length > 2) {
            termCounts.set(term, (termCounts.get(term) || 0) + 1)
          }
        })
      }
    })

    return Array.from(termCounts.entries())
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }

  /**
   * Get filter suggestions based on current context
   */
  getFilterSuggestions(tools: Tool[], currentFilters: SearchFilter[]): SearchFilter[] {
    const suggestions: SearchFilter[] = []
    const activeFilterTypes = new Set(currentFilters.map(f => f.type))

    // Suggest category filter if not active
    if (!activeFilterTypes.has('category')) {
      const categorySet = new Set(tools.map(t => t.category))
      const categories = Array.from(categorySet)
      if (categories.length > 1) {
        suggestions.push(this.createFilter('category', 'category', 'equals', categories[0], `Category: ${categories[0]}`))
      }
    }

    // Suggest usage filter for frequently used tools
    if (!activeFilterTypes.has('usage')) {
      const hasHighUsage = tools.some(t => t.usageCount > 5)
      if (hasHighUsage) {
        suggestions.push(this.createFilter('usage', 'usageCount', 'greater_than', 5, 'Frequently used'))
      }
    }

    // Suggest favorite filter
    if (!activeFilterTypes.has('favorite')) {
      const hasFavorites = tools.some(t => t.isFavorite)
      if (hasFavorites) {
        suggestions.push(this.createFilter('favorite', 'isFavorite', 'equals', true, 'Favorites only'))
      }
    }

    // Suggest recent filter
    if (!activeFilterTypes.has('date')) {
      const hasRecentlyUsed = tools.some(t => t.lastUsed && 
        (new Date().getTime() - t.lastUsed.getTime()) < 7 * 24 * 60 * 60 * 1000)
      if (hasRecentlyUsed) {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        suggestions.push(this.createFilter('date', 'lastUsed', 'greater_than', weekAgo, 'Used this week'))
      }
    }

    return suggestions.slice(0, 3) // Limit to 3 suggestions
  }

  /**
   * Private helper methods
   */
  private applyTextSearch(tools: Tool[], query: string): Tool[] {
    if (!query.trim()) return tools

    const searchTerms = query.toLowerCase().split(/\s+/)
    
    return tools.filter(tool => {
      const searchableText = [
        tool.name,
        tool.description,
        ...tool.tags,
        tool.category
      ].join(' ').toLowerCase()

      return searchTerms.every(term => searchableText.includes(term))
    })
  }

  private applyFilters(tools: Tool[], filters: SearchFilter[]): Tool[] {
    return tools.filter(tool => {
      return filters.every(filter => {
        if (!filter.isActive) return true
        return this.evaluateFilter(tool, filter)
      })
    })
  }

  private evaluateFilter(tool: Tool, filter: SearchFilter): boolean {
    const fieldValue = this.getFieldValue(tool, filter.field)
    
    switch (filter.operator) {
      case 'equals':
        return fieldValue === filter.value
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(filter.value).toLowerCase())
      case 'greater_than':
        return Number(fieldValue) > Number(filter.value)
      case 'less_than':
        return Number(fieldValue) < Number(filter.value)
      case 'between':
        const [min, max] = filter.value
        const numValue = Number(fieldValue)
        return numValue >= min && numValue <= max
      case 'in':
        return Array.isArray(filter.value) && filter.value.includes(fieldValue)
      case 'not_in':
        return Array.isArray(filter.value) && !filter.value.includes(fieldValue)
      default:
        return true
    }
  }

  private getFieldValue(tool: Tool, field: string): any {
    switch (field) {
      case 'category': return tool.category
      case 'usageCount': return tool.usageCount
      case 'lastUsed': return tool.lastUsed
      case 'isFavorite': return tool.isFavorite
      case 'tags': return tool.tags
      case 'name': return tool.name
      case 'description': return tool.description
      case 'createdAt': return tool.createdAt
      case 'version': return tool.version
      default: return null
    }
  }

  private applySorting(
    tools: Tool[], 
    sortBy: string, 
    sortOrder: 'asc' | 'desc',
    query: string
  ): Tool[] {
    const sorted = [...tools].sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'usage':
          comparison = a.usageCount - b.usageCount
          break
        case 'recent':
          const aTime = a.lastUsed?.getTime() || 0
          const bTime = b.lastUsed?.getTime() || 0
          comparison = aTime - bTime
          break
        case 'created':
          comparison = a.createdAt.getTime() - b.createdAt.getTime()
          break
        case 'category':
          comparison = a.category.localeCompare(b.category)
          break
        case 'relevance':
        default:
          // Calculate relevance score based on query match
          comparison = this.calculateRelevanceScore(b, query) - this.calculateRelevanceScore(a, query)
          break
      }

      return sortOrder === 'desc' ? -comparison : comparison
    })

    return sorted
  }

  private calculateRelevanceScore(tool: Tool, query: string): number {
    if (!query.trim()) return 0

    const searchTerms = query.toLowerCase().split(/\s+/)
    let score = 0

    searchTerms.forEach(term => {
      // Name match (highest weight)
      if (tool.name.toLowerCase().includes(term)) score += 10
      
      // Tag match (medium weight)
      if (tool.tags.some(tag => tag.toLowerCase().includes(term))) score += 5
      
      // Description match (low weight)
      if (tool.description.toLowerCase().includes(term)) score += 2
      
      // Category match (low weight)
      if (tool.category.toLowerCase().includes(term)) score += 1
    })

    // Boost score for favorites and frequently used tools
    if (tool.isFavorite) score += 3
    if (tool.usageCount > 5) score += 2

    return score
  }

  private generateSuggestions(
    query: string, 
    filters: SearchFilter[], 
    resultCount: number
  ): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = []

    // Suggest removing filters if no results
    if (resultCount === 0 && filters.length > 0) {
      suggestions.push({
        type: 'filter',
        text: 'Remove filters',
        description: 'Clear all filters to see more results',
        action: () => {
          // This would be handled by the UI component
        }
      })
    }

    // Suggest popular search terms if query is short
    if (query.length < 3) {
      const popularTerms = this.getPopularSearchTerms(3)
      popularTerms.forEach(({ term }) => {
        suggestions.push({
          type: 'query',
          text: term,
          description: `Search for "${term}"`,
          action: () => {
            // This would be handled by the UI component
          }
        })
      })
    }

    // Suggest sorting options
    if (resultCount > 1) {
      suggestions.push({
        type: 'sort',
        text: 'Sort by usage',
        description: 'Show most used tools first',
        action: () => {
          // This would be handled by the UI component
        }
      })
    }

    return suggestions.slice(0, 5)
  }

  private generateFacets(tools: Tool[], activeFilters: SearchFilter[]): SearchFacet[] {
    const facets: SearchFacet[] = []

    // Category facet
    const categoryFacet = this.generateCategoryFacet(tools, activeFilters)
    if (categoryFacet) facets.push(categoryFacet)

    // Usage facet
    const usageFacet = this.generateUsageFacet(tools, activeFilters)
    if (usageFacet) facets.push(usageFacet)

    // Tags facet
    const tagsFacet = this.generateTagsFacet(tools, activeFilters)
    if (tagsFacet) facets.push(tagsFacet)

    return facets
  }

  private generateCategoryFacet(tools: Tool[], activeFilters: SearchFilter[]): SearchFacet | null {
    const categoryCounts = new Map<string, number>()
    const activeCategories = new Set(
      activeFilters
        .filter(f => f.field === 'category' && f.isActive)
        .map(f => f.value)
    )

    tools.forEach(tool => {
      categoryCounts.set(tool.category, (categoryCounts.get(tool.category) || 0) + 1)
    })

    if (categoryCounts.size <= 1) return null

    return {
      field: 'category',
      label: 'Category',
      values: Array.from(categoryCounts.entries()).map(([category, count]) => ({
        value: category,
        label: category.charAt(0).toUpperCase() + category.slice(1),
        count,
        selected: activeCategories.has(category)
      })).sort((a, b) => b.count - a.count)
    }
  }

  private generateUsageFacet(tools: Tool[], activeFilters: SearchFilter[]): SearchFacet | null {
    const usageRanges = [
      { label: 'Never used', min: 0, max: 0 },
      { label: 'Rarely used (1-2)', min: 1, max: 2 },
      { label: 'Sometimes used (3-10)', min: 3, max: 10 },
      { label: 'Frequently used (10+)', min: 10, max: Infinity }
    ]

    const rangeCounts = new Map<string, number>()
    const activeRanges = new Set(
      activeFilters
        .filter(f => f.field === 'usageCount' && f.isActive)
        .map(f => f.value)
    )

    tools.forEach(tool => {
      const range = usageRanges.find(r => tool.usageCount >= r.min && tool.usageCount <= r.max)
      if (range) {
        rangeCounts.set(range.label, (rangeCounts.get(range.label) || 0) + 1)
      }
    })

    return {
      field: 'usageCount',
      label: 'Usage',
      values: usageRanges.map(range => ({
        value: range.label,
        label: range.label,
        count: rangeCounts.get(range.label) || 0,
        selected: activeRanges.has(range.label)
      })).filter(v => v.count > 0)
    }
  }

  private generateTagsFacet(tools: Tool[], activeFilters: SearchFilter[]): SearchFacet | null {
    const tagCounts = new Map<string, number>()
    const activeTags = new Set(
      activeFilters
        .filter(f => f.field === 'tags' && f.isActive)
        .map(f => f.value)
    )

    tools.forEach(tool => {
      tool.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      })
    })

    if (tagCounts.size === 0) return null

    return {
      field: 'tags',
      label: 'Tags',
      values: Array.from(tagCounts.entries())
        .map(([tag, count]) => ({
          value: tag,
          label: tag,
          count,
          selected: activeTags.has(tag)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10) // Limit to top 10 tags
    }
  }

  private recordSearch(query: string, filters: SearchFilter[], resultCount: number): void {
    const searchRecord: SearchHistory = {
      id: this.generateSearchId(),
      query,
      filters: filters.filter(f => f.isActive),
      timestamp: new Date(),
      resultCount,
      clickedTools: []
    }

    this.searchHistory.push(searchRecord)
    
    // Keep only last 100 searches
    if (this.searchHistory.length > 100) {
      this.searchHistory = this.searchHistory.slice(-100)
    }

    this.persistToStorage()
  }

  private loadDefaultPresets(): void {
    const defaultPresets: SearchPreset[] = [
      {
        id: 'frequently-used',
        name: 'Frequently Used',
        description: 'Tools you use most often',
        icon: 'TrendingUp',
        category: 'productivity',
        filters: [
          { type: 'usage', field: 'usageCount', operator: 'greater_than', value: 5, label: 'Used more than 5 times' }
        ],
        sortBy: 'usage',
        sortOrder: 'desc'
      },
      {
        id: 'favorites',
        name: 'Favorites',
        description: 'Your starred tools',
        icon: 'Star',
        category: 'productivity',
        filters: [
          { type: 'favorite', field: 'isFavorite', operator: 'equals', value: true, label: 'Favorites only' }
        ],
        sortBy: 'name',
        sortOrder: 'asc'
      },
      {
        id: 'recent',
        name: 'Recently Used',
        description: 'Tools used in the last week',
        icon: 'Clock',
        category: 'productivity',
        filters: [
          { 
            type: 'date', 
            field: 'lastUsed', 
            operator: 'greater_than', 
            value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 
            label: 'Used this week' 
          }
        ],
        sortBy: 'recent',
        sortOrder: 'desc'
      },
      {
        id: 'unused',
        name: 'Unused Tools',
        description: 'Tools you haven\'t tried yet',
        icon: 'AlertCircle',
        category: 'discovery',
        filters: [
          { type: 'usage', field: 'usageCount', operator: 'equals', value: 0, label: 'Never used' }
        ],
        sortBy: 'created',
        sortOrder: 'desc'
      },
      {
        id: 'productivity-tools',
        name: 'Productivity Tools',
        description: 'Tools in the productivity category',
        icon: 'Zap',
        category: 'productivity',
        filters: [
          { type: 'category', field: 'category', operator: 'equals', value: ToolCategory.PRODUCTIVITY, label: 'Productivity category' }
        ],
        sortBy: 'usage',
        sortOrder: 'desc'
      }
    ]

    defaultPresets.forEach(preset => {
      this.searchPresets.set(preset.id, preset)
    })
  }

  private generateFilterId(): string {
    return `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateSearchId(): string {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateFilterLabel(
    type: SearchFilter['type'],
    field: string,
    operator: SearchFilter['operator'],
    value: any
  ): string {
    const fieldLabels: Record<string, string> = {
      category: 'Category',
      usageCount: 'Usage',
      lastUsed: 'Last used',
      isFavorite: 'Favorite',
      tags: 'Tags',
      name: 'Name',
      description: 'Description'
    }

    const operatorLabels: Record<string, string> = {
      equals: 'is',
      contains: 'contains',
      greater_than: 'greater than',
      less_than: 'less than',
      between: 'between',
      in: 'in',
      not_in: 'not in'
    }

    const fieldLabel = fieldLabels[field] || field
    const operatorLabel = operatorLabels[operator] || operator

    return `${fieldLabel} ${operatorLabel} ${value}`
  }

  private getUserId(): string {
    let userId = localStorage.getItem('app-studio-user-id')
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('app-studio-user-id', userId)
    }
    return userId
  }

  private persistToStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const data = {
        __schemaVersion: 1,
        savedSearches: Array.from(this.savedSearches.entries()),
        searchHistory: this.searchHistory.slice(-50), // Keep only last 50
        presets: Array.from(this.searchPresets.entries())
      }

      localStorage.setItem('app-studio-advanced-search', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to persist advanced search data:', error)
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem('app-studio-advanced-search')
      if (!stored) return

      const data = JSON.parse(stored)

      if (data.savedSearches) {
        this.savedSearches = new Map(data.savedSearches.map(([id, search]: [string, any]) => [
          id,
          {
            ...search,
            createdAt: new Date(search.createdAt),
            lastUsed: new Date(search.lastUsed)
          }
        ]))
      }

      if (data.searchHistory) {
        this.searchHistory = data.searchHistory.map((record: any) => ({
          ...record,
          timestamp: new Date(record.timestamp)
        }))
      }

      if (data.presets) {
        // Merge with default presets, allowing user customizations
        data.presets.forEach(([id, preset]: [string, any]) => {
          this.searchPresets.set(id, preset)
        })
      }

    } catch (error) {
      console.error('Failed to load advanced search data:', error)
    }
  }
}

// Global advanced search manager instance
export const advancedSearchManager = new AdvancedSearchManager()

// React hook for advanced search
export function useAdvancedSearch() {
  return {
    search: (tools: Tool[], query: string, filters: SearchFilter[], sortBy: string, sortOrder: 'asc' | 'desc') =>
      advancedSearchManager.search(tools, query, filters, sortBy, sortOrder),
    createFilter: (type: SearchFilter['type'], field: string, operator: SearchFilter['operator'], value: any, label?: string) =>
      advancedSearchManager.createFilter(type, field, operator, value, label),
    saveSearch: (name: string, description: string, query: string, filters: SearchFilter[], sortBy: string, sortOrder: 'asc' | 'desc', tags?: string[]) =>
      advancedSearchManager.saveSearch(name, description, query, filters, sortBy, sortOrder, tags),
    loadSavedSearch: (searchId: string) => advancedSearchManager.loadSavedSearch(searchId),
    getSavedSearches: () => advancedSearchManager.getSavedSearches(),
    deleteSavedSearch: (searchId: string) => advancedSearchManager.deleteSavedSearch(searchId),
    getSearchPresets: () => advancedSearchManager.getSearchPresets(),
    applyPreset: (presetId: string) => advancedSearchManager.applyPreset(presetId),
    getSearchHistory: (limit?: number) => advancedSearchManager.getSearchHistory(limit),
    clearSearchHistory: () => advancedSearchManager.clearSearchHistory(),
    getPopularSearchTerms: (limit?: number) => advancedSearchManager.getPopularSearchTerms(limit),
    getFilterSuggestions: (tools: Tool[], currentFilters: SearchFilter[]) =>
      advancedSearchManager.getFilterSuggestions(tools, currentFilters)
  }
}