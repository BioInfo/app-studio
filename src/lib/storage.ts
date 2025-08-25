// Storage utilities for App Studio
// Handles localStorage operations with error handling and migrations

export interface StorageSchema {
  __schemaVersion: number
}

export interface ToolData extends StorageSchema {
  [key: string]: any
}

export interface UserPreferences extends StorageSchema {
  theme: 'light' | 'dark' | 'system'
  layout: 'grid' | 'list'
  favoriteTools: string[]
  recentTools: string[]
  categories: string[]
}

export interface UsageData {
  __schemaVersion: number
  [toolId: string]: {
    usageCount: number
    lastUsed: string // ISO string
    totalTimeSpent?: number
  } | number
}

// Storage keys
export const STORAGE_KEYS = {
  TOOLS: 'app-studio-tools',
  PREFERENCES: 'app-studio-preferences', 
  USAGE: 'app-studio-usage',
  TOOL_DATA: (toolId: string) => `tool-${toolId}-data`
} as const

// Schema versions
const SCHEMA_VERSIONS = {
  TOOLS: 1,
  PREFERENCES: 1,
  USAGE: 1,
  TOOL_DATA: 1
} as const

// Default values
export const DEFAULT_PREFERENCES: UserPreferences = {
  __schemaVersion: SCHEMA_VERSIONS.PREFERENCES,
  theme: 'system',
  layout: 'grid',
  favoriteTools: [],
  recentTools: [],
  categories: ['productivity', 'development', 'design', 'utilities']
}

export const DEFAULT_USAGE_DATA: UsageData = {
  __schemaVersion: SCHEMA_VERSIONS.USAGE
} as UsageData

/**
 * Safe localStorage operations with error handling
 */
export class Storage {
  private static isClient = typeof window !== 'undefined'

  /**
   * Get data from localStorage with fallback
   */
  static get<T>(key: string, defaultValue: T): T {
    if (!this.isClient) return defaultValue

    try {
      const item = localStorage.getItem(key)
      if (item === null) return defaultValue
      
      const parsed = JSON.parse(item)
      return this.migrateData(key, parsed, defaultValue)
    } catch (error) {
      console.warn(`Failed to read from localStorage key "${key}":`, error)
      return defaultValue
    }
  }

  /**
   * Set data in localStorage with error handling
   */
  static set<T extends StorageSchema>(key: string, value: T): boolean {
    if (!this.isClient) return false

    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error(`Failed to write to localStorage key "${key}":`, error)
      return false
    }
  }

  /**
   * Remove data from localStorage
   */
  static remove(key: string): boolean {
    if (!this.isClient) return false

    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error(`Failed to remove localStorage key "${key}":`, error)
      return false
    }
  }

  /**
   * Clear all app data from localStorage
   */
  static clearAll(): boolean {
    if (!this.isClient) return false

    try {
      const keys = [STORAGE_KEYS.TOOLS, STORAGE_KEYS.PREFERENCES, STORAGE_KEYS.USAGE]
      keys.forEach(key => {
        localStorage.removeItem(key)
      })
      
      // Clear tool-specific data
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i)
        if (key?.startsWith('tool-') && key.endsWith('-data')) {
          localStorage.removeItem(key)
        }
      }
      
      return true
    } catch (error) {
      console.error('Failed to clear localStorage:', error)
      return false
    }
  }

  /**
   * Migrate data to current schema version
   */
  private static migrateData<T>(key: string, data: any, defaultValue: T): T {
    if (!data || typeof data !== 'object') return defaultValue

    const currentVersion = this.getCurrentSchemaVersion(key)
    const dataVersion = data.__schemaVersion || 0

    if (dataVersion === currentVersion) {
      return data as T
    }

    // Perform migrations based on key type
    try {
      const migrated = this.performMigration(key, data, dataVersion, currentVersion)
      return migrated || defaultValue
    } catch (error) {
      console.warn(`Migration failed for key "${key}":`, error)
      return defaultValue
    }
  }

  /**
   * Get current schema version for a storage key
   */
  private static getCurrentSchemaVersion(key: string): number {
    if (key === STORAGE_KEYS.TOOLS) return SCHEMA_VERSIONS.TOOLS
    if (key === STORAGE_KEYS.PREFERENCES) return SCHEMA_VERSIONS.PREFERENCES
    if (key === STORAGE_KEYS.USAGE) return SCHEMA_VERSIONS.USAGE
    if (key.startsWith('tool-') && key.endsWith('-data')) return SCHEMA_VERSIONS.TOOL_DATA
    return 1
  }

  /**
   * Perform schema migrations
   */
  private static performMigration(key: string, data: any, fromVersion: number, toVersion: number): any {
    let migrated = { ...data }

    // Add migration logic here as schemas evolve
    // Example:
    // if (key === STORAGE_KEYS.PREFERENCES && fromVersion < 2) {
    //   migrated.newField = 'defaultValue'
    // }

    migrated.__schemaVersion = toVersion
    return migrated
  }
}

/**
 * Convenience functions for specific data types
 */
export const PreferencesStorage = {
  get: (): UserPreferences => Storage.get(STORAGE_KEYS.PREFERENCES, DEFAULT_PREFERENCES),
  set: (preferences: UserPreferences): boolean => Storage.set(STORAGE_KEYS.PREFERENCES, preferences),
  update: (updates: Partial<Omit<UserPreferences, '__schemaVersion'>>): boolean => {
    const current = PreferencesStorage.get()
    return PreferencesStorage.set({ ...current, ...updates })
  }
}

export const UsageStorage = {
  get: (): UsageData => Storage.get(STORAGE_KEYS.USAGE, DEFAULT_USAGE_DATA),
  set: (usage: UsageData): boolean => Storage.set(STORAGE_KEYS.USAGE, usage),
  updateTool: (toolId: string, updates: Partial<{usageCount: number, lastUsed: string, totalTimeSpent?: number}>): boolean => {
    const current = UsageStorage.get()
    const existing = current[toolId]
    const toolUsage = (typeof existing === 'object' && existing !== null)
      ? existing
      : { usageCount: 0, lastUsed: new Date().toISOString() }
    
    current[toolId] = { ...toolUsage, ...updates }
    return UsageStorage.set(current)
  },
  incrementUsage: (toolId: string): boolean => {
    const current = UsageStorage.get()
    const existing = current[toolId]
    const currentCount = (typeof existing === 'object' && existing !== null) ? existing.usageCount : 0
    
    return UsageStorage.updateTool(toolId, {
      usageCount: currentCount + 1,
      lastUsed: new Date().toISOString()
    })
  }
}

export const ToolDataStorage = {
  get: <T extends ToolData>(toolId: string, defaultValue: T): T => 
    Storage.get(STORAGE_KEYS.TOOL_DATA(toolId), defaultValue),
  set: <T extends ToolData>(toolId: string, data: T): boolean => 
    Storage.set(STORAGE_KEYS.TOOL_DATA(toolId), data),
  remove: (toolId: string): boolean => 
    Storage.remove(STORAGE_KEYS.TOOL_DATA(toolId))
}