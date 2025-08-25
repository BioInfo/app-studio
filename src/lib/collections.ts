// Collections and Workflows for App Studio
// Allows users to group tools into custom collections

import { Tool } from './tool-registry'

export interface Collection {
  id: string
  name: string
  description: string
  icon: string
  color: string
  toolIds: string[]
  createdAt: Date
  updatedAt: Date
  isWorkflow: boolean // true for workflows, false for simple collections
  workflowSteps?: WorkflowStep[]
}

export interface WorkflowStep {
  toolId: string
  order: number
  description?: string
  autoAdvance?: boolean // automatically proceed to next step
  waitTime?: number // seconds to wait before auto-advance
}

export interface PersistedCollection {
  id: string
  name: string
  description: string
  icon: string
  color: string
  toolIds: string[]
  createdAt: string
  updatedAt: string
  isWorkflow: boolean
  workflowSteps?: WorkflowStep[]
}

/**
 * Convert Collection to persistable format
 */
export function toPersistedCollection(collection: Collection): PersistedCollection {
  return {
    ...collection,
    createdAt: collection.createdAt.toISOString(),
    updatedAt: collection.updatedAt.toISOString()
  }
}

/**
 * Convert persisted collection to runtime format
 */
export function fromPersistedCollection(persisted: PersistedCollection): Collection {
  return {
    ...persisted,
    createdAt: new Date(persisted.createdAt),
    updatedAt: new Date(persisted.updatedAt)
  }
}

/**
 * Collection Manager class
 */
export class CollectionManager {
  private collections: Map<string, Collection> = new Map()
  private initialized = false

  /**
   * Initialize collections from storage
   */
  async initialize(): Promise<void> {
    if (this.initialized) return
    
    this.loadFromStorage()
    this.initialized = true
  }

  /**
   * Get all collections
   */
  getAll(): Collection[] {
    return Array.from(this.collections.values())
  }

  /**
   * Get collection by ID
   */
  get(id: string): Collection | undefined {
    return this.collections.get(id)
  }

  /**
   * Get collections by type
   */
  getCollections(): Collection[] {
    return this.getAll().filter(c => !c.isWorkflow)
  }

  /**
   * Get workflows
   */
  getWorkflows(): Collection[] {
    return this.getAll().filter(c => c.isWorkflow)
  }

  /**
   * Create a new collection
   */
  createCollection(data: {
    name: string
    description: string
    icon?: string
    color?: string
    toolIds?: string[]
    isWorkflow?: boolean
    workflowSteps?: WorkflowStep[]
  }): { success: boolean; errors: string[]; collection?: Collection } {
    const errors = this.validateCollectionData(data)
    
    // Check for duplicate name
    const existingCollection = this.getAll().find(c => c.name.toLowerCase() === data.name.toLowerCase())
    if (existingCollection) {
      errors.push(`Collection with name "${data.name}" already exists`)
    }
    
    if (errors.length > 0) {
      return { success: false, errors }
    }
    
    const collection: Collection = {
      id: this.generateId(),
      name: data.name,
      description: data.description,
      icon: data.icon || 'Folder',
      color: data.color || '#6366f1',
      toolIds: data.toolIds || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isWorkflow: data.isWorkflow || false,
      workflowSteps: data.workflowSteps
    }
    
    this.collections.set(collection.id, collection)
    this.persistToStorage()
    
    return { success: true, errors: [], collection }
  }

  /**
   * Update an existing collection
   */
  updateCollection(id: string, updates: Partial<Omit<Collection, 'id' | 'createdAt'>>): { success: boolean; errors: string[] } {
    const collection = this.collections.get(id)
    if (!collection) {
      return { success: false, errors: [`Collection with ID "${id}" not found`] }
    }
    
    const updatedCollection = { 
      ...collection, 
      ...updates, 
      updatedAt: new Date() 
    }
    
    const errors = this.validateCollectionData(updatedCollection)
    
    // Check for duplicate name if name is being updated
    if (updates.name && updates.name !== collection.name) {
      const existingCollection = this.getAll().find(c => 
        c.name.toLowerCase() === updates.name!.toLowerCase() && c.id !== id
      )
      if (existingCollection) {
        errors.push(`Collection with name "${updates.name}" already exists`)
      }
    }
    
    if (errors.length > 0) {
      return { success: false, errors }
    }
    
    this.collections.set(id, updatedCollection)
    this.persistToStorage()
    
    return { success: true, errors: [] }
  }

  /**
   * Delete a collection
   */
  deleteCollection(id: string): boolean {
    const success = this.collections.delete(id)
    if (success) {
      this.persistToStorage()
    }
    return success
  }

  /**
   * Add tool to collection
   */
  addToolToCollection(collectionId: string, toolId: string): boolean {
    const collection = this.collections.get(collectionId)
    if (!collection) return false
    
    if (!collection.toolIds.includes(toolId)) {
      collection.toolIds.push(toolId)
      collection.updatedAt = new Date()
      this.persistToStorage()
    }
    
    return true
  }

  /**
   * Remove tool from collection
   */
  removeToolFromCollection(collectionId: string, toolId: string): boolean {
    const collection = this.collections.get(collectionId)
    if (!collection) return false
    
    const index = collection.toolIds.indexOf(toolId)
    if (index > -1) {
      collection.toolIds.splice(index, 1)
      collection.updatedAt = new Date()
      
      // Remove from workflow steps if it's a workflow
      if (collection.isWorkflow && collection.workflowSteps) {
        collection.workflowSteps = collection.workflowSteps.filter(step => step.toolId !== toolId)
      }
      
      this.persistToStorage()
    }
    
    return true
  }

  /**
   * Get collections that contain a specific tool
   */
  getCollectionsForTool(toolId: string): Collection[] {
    return this.getAll().filter(collection => 
      collection.toolIds.includes(toolId)
    )
  }

  /**
   * Validate collection data
   */
  private validateCollectionData(data: Partial<Collection>): string[] {
    const errors: string[] = []
    
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push('Collection name is required')
    }
    
    if (!data.description || typeof data.description !== 'string') {
      errors.push('Collection description is required')
    }
    
    if (data.isWorkflow && data.workflowSteps) {
      // Validate workflow steps
      const toolIds = new Set()
      for (const step of data.workflowSteps) {
        if (!step.toolId) {
          errors.push('All workflow steps must have a tool ID')
        }
        if (toolIds.has(step.toolId)) {
          errors.push('Workflow steps cannot contain duplicate tools')
        }
        toolIds.add(step.toolId)
        
        if (typeof step.order !== 'number' || step.order < 0) {
          errors.push('Workflow step order must be a non-negative number')
        }
      }
    }
    
    return errors
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `collection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Persist collections to localStorage
   */
  private persistToStorage(): void {
    if (typeof window === 'undefined') return
    
    try {
      const persistedCollections = this.getAll().map(toPersistedCollection)
      localStorage.setItem('app-studio-collections', JSON.stringify({
        __schemaVersion: 1,
        collections: persistedCollections
      }))
    } catch (error) {
      console.error('Failed to persist collections:', error)
    }
  }

  /**
   * Load collections from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem('app-studio-collections')
      if (!stored) return
      
      const data = JSON.parse(stored)
      if (data.collections && Array.isArray(data.collections)) {
        data.collections.forEach((persistedCollection: any) => {
          try {
            const collection = fromPersistedCollection(persistedCollection)
            this.collections.set(collection.id, collection)
          } catch (error) {
            console.warn('Failed to load collection from storage:', persistedCollection, error)
          }
        })
      }
    } catch (error) {
      console.error('Failed to load collections from storage:', error)
    }
  }
}

// Global collection manager instance
export const collectionManager = new CollectionManager()

// Predefined color options for collections
export const COLLECTION_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#6b7280'  // gray
]

// Predefined icons for collections
export const COLLECTION_ICONS = [
  'Folder',
  'FolderOpen',
  'Star',
  'Heart',
  'Bookmark',
  'Tag',
  'Archive',
  'Package',
  'Briefcase',
  'Layers',
  'Grid3x3',
  'List',
  'Workflow',
  'Zap',
  'Target'
]