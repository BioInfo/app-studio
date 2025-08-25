// Tool Versioning and Update Management for App Studio
// Handles tool versions, updates, migrations, and compatibility

import { Tool } from './tool-registry'

export interface ToolVersion {
  version: string
  releaseDate: Date
  changelog: string[]
  breaking: boolean
  deprecated: boolean
  securityFixes: string[]
  bugFixes: string[]
  features: string[]
  dependencies: ToolDependency[]
  compatibility: CompatibilityInfo
  downloadUrl?: string
  size?: number
  checksum?: string
}

export interface ToolDependency {
  name: string
  version: string
  required: boolean
  type: 'runtime' | 'development' | 'peer'
}

export interface CompatibilityInfo {
  minAppVersion: string
  maxAppVersion?: string
  browsers: BrowserCompatibility[]
  platforms: string[]
  features: string[]
}

export interface BrowserCompatibility {
  name: string
  minVersion: string
  supported: boolean
}

export interface UpdateInfo {
  toolId: string
  currentVersion: string
  latestVersion: string
  updateType: 'major' | 'minor' | 'patch' | 'security'
  priority: 'low' | 'medium' | 'high' | 'critical'
  autoUpdate: boolean
  releaseNotes: string
  estimatedUpdateTime: number // in minutes
  backupRequired: boolean
  rollbackSupported: boolean
}

export interface UpdateResult {
  success: boolean
  toolId: string
  fromVersion: string
  toVersion: string
  duration: number
  errors: string[]
  warnings: string[]
  backupCreated: boolean
  migrationApplied: boolean
}

export interface VersionHistory {
  toolId: string
  versions: Array<{
    version: string
    installedAt: Date
    updatedAt?: Date
    removedAt?: Date
    source: 'auto' | 'manual' | 'rollback'
    notes?: string
  }>
}

export interface UpdatePolicy {
  autoUpdate: boolean
  updateTypes: Array<'major' | 'minor' | 'patch' | 'security'>
  schedule: 'immediate' | 'daily' | 'weekly' | 'monthly' | 'manual'
  maintenanceWindow?: {
    start: string // HH:MM format
    end: string
    timezone: string
  }
  rollbackTimeout: number // hours
  backupRetention: number // days
}

export interface Migration {
  id: string
  toolId: string
  fromVersion: string
  toVersion: string
  description: string
  type: 'data' | 'config' | 'schema' | 'storage'
  required: boolean
  reversible: boolean
  estimatedTime: number
  script: (oldData: any) => Promise<any>
  rollback?: (newData: any) => Promise<any>
}

/**
 * Version Manager class
 */
export class VersionManager {
  private toolVersions: Map<string, ToolVersion[]> = new Map()
  private updatePolicies: Map<string, UpdatePolicy> = new Map()
  private versionHistory: Map<string, VersionHistory> = new Map()
  private migrations: Map<string, Migration[]> = new Map()
  private pendingUpdates: Map<string, UpdateInfo> = new Map()
  private initialized = false

  /**
   * Initialize version manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    this.loadFromStorage()
    this.setupDefaultPolicies()
    await this.checkForUpdates()
    this.scheduleUpdateChecks()
    this.initialized = true
  }

  /**
   * Register a tool version
   */
  registerToolVersion(toolId: string, version: ToolVersion): void {
    const versions = this.toolVersions.get(toolId) || []
    
    // Check if version already exists
    const existingIndex = versions.findIndex(v => v.version === version.version)
    if (existingIndex >= 0) {
      versions[existingIndex] = version
    } else {
      versions.push(version)
      versions.sort((a, b) => this.compareVersions(b.version, a.version)) // Latest first
    }
    
    this.toolVersions.set(toolId, versions)
    this.persistToStorage()
  }

  /**
   * Get available versions for a tool
   */
  getToolVersions(toolId: string): ToolVersion[] {
    return this.toolVersions.get(toolId) || []
  }

  /**
   * Get latest version for a tool
   */
  getLatestVersion(toolId: string): ToolVersion | null {
    const versions = this.getToolVersions(toolId)
    return versions.length > 0 ? versions[0] : null
  }

  /**
   * Get current installed version
   */
  getCurrentVersion(toolId: string): string | null {
    const history = this.versionHistory.get(toolId)
    if (!history) return null

    const currentInstall = history.versions
      .filter(v => !v.removedAt)
      .sort((a, b) => b.installedAt.getTime() - a.installedAt.getTime())[0]

    return currentInstall?.version || null
  }

  /**
   * Check for updates for all tools
   */
  async checkForUpdates(): Promise<UpdateInfo[]> {
    const updates: UpdateInfo[] = []
    
    this.toolVersions.forEach((versions, toolId) => {
      const currentVersion = this.getCurrentVersion(toolId)
      if (!currentVersion) return

      const latestVersion = this.getLatestVersion(toolId)
      if (!latestVersion) return

      if (this.compareVersions(latestVersion.version, currentVersion) > 0) {
        const updateInfo = this.createUpdateInfo(toolId, currentVersion, latestVersion)
        updates.push(updateInfo)
        this.pendingUpdates.set(toolId, updateInfo)
      }
    })

    this.persistToStorage()
    return updates
  }

  /**
   * Update a tool to a specific version
   */
  async updateTool(toolId: string, targetVersion: string, force: boolean = false): Promise<UpdateResult> {
    const currentVersion = this.getCurrentVersion(toolId)
    if (!currentVersion) {
      return {
        success: false,
        toolId,
        fromVersion: 'unknown',
        toVersion: targetVersion,
        duration: 0,
        errors: ['Tool not currently installed'],
        warnings: [],
        backupCreated: false,
        migrationApplied: false
      }
    }

    const targetVersionInfo = this.getToolVersions(toolId)
      .find(v => v.version === targetVersion)

    if (!targetVersionInfo) {
      return {
        success: false,
        toolId,
        fromVersion: currentVersion,
        toVersion: targetVersion,
        duration: 0,
        errors: [`Version ${targetVersion} not found`],
        warnings: [],
        backupCreated: false,
        migrationApplied: false
      }
    }

    const startTime = Date.now()
    const result: UpdateResult = {
      success: false,
      toolId,
      fromVersion: currentVersion,
      toVersion: targetVersion,
      duration: 0,
      errors: [],
      warnings: [],
      backupCreated: false,
      migrationApplied: false
    }

    try {
      // Check compatibility
      if (!force && !this.isCompatible(targetVersionInfo)) {
        result.errors.push('Version not compatible with current app version')
        return result
      }

      // Create backup if required
      const updateInfo = this.pendingUpdates.get(toolId)
      if (updateInfo?.backupRequired) {
        await this.createBackup(toolId, currentVersion)
        result.backupCreated = true
      }

      // Apply migrations
      const migrations = this.getMigrationsForUpdate(toolId, currentVersion, targetVersion)
      if (migrations.length > 0) {
        await this.applyMigrations(toolId, migrations)
        result.migrationApplied = true
      }

      // Update version history
      this.recordVersionUpdate(toolId, targetVersion, 'manual')

      // Remove from pending updates
      this.pendingUpdates.delete(toolId)

      result.success = true
      result.duration = Date.now() - startTime

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error))
    }

    this.persistToStorage()
    return result
  }

  /**
   * Rollback to previous version
   */
  async rollbackTool(toolId: string): Promise<UpdateResult> {
    const history = this.versionHistory.get(toolId)
    if (!history || history.versions.length < 2) {
      return {
        success: false,
        toolId,
        fromVersion: 'unknown',
        toVersion: 'unknown',
        duration: 0,
        errors: ['No previous version available for rollback'],
        warnings: [],
        backupCreated: false,
        migrationApplied: false
      }
    }

    const currentVersion = this.getCurrentVersion(toolId)
    const previousVersion = history.versions
      .filter(v => !v.removedAt && v.version !== currentVersion)
      .sort((a, b) => b.installedAt.getTime() - a.installedAt.getTime())[0]

    if (!previousVersion) {
      return {
        success: false,
        toolId,
        fromVersion: currentVersion || 'unknown',
        toVersion: 'unknown',
        duration: 0,
        errors: ['No valid previous version found'],
        warnings: [],
        backupCreated: false,
        migrationApplied: false
      }
    }

    return this.updateTool(toolId, previousVersion.version, true)
  }

  /**
   * Get pending updates
   */
  getPendingUpdates(): UpdateInfo[] {
    return Array.from(this.pendingUpdates.values())
  }

  /**
   * Get update policy for a tool
   */
  getUpdatePolicy(toolId: string): UpdatePolicy {
    return this.updatePolicies.get(toolId) || this.getDefaultUpdatePolicy()
  }

  /**
   * Set update policy for a tool
   */
  setUpdatePolicy(toolId: string, policy: UpdatePolicy): void {
    this.updatePolicies.set(toolId, policy)
    this.persistToStorage()
  }

  /**
   * Get version history for a tool
   */
  getVersionHistory(toolId: string): VersionHistory | null {
    return this.versionHistory.get(toolId) || null
  }

  /**
   * Register a migration
   */
  registerMigration(migration: Migration): void {
    const migrations = this.migrations.get(migration.toolId) || []
    migrations.push(migration)
    migrations.sort((a, b) => this.compareVersions(a.toVersion, b.toVersion))
    this.migrations.set(migration.toolId, migrations)
  }

  /**
   * Get update statistics
   */
  getUpdateStatistics(): {
    totalTools: number
    upToDate: number
    pendingUpdates: number
    securityUpdates: number
    lastCheckTime: Date | null
  } {
    const totalTools = this.toolVersions.size
    const pendingUpdates = this.pendingUpdates.size
    const securityUpdates = Array.from(this.pendingUpdates.values())
      .filter(update => update.updateType === 'security').length

    return {
      totalTools,
      upToDate: totalTools - pendingUpdates,
      pendingUpdates,
      securityUpdates,
      lastCheckTime: this.getLastCheckTime()
    }
  }

  /**
   * Private helper methods
   */
  private compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number)
    const v2Parts = version2.split('.').map(Number)
    
    const maxLength = Math.max(v1Parts.length, v2Parts.length)
    
    for (let i = 0; i < maxLength; i++) {
      const v1Part = v1Parts[i] || 0
      const v2Part = v2Parts[i] || 0
      
      if (v1Part > v2Part) return 1
      if (v1Part < v2Part) return -1
    }
    
    return 0
  }

  private createUpdateInfo(toolId: string, currentVersion: string, latestVersion: ToolVersion): UpdateInfo {
    const updateType = this.determineUpdateType(currentVersion, latestVersion.version)
    const priority = this.determineUpdatePriority(latestVersion, updateType)
    const policy = this.getUpdatePolicy(toolId)

    return {
      toolId,
      currentVersion,
      latestVersion: latestVersion.version,
      updateType,
      priority,
      autoUpdate: policy.autoUpdate && policy.updateTypes.includes(updateType),
      releaseNotes: latestVersion.changelog.join('\n'),
      estimatedUpdateTime: this.estimateUpdateTime(latestVersion),
      backupRequired: latestVersion.breaking || updateType === 'major',
      rollbackSupported: true
    }
  }

  private determineUpdateType(currentVersion: string, latestVersion: string): 'major' | 'minor' | 'patch' | 'security' {
    const current = currentVersion.split('.').map(Number)
    const latest = latestVersion.split('.').map(Number)

    if (latest[0] > current[0]) return 'major'
    if (latest[1] > current[1]) return 'minor'
    return 'patch' // Assume patch for now, security would be determined by release notes
  }

  private determineUpdatePriority(version: ToolVersion, updateType: string): 'low' | 'medium' | 'high' | 'critical' {
    if (version.securityFixes.length > 0) return 'critical'
    if (version.breaking) return 'high'
    if (updateType === 'major') return 'medium'
    return 'low'
  }

  private estimateUpdateTime(version: ToolVersion): number {
    // Base time in minutes
    let time = 2

    if (version.breaking) time += 5
    if (version.dependencies.length > 0) time += version.dependencies.length * 0.5
    if (version.size && version.size > 1024 * 1024) time += 2 // Large update

    return Math.ceil(time)
  }

  private isCompatible(version: ToolVersion): boolean {
    // For now, assume all versions are compatible
    // In a real implementation, this would check against app version
    return true
  }

  private async createBackup(toolId: string, version: string): Promise<void> {
    // In a real implementation, this would create a backup of tool data
    console.log(`Creating backup for ${toolId} version ${version}`)
  }

  private getMigrationsForUpdate(toolId: string, fromVersion: string, toVersion: string): Migration[] {
    const migrations = this.migrations.get(toolId) || []
    
    return migrations.filter(migration => {
      const fromCompare = this.compareVersions(migration.fromVersion, fromVersion)
      const toCompare = this.compareVersions(migration.toVersion, toVersion)
      
      return fromCompare >= 0 && toCompare <= 0
    })
  }

  private async applyMigrations(toolId: string, migrations: Migration[]): Promise<void> {
    for (const migration of migrations) {
      try {
        console.log(`Applying migration ${migration.id} for ${toolId}`)
        // In a real implementation, this would execute the migration script
        await migration.script({})
      } catch (error) {
        console.error(`Migration ${migration.id} failed:`, error)
        throw error
      }
    }
  }

  private recordVersionUpdate(toolId: string, version: string, source: 'auto' | 'manual' | 'rollback'): void {
    let history = this.versionHistory.get(toolId)
    if (!history) {
      history = { toolId, versions: [] }
      this.versionHistory.set(toolId, history)
    }

    history.versions.push({
      version,
      installedAt: new Date(),
      source
    })
  }

  private setupDefaultPolicies(): void {
    // Set up default update policies for different tool categories
    const defaultPolicy = this.getDefaultUpdatePolicy()
    
    // Tools would inherit this policy unless overridden
    this.updatePolicies.set('default', defaultPolicy)
  }

  private getDefaultUpdatePolicy(): UpdatePolicy {
    return {
      autoUpdate: false,
      updateTypes: ['security', 'patch'],
      schedule: 'weekly',
      rollbackTimeout: 24,
      backupRetention: 7
    }
  }

  private scheduleUpdateChecks(): void {
    // Check for updates every 6 hours
    setInterval(() => {
      this.checkForUpdates()
    }, 6 * 60 * 60 * 1000)
  }

  private getLastCheckTime(): Date | null {
    const stored = localStorage.getItem('app-studio-last-update-check')
    return stored ? new Date(stored) : null
  }

  private setLastCheckTime(): void {
    localStorage.setItem('app-studio-last-update-check', new Date().toISOString())
  }

  private persistToStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const data = {
        __schemaVersion: 1,
        toolVersions: Array.from(this.toolVersions.entries()),
        updatePolicies: Array.from(this.updatePolicies.entries()),
        versionHistory: Array.from(this.versionHistory.entries()),
        pendingUpdates: Array.from(this.pendingUpdates.entries())
      }

      localStorage.setItem('app-studio-version-manager', JSON.stringify(data))
      this.setLastCheckTime()
    } catch (error) {
      console.error('Failed to persist version manager data:', error)
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem('app-studio-version-manager')
      if (!stored) return

      const data = JSON.parse(stored)

      if (data.toolVersions) {
        this.toolVersions = new Map(data.toolVersions.map(([toolId, versions]: [string, any[]]) => [
          toolId,
          versions.map(v => ({
            ...v,
            releaseDate: new Date(v.releaseDate)
          }))
        ]))
      }

      if (data.updatePolicies) {
        this.updatePolicies = new Map(data.updatePolicies)
      }

      if (data.versionHistory) {
        this.versionHistory = new Map(data.versionHistory.map(([toolId, history]: [string, any]) => [
          toolId,
          {
            ...history,
            versions: history.versions.map((v: any) => ({
              ...v,
              installedAt: new Date(v.installedAt),
              updatedAt: v.updatedAt ? new Date(v.updatedAt) : undefined,
              removedAt: v.removedAt ? new Date(v.removedAt) : undefined
            }))
          }
        ]))
      }

      if (data.pendingUpdates) {
        this.pendingUpdates = new Map(data.pendingUpdates)
      }

    } catch (error) {
      console.error('Failed to load version manager data:', error)
    }
  }
}

// Global version manager instance
export const versionManager = new VersionManager()

// React hook for version management
export function useVersionManager() {
  return {
    getToolVersions: (toolId: string) => versionManager.getToolVersions(toolId),
    getLatestVersion: (toolId: string) => versionManager.getLatestVersion(toolId),
    getCurrentVersion: (toolId: string) => versionManager.getCurrentVersion(toolId),
    checkForUpdates: () => versionManager.checkForUpdates(),
    updateTool: (toolId: string, targetVersion: string, force?: boolean) => 
      versionManager.updateTool(toolId, targetVersion, force),
    rollbackTool: (toolId: string) => versionManager.rollbackTool(toolId),
    getPendingUpdates: () => versionManager.getPendingUpdates(),
    getUpdatePolicy: (toolId: string) => versionManager.getUpdatePolicy(toolId),
    setUpdatePolicy: (toolId: string, policy: UpdatePolicy) => versionManager.setUpdatePolicy(toolId, policy),
    getVersionHistory: (toolId: string) => versionManager.getVersionHistory(toolId),
    getUpdateStatistics: () => versionManager.getUpdateStatistics()
  }
}