// Tool Import/Export functionality for App Studio
// Handles sharing and backup of tool configurations

import { Tool, PersistedTool, toPersistedTool, fromPersistedTool } from './tool-registry'
import { Collection } from './collections'
import { UserPreferences } from './storage'

export interface ToolConfiguration {
  id: string
  name: string
  description: string
  category: string
  icon: string
  path: string
  version: string
  tags: string[]
  settings?: Record<string, any>
  customData?: Record<string, any>
}

export interface ToolPackage {
  __packageVersion: string
  __exportedAt: string
  __exportedBy: string
  metadata: {
    name: string
    description: string
    version: string
    author?: string
    website?: string
    license?: string
  }
  tools: ToolConfiguration[]
  collections?: Collection[]
  preferences?: Partial<UserPreferences>
}

export interface ImportResult {
  success: boolean
  imported: {
    tools: number
    collections: number
    preferences: boolean
  }
  skipped: {
    tools: string[]
    collections: string[]
    reasons: string[]
  }
  errors: string[]
}

export class ToolImportExport {
  private static readonly PACKAGE_VERSION = '1.0.0'
  private static readonly MAX_PACKAGE_SIZE = 10 * 1024 * 1024 // 10MB

  /**
   * Export tools as a shareable package
   */
  static exportTools(options: {
    tools: Tool[]
    collections?: Collection[]
    preferences?: Partial<UserPreferences>
    metadata: {
      name: string
      description: string
      version: string
      author?: string
      website?: string
      license?: string
    }
  }): ToolPackage {
    const toolConfigs: ToolConfiguration[] = options.tools.map(tool => ({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      category: tool.category,
      icon: tool.icon,
      path: tool.path,
      version: tool.version,
      tags: tool.tags,
      // Note: We don't export usage data for privacy
    }))

    return {
      __packageVersion: this.PACKAGE_VERSION,
      __exportedAt: new Date().toISOString(),
      __exportedBy: 'App Studio',
      metadata: options.metadata,
      tools: toolConfigs,
      collections: options.collections,
      preferences: options.preferences
    }
  }

  /**
   * Export tools to JSON file
   */
  static async exportToFile(toolPackage: ToolPackage, filename?: string): Promise<void> {
    const json = JSON.stringify(toolPackage, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    
    if (blob.size > this.MAX_PACKAGE_SIZE) {
      throw new Error(`Package size (${Math.round(blob.size / 1024 / 1024)}MB) exceeds maximum allowed size (${this.MAX_PACKAGE_SIZE / 1024 / 1024}MB)`)
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `app-studio-tools-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * Import tools from a package
   */
  static async importFromPackage(
    toolPackage: ToolPackage,
    options: {
      overwriteExisting?: boolean
      importCollections?: boolean
      importPreferences?: boolean
      toolIdPrefix?: string
    } = {}
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: { tools: 0, collections: 0, preferences: false },
      skipped: { tools: [], collections: [], reasons: [] },
      errors: []
    }

    try {
      // Validate package
      const validation = this.validatePackage(toolPackage)
      if (!validation.valid) {
        result.errors.push(...validation.errors)
        return result
      }

      // Import tools
      const { toolRegistry } = await import('./tool-registry')
      await toolRegistry.initialize()

      for (const toolConfig of toolPackage.tools) {
        try {
          const toolId = options.toolIdPrefix ? `${options.toolIdPrefix}-${toolConfig.id}` : toolConfig.id
          const existingTool = toolRegistry.get(toolId)

          if (existingTool && !options.overwriteExisting) {
            result.skipped.tools.push(toolConfig.name)
            result.skipped.reasons.push(`Tool "${toolConfig.name}" already exists`)
            continue
          }

          const newTool: Omit<Tool, 'usageCount' | 'lastUsed' | 'createdAt'> = {
            id: toolId,
            name: toolConfig.name,
            description: toolConfig.description,
            category: toolConfig.category as any,
            icon: toolConfig.icon,
            path: toolConfig.path,
            version: toolConfig.version,
            tags: toolConfig.tags,
            isFavorite: false,
            isEnabled: true
          }

          const addResult = toolRegistry.addTool(newTool)
          if (addResult.success) {
            result.imported.tools++
          } else {
            result.skipped.tools.push(toolConfig.name)
            result.skipped.reasons.push(...addResult.errors)
          }
        } catch (error) {
          result.errors.push(`Failed to import tool "${toolConfig.name}": ${error}`)
        }
      }

      // Import collections
      if (options.importCollections && toolPackage.collections) {
        const { collectionManager } = await import('./collections')
        await collectionManager.initialize()

        for (const collection of toolPackage.collections) {
          try {
            const existingCollection = collectionManager.get(collection.id)
            if (existingCollection && !options.overwriteExisting) {
              result.skipped.collections.push(collection.name)
              continue
            }

            const createResult = collectionManager.createCollection({
              name: collection.name,
              description: collection.description,
              toolIds: collection.toolIds,
              isWorkflow: collection.isWorkflow,
              workflowSteps: collection.workflowSteps
            })
            if (createResult.success) {
              result.imported.collections++
            } else {
              result.skipped.collections.push(collection.name)
              result.skipped.reasons.push(...createResult.errors)
            }
          } catch (error) {
            result.errors.push(`Failed to import collection "${collection.name}": ${error}`)
          }
        }
      }

      // Import preferences (selective)
      if (options.importPreferences && toolPackage.preferences) {
        try {
          const { PreferencesStorage } = await import('./storage')
          const currentPrefs = PreferencesStorage.get()
          
          // Only import non-personal preferences
          const safePreferences: Partial<UserPreferences> = {}
          if (toolPackage.preferences.theme) {
            safePreferences.theme = toolPackage.preferences.theme
          }
          if (toolPackage.preferences.layout) {
            safePreferences.layout = toolPackage.preferences.layout
          }
          // Don't import favorites or recent tools for privacy

          PreferencesStorage.set({ ...currentPrefs, ...safePreferences })
          result.imported.preferences = true
        } catch (error) {
          result.errors.push(`Failed to import preferences: ${error}`)
        }
      }

      result.success = result.errors.length === 0
      return result

    } catch (error) {
      result.errors.push(`Import failed: ${error}`)
      return result
    }
  }

  /**
   * Import tools from JSON file
   */
  static async importFromFile(file: File, options?: Parameters<typeof ToolImportExport.importFromPackage>[1]): Promise<ImportResult> {
    try {
      if (file.size > this.MAX_PACKAGE_SIZE) {
        return {
          success: false,
          imported: { tools: 0, collections: 0, preferences: false },
          skipped: { tools: [], collections: [], reasons: [] },
          errors: [`File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds maximum allowed size (${this.MAX_PACKAGE_SIZE / 1024 / 1024}MB)`]
        }
      }

      const text = await file.text()
      const toolPackage: ToolPackage = JSON.parse(text)
      
      return await this.importFromPackage(toolPackage, options)
    } catch (error) {
      return {
        success: false,
        imported: { tools: 0, collections: 0, preferences: false },
        skipped: { tools: [], collections: [], reasons: [] },
        errors: [`Failed to parse file: ${error}`]
      }
    }
  }

  /**
   * Validate a tool package
   */
  static validatePackage(toolPackage: any): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!toolPackage || typeof toolPackage !== 'object') {
      errors.push('Invalid package format')
      return { valid: false, errors }
    }

    if (!toolPackage.__packageVersion) {
      errors.push('Missing package version')
    }

    if (!toolPackage.metadata || typeof toolPackage.metadata !== 'object') {
      errors.push('Missing or invalid metadata')
    } else {
      if (!toolPackage.metadata.name) errors.push('Missing package name')
      if (!toolPackage.metadata.description) errors.push('Missing package description')
      if (!toolPackage.metadata.version) errors.push('Missing package version')
    }

    if (!Array.isArray(toolPackage.tools)) {
      errors.push('Missing or invalid tools array')
    } else {
      toolPackage.tools.forEach((tool: any, index: number) => {
        if (!tool.id) errors.push(`Tool ${index + 1}: Missing ID`)
        if (!tool.name) errors.push(`Tool ${index + 1}: Missing name`)
        if (!tool.category) errors.push(`Tool ${index + 1}: Missing category`)
        if (!tool.path) errors.push(`Tool ${index + 1}: Missing path`)
      })
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Create a shareable URL for a tool package (for future implementation)
   */
  static async createShareableUrl(toolPackage: ToolPackage): Promise<string> {
    // This would integrate with a sharing service in the future
    // For now, we'll just return a data URL
    const json = JSON.stringify(toolPackage)
    const encoded = btoa(unescape(encodeURIComponent(json)))
    return `data:application/json;base64,${encoded}`
  }

  /**
   * Parse a shareable URL (for future implementation)
   */
  static async parseShareableUrl(url: string): Promise<ToolPackage> {
    if (url.startsWith('data:application/json;base64,')) {
      const encoded = url.replace('data:application/json;base64,', '')
      const json = decodeURIComponent(escape(atob(encoded)))
      return JSON.parse(json)
    }
    
    throw new Error('Invalid shareable URL format')
  }
}