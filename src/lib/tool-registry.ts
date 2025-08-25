// Tool Registry for App Studio
// Manages tool metadata, registration, and runtime operations

import { UsageStorage } from './storage'
import { createToolSearcher, FuzzyMatch } from './fuzzy-search'

export enum ToolCategory {
  PRODUCTIVITY = 'productivity',
  DEVELOPMENT = 'development', 
  DESIGN = 'design',
  UTILITIES = 'utilities',
  COMMUNICATION = 'communication',
  FINANCE = 'finance'
}

export interface Tool {
  id: string
  name: string
  description: string
  category: ToolCategory
  icon: string // Lucide icon name
  path: string // Route path
  preview?: string // Optional preview image/screenshot
  usageCount: number
  lastUsed: Date | null
  isFavorite: boolean
  tags: string[]
  createdAt: Date
  version: string
  isEnabled?: boolean
}

export interface PersistedTool {
  id: string
  name: string
  description: string
  category: ToolCategory
  icon: string
  path: string
  preview?: string
  usageCount: number
  lastUsed: string | null // ISO string for persistence
  isFavorite: boolean
  tags: string[]
  createdAt: string // ISO string for persistence
  version: string
  isEnabled?: boolean
}

/**
 * Convert Tool to persistable format
 */
export function toPersistedTool(tool: Tool): PersistedTool {
  return {
    ...tool,
    lastUsed: tool.lastUsed?.toISOString() || null,
    createdAt: tool.createdAt.toISOString()
  }
}

/**
 * Convert persisted tool to runtime format
 */
export function fromPersistedTool(persisted: PersistedTool): Tool {
  return {
    ...persisted,
    lastUsed: persisted.lastUsed ? new Date(persisted.lastUsed) : null,
    createdAt: new Date(persisted.createdAt)
  }
}

/**
 * Tool Registry class for managing tools
 */
export class ToolRegistry {
  private tools: Map<string, Tool> = new Map()
  private initialized = false
  private fuzzySearcher = createToolSearcher()

  /**
   * Initialize registry with default tools and load from storage
   */
  async initialize(defaultTools: Tool[] = []): Promise<void> {
    if (this.initialized) return

    // Load from storage first
    this.loadFromStorage()

    // Add default tools if they don't exist
    defaultTools.forEach(tool => {
      if (!this.tools.has(tool.id)) {
        this.tools.set(tool.id, tool)
      }
    })

    // Load usage data and update tools
    this.syncUsageData()

    // Persist any new default tools
    this.persistToStorage()

    this.initialized = true
  }

  /**
   * Get all tools
   */
  getAll(): Tool[] {
    return Array.from(this.tools.values())
  }

  /**
   * Get tool by ID
   */
  get(id: string): Tool | undefined {
    return this.tools.get(id)
  }

  /**
   * Add or update a tool
   */
  set(tool: Tool): void {
    this.tools.set(tool.id, tool)
  }

  /**
   * Remove a tool
   */
  remove(id: string): boolean {
    return this.tools.delete(id)
  }

  /**
   * Get tools by category
   */
  getByCategory(category: ToolCategory): Tool[] {
    return this.getAll().filter(tool => tool.category === category)
  }

  /**
   * Get favorite tools
   */
  getFavorites(): Tool[] {
    return this.getAll().filter(tool => tool.isFavorite)
  }

  /**
   * Get recently used tools
   */
  getRecentlyUsed(limit: number = 5): Tool[] {
    return this.getAll()
      .filter(tool => tool.lastUsed !== null)
      .sort((a, b) => {
        if (!a.lastUsed || !b.lastUsed) return 0
        return b.lastUsed.getTime() - a.lastUsed.getTime()
      })
      .slice(0, limit)
  }

  /**
   * Get most used tools
   */
  getMostUsed(limit: number = 5): Tool[] {
    return this.getAll()
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit)
  }

  /**
   * Search tools by name, description, or tags (exact matching)
   */
  search(query: string): Tool[] {
    const lowerQuery = query.toLowerCase()
    return this.getAll().filter(tool =>
      tool.name.toLowerCase().includes(lowerQuery) ||
      tool.description.toLowerCase().includes(lowerQuery) ||
      tool.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  }

  /**
   * Fuzzy search tools with scoring and match highlighting
   */
  fuzzySearch(query: string): FuzzyMatch[] {
    const tools = this.getAll()
    return this.fuzzySearcher.search(query, tools)
  }

  /**
   * Get fuzzy search results as Tool array (for backward compatibility)
   */
  fuzzySearchTools(query: string): Tool[] {
    return this.fuzzySearch(query).map(match => match.item)
  }

  /**
   * Toggle favorite status
   */
  toggleFavorite(id: string): boolean {
    const tool = this.tools.get(id)
    if (!tool) return false

    tool.isFavorite = !tool.isFavorite
    return true
  }

  /**
   * Record tool usage
   */
  recordUsage(id: string): boolean {
    const tool = this.tools.get(id)
    if (!tool) return false

    tool.usageCount += 1
    tool.lastUsed = new Date()

    // Update storage
    UsageStorage.incrementUsage(id)
    
    return true
  }

  /**
   * Sync usage data from storage
   */
  private syncUsageData(): void {
    const usageData = UsageStorage.get()
    
    this.tools.forEach(tool => {
      const usage = usageData[tool.id]
      if (typeof usage === 'object' && usage !== null) {
        tool.usageCount = usage.usageCount
        tool.lastUsed = usage.lastUsed ? new Date(usage.lastUsed) : null
      }
    })
  }

  /**
   * Get tools filtered and sorted
   */
  getFiltered(options: {
    category?: ToolCategory | 'all'
    search?: string
    sortBy?: 'name' | 'usage' | 'recent' | 'created' | 'relevance'
    sortOrder?: 'asc' | 'desc'
    favoritesFirst?: boolean
    useFuzzySearch?: boolean
  } = {}): Tool[] {
    let filtered = this.getAll()

    // Filter by category
    if (options.category && options.category !== 'all') {
      filtered = filtered.filter(tool => tool.category === options.category)
    }

    // Filter by search
    if (options.search) {
      if (options.useFuzzySearch) {
        // Use fuzzy search and maintain relevance order
        const fuzzyResults = this.fuzzySearch(options.search)
        const categoryFiltered = options.category && options.category !== 'all'
          ? fuzzyResults.filter(match => match.item.category === options.category)
          : fuzzyResults
        
        if (options.sortBy === 'relevance' || !options.sortBy) {
          return categoryFiltered.map(match => match.item)
        }
        
        filtered = categoryFiltered.map(match => match.item)
      } else {
        filtered = this.search(options.search)
        if (options.category && options.category !== 'all') {
          filtered = filtered.filter(tool => tool.category === options.category)
        }
      }
    }

    // Sort favorites first if requested
    if (options.favoritesFirst) {
      filtered.sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1
        if (!a.isFavorite && b.isFavorite) return 1
        return 0
      })
    }

    // Apply sorting (skip if using fuzzy search with relevance sorting)
    if (!(options.useFuzzySearch && options.search && (options.sortBy === 'relevance' || !options.sortBy))) {
      const sortOrder = options.sortOrder === 'desc' ? -1 : 1
      
      switch (options.sortBy) {
        case 'usage':
          filtered.sort((a, b) => (b.usageCount - a.usageCount) * sortOrder)
          break
        case 'recent':
          filtered.sort((a, b) => {
            if (!a.lastUsed && !b.lastUsed) return 0
            if (!a.lastUsed) return 1 * sortOrder
            if (!b.lastUsed) return -1 * sortOrder
            return (b.lastUsed.getTime() - a.lastUsed.getTime()) * sortOrder
          })
          break
        case 'created':
          filtered.sort((a, b) => (b.createdAt.getTime() - a.createdAt.getTime()) * sortOrder)
          break
        case 'name':
        default:
          filtered.sort((a, b) => a.name.localeCompare(b.name) * sortOrder)
          break
      }
    }

    return filtered
  }

  /**
   * Get filtered tools with fuzzy search results for highlighting
   */
  getFilteredWithMatches(options: {
    category?: ToolCategory | 'all'
    search?: string
    sortBy?: 'name' | 'usage' | 'recent' | 'created' | 'relevance'
    sortOrder?: 'asc' | 'desc'
    favoritesFirst?: boolean
    useFuzzySearch?: boolean
  } = {}): { tools: Tool[], matches: Map<string, FuzzyMatch> } {
    const matchesMap = new Map<string, FuzzyMatch>()
    
    if (options.search && options.useFuzzySearch) {
      const fuzzyResults = this.fuzzySearch(options.search)
      fuzzyResults.forEach(match => {
        matchesMap.set(match.item.id, match)
      })
    }
    
    const tools = this.getFiltered(options)
    return { tools, matches: matchesMap }
  }

  /**
   * Add a new tool to the registry
   */
  addTool(toolData: Omit<Tool, 'usageCount' | 'lastUsed' | 'createdAt'>): { success: boolean; errors: string[] } {
    const errors = ToolRegistry.validateTool(toolData)
    
    // Check for duplicate ID
    if (this.tools.has(toolData.id)) {
      errors.push(`Tool with ID "${toolData.id}" already exists`)
    }
    
    // Check for duplicate path
    const existingToolWithPath = this.getAll().find(tool => tool.path === toolData.path)
    if (existingToolWithPath) {
      errors.push(`Tool with path "${toolData.path}" already exists`)
    }
    
    if (errors.length > 0) {
      return { success: false, errors }
    }
    
    const newTool: Tool = {
      ...toolData,
      usageCount: 0,
      lastUsed: null,
      createdAt: new Date()
    }
    
    this.tools.set(newTool.id, newTool)
    this.persistToStorage()
    
    return { success: true, errors: [] }
  }

  /**
   * Update an existing tool
   */
  updateTool(id: string, updates: Partial<Omit<Tool, 'id' | 'usageCount' | 'lastUsed' | 'createdAt'>>): { success: boolean; errors: string[] } {
    const tool = this.tools.get(id)
    if (!tool) {
      return { success: false, errors: [`Tool with ID "${id}" not found`] }
    }
    
    const updatedTool = { ...tool, ...updates }
    const errors = ToolRegistry.validateTool(updatedTool)
    
    // Check for duplicate path if path is being updated
    if (updates.path && updates.path !== tool.path) {
      const existingToolWithPath = this.getAll().find(t => t.path === updates.path && t.id !== id)
      if (existingToolWithPath) {
        errors.push(`Tool with path "${updates.path}" already exists`)
      }
    }
    
    if (errors.length > 0) {
      return { success: false, errors }
    }
    
    this.tools.set(id, updatedTool)
    this.persistToStorage()
    
    return { success: true, errors: [] }
  }

  /**
   * Remove a tool from the registry
   */
  removeTool(id: string): boolean {
    const success = this.tools.delete(id)
    if (success) {
      this.persistToStorage()
      // Optionally remove tool-specific data
      // ToolDataStorage.remove(id)
    }
    return success
  }

  /**
   * Persist registry to localStorage
   */
  private persistToStorage(): void {
    // Only access localStorage on the client side
    if (typeof window === 'undefined') return
    
    try {
      const persistedTools = this.getAll().map(toPersistedTool)
      localStorage.setItem('app-studio-tools', JSON.stringify({
        __schemaVersion: 1,
        tools: persistedTools
      }))
    } catch (error) {
      console.error('Failed to persist tool registry:', error)
    }
  }

  /**
   * Load registry from localStorage
   */
  private loadFromStorage(): void {
    // Only access localStorage on the client side
    if (typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem('app-studio-tools')
      if (!stored) return
      
      const data = JSON.parse(stored)
      if (data.tools && Array.isArray(data.tools)) {
        data.tools.forEach((persistedTool: any) => {
          try {
            const tool = fromPersistedTool(persistedTool)
            this.tools.set(tool.id, tool)
          } catch (error) {
            console.warn('Failed to load tool from storage:', persistedTool, error)
          }
        })
      }
    } catch (error) {
      console.error('Failed to load tool registry from storage:', error)
    }
  }

  /**
   * Validate tool configuration
   */
  static validateTool(tool: Partial<Tool>): string[] {
    const errors: string[] = []

    if (!tool.id || typeof tool.id !== 'string') {
      errors.push('Tool ID is required and must be a string')
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tool.id)) {
      errors.push('Tool ID must be a URL-safe slug (lowercase, hyphen-separated)')
    }

    if (!tool.name || typeof tool.name !== 'string') {
      errors.push('Tool name is required and must be a string')
    }

    if (!tool.description || typeof tool.description !== 'string') {
      errors.push('Tool description is required and must be a string')
    }

    const validCategories = [
      ToolCategory.PRODUCTIVITY,
      ToolCategory.DEVELOPMENT,
      ToolCategory.DESIGN,
      ToolCategory.UTILITIES,
      ToolCategory.COMMUNICATION,
      ToolCategory.FINANCE
    ]
    if (!tool.category || validCategories.indexOf(tool.category as ToolCategory) === -1) {
      errors.push('Tool category is required and must be a valid ToolCategory')
    }

    if (!tool.path || typeof tool.path !== 'string') {
      errors.push('Tool path is required and must be a string')
    } else if (!tool.path.startsWith('/tools/')) {
      errors.push('Tool path must start with "/tools/"')
    }

    if (!tool.version || typeof tool.version !== 'string') {
      errors.push('Tool version is required and must be a string')
    }

    if (!tool.icon || typeof tool.icon !== 'string') {
      errors.push('Tool icon is required and must be a string')
    }

    return errors
  }
}

// Global registry instance
export const toolRegistry = new ToolRegistry()