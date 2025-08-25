// Tool Performance Monitoring and Optimization for App Studio
// Tracks performance metrics, identifies bottlenecks, and provides optimization suggestions

export interface PerformanceMetric {
  id: string
  toolId: string
  sessionId: string
  timestamp: Date
  type: 'load' | 'interaction' | 'computation' | 'render' | 'memory' | 'error'
  duration?: number
  memoryUsage?: number
  cpuUsage?: number
  errorMessage?: string
  userAgent?: string
  viewport?: { width: number; height: number }
  metadata?: Record<string, any>
}

export interface PerformanceReport {
  toolId: string
  period: 'hour' | 'day' | 'week' | 'month'
  metrics: {
    averageLoadTime: number
    averageInteractionTime: number
    memoryUsage: {
      average: number
      peak: number
      trend: 'increasing' | 'decreasing' | 'stable'
    }
    errorRate: number
    usageFrequency: number
    performanceScore: number // 0-100
  }
  issues: PerformanceIssue[]
  recommendations: PerformanceRecommendation[]
  generatedAt: Date
}

export interface PerformanceIssue {
  id: string
  type: 'slow_load' | 'memory_leak' | 'high_cpu' | 'frequent_errors' | 'poor_ux'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  affectedMetrics: string[]
  firstDetected: Date
  lastOccurred: Date
  occurrenceCount: number
  impact: string
}

export interface PerformanceRecommendation {
  id: string
  type: 'optimization' | 'caching' | 'lazy_loading' | 'code_splitting' | 'memory_management'
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  estimatedImpact: string
  implementationEffort: 'low' | 'medium' | 'high'
  relatedIssues: string[]
}

export interface PerformanceThreshold {
  metric: string
  warning: number
  critical: number
  unit: string
}

export interface OptimizationSuggestion {
  toolId: string
  type: 'preload' | 'cache' | 'lazy_load' | 'compress' | 'minify'
  description: string
  estimatedImprovement: number
  implementationComplexity: 'low' | 'medium' | 'high'
}

/**
 * Performance Monitor class
 */
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map()
  private reports: Map<string, PerformanceReport[]> = new Map()
  private thresholds: PerformanceThreshold[] = []
  private observers: Map<string, PerformanceObserver> = new Map()
  private initialized = false

  // Default performance thresholds
  private defaultThresholds: PerformanceThreshold[] = [
    { metric: 'loadTime', warning: 2000, critical: 5000, unit: 'ms' },
    { metric: 'interactionTime', warning: 100, critical: 300, unit: 'ms' },
    { metric: 'memoryUsage', warning: 50, critical: 100, unit: 'MB' },
    { metric: 'errorRate', warning: 0.05, critical: 0.1, unit: '%' },
    { metric: 'renderTime', warning: 16, critical: 33, unit: 'ms' }
  ]

  /**
   * Initialize performance monitoring
   */
  async initialize(): Promise<void> {
    if (this.initialized || typeof window === 'undefined') return

    this.thresholds = [...this.defaultThresholds]
    this.loadFromStorage()
    this.setupPerformanceObservers()
    this.startPeriodicReporting()
    this.initialized = true
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp' | 'sessionId'>): void {
    const fullMetric: PerformanceMetric = {
      ...metric,
      id: this.generateMetricId(),
      timestamp: new Date(),
      sessionId: this.getSessionId(),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    }

    const toolMetrics = this.metrics.get(metric.toolId) || []
    toolMetrics.push(fullMetric)
    this.metrics.set(metric.toolId, toolMetrics)

    // Keep only last 1000 metrics per tool to prevent memory issues
    if (toolMetrics.length > 1000) {
      toolMetrics.splice(0, toolMetrics.length - 1000)
    }

    this.checkThresholds(fullMetric)
    this.persistToStorage()
  }

  /**
   * Start performance tracking for a tool
   */
  startTracking(toolId: string): PerformanceTracker {
    return new PerformanceTracker(toolId, this)
  }

  /**
   * Generate performance report for a tool
   */
  generateReport(toolId: string, period: 'hour' | 'day' | 'week' | 'month' = 'day'): PerformanceReport {
    const metrics = this.getMetricsForPeriod(toolId, period)
    const issues = this.detectIssues(toolId, metrics)
    const recommendations = this.generateRecommendations(toolId, issues, metrics)

    const report: PerformanceReport = {
      toolId,
      period,
      metrics: this.calculateMetrics(metrics),
      issues,
      recommendations,
      generatedAt: new Date()
    }

    // Store report
    const toolReports = this.reports.get(toolId) || []
    toolReports.push(report)
    this.reports.set(toolId, toolReports)

    // Keep only last 10 reports per tool
    if (toolReports.length > 10) {
      toolReports.splice(0, toolReports.length - 10)
    }

    this.persistToStorage()
    return report
  }

  /**
   * Get all performance reports for a tool
   */
  getReports(toolId: string): PerformanceReport[] {
    return this.reports.get(toolId) || []
  }

  /**
   * Get performance metrics for a tool
   */
  getMetrics(toolId: string, limit: number = 100): PerformanceMetric[] {
    const metrics = this.metrics.get(toolId) || []
    return metrics.slice(-limit).reverse()
  }

  /**
   * Get optimization suggestions for a tool
   */
  getOptimizationSuggestions(toolId: string): OptimizationSuggestion[] {
    const metrics = this.metrics.get(toolId) || []
    const suggestions: OptimizationSuggestion[] = []

    // Analyze load times
    const loadMetrics = metrics.filter(m => m.type === 'load' && m.duration)
    if (loadMetrics.length > 0) {
      const avgLoadTime = loadMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / loadMetrics.length

      if (avgLoadTime > 3000) {
        suggestions.push({
          toolId,
          type: 'lazy_load',
          description: 'Implement lazy loading for heavy components to improve initial load time',
          estimatedImprovement: Math.min(50, avgLoadTime * 0.3),
          implementationComplexity: 'medium'
        })
      }

      if (avgLoadTime > 2000) {
        suggestions.push({
          toolId,
          type: 'cache',
          description: 'Add caching for frequently accessed data and computations',
          estimatedImprovement: Math.min(30, avgLoadTime * 0.2),
          implementationComplexity: 'low'
        })
      }
    }

    // Analyze memory usage
    const memoryMetrics = metrics.filter(m => m.type === 'memory' && m.memoryUsage)
    if (memoryMetrics.length > 0) {
      const avgMemory = memoryMetrics.reduce((sum, m) => sum + (m.memoryUsage || 0), 0) / memoryMetrics.length

      if (avgMemory > 50) {
        suggestions.push({
          toolId,
          type: 'compress',
          description: 'Optimize memory usage by compressing large data structures',
          estimatedImprovement: avgMemory * 0.25,
          implementationComplexity: 'high'
        })
      }
    }

    // Analyze interaction times
    const interactionMetrics = metrics.filter(m => m.type === 'interaction' && m.duration)
    if (interactionMetrics.length > 0) {
      const avgInteractionTime = interactionMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / interactionMetrics.length

      if (avgInteractionTime > 200) {
        suggestions.push({
          toolId,
          type: 'preload',
          description: 'Preload critical resources to reduce interaction latency',
          estimatedImprovement: Math.min(40, avgInteractionTime * 0.4),
          implementationComplexity: 'medium'
        })
      }
    }

    return suggestions
  }

  /**
   * Clear metrics for a tool
   */
  clearMetrics(toolId: string): void {
    this.metrics.delete(toolId)
    this.reports.delete(toolId)
    this.persistToStorage()
  }

  /**
   * Private helper methods
   */
  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('app-studio-session-id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('app-studio-session-id', sessionId)
    }
    return sessionId
  }

  private getMetricsForPeriod(toolId: string, period: 'hour' | 'day' | 'week' | 'month'): PerformanceMetric[] {
    const metrics = this.metrics.get(toolId) || []
    const now = new Date()
    const cutoff = new Date()

    switch (period) {
      case 'hour':
        cutoff.setHours(now.getHours() - 1)
        break
      case 'day':
        cutoff.setDate(now.getDate() - 1)
        break
      case 'week':
        cutoff.setDate(now.getDate() - 7)
        break
      case 'month':
        cutoff.setMonth(now.getMonth() - 1)
        break
    }

    return metrics.filter(m => m.timestamp >= cutoff)
  }

  private calculateMetrics(metrics: PerformanceMetric[]): PerformanceReport['metrics'] {
    const loadMetrics = metrics.filter(m => m.type === 'load' && m.duration)
    const interactionMetrics = metrics.filter(m => m.type === 'interaction' && m.duration)
    const memoryMetrics = metrics.filter(m => m.type === 'memory' && m.memoryUsage)
    const errorMetrics = metrics.filter(m => m.type === 'error')

    const averageLoadTime = loadMetrics.length > 0
      ? loadMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / loadMetrics.length
      : 0

    const averageInteractionTime = interactionMetrics.length > 0
      ? interactionMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / interactionMetrics.length
      : 0

    const memoryUsages = memoryMetrics.map(m => m.memoryUsage || 0)
    const averageMemory = memoryUsages.length > 0
      ? memoryUsages.reduce((sum, usage) => sum + usage, 0) / memoryUsages.length
      : 0
    const peakMemory = memoryUsages.length > 0 ? Math.max(...memoryUsages) : 0

    const errorRate = metrics.length > 0 ? errorMetrics.length / metrics.length : 0
    const usageFrequency = metrics.length

    // Calculate performance score (0-100)
    let performanceScore = 100
    if (averageLoadTime > 2000) performanceScore -= 20
    if (averageInteractionTime > 100) performanceScore -= 15
    if (averageMemory > 50) performanceScore -= 15
    if (errorRate > 0.05) performanceScore -= 25
    performanceScore = Math.max(0, performanceScore)

    return {
      averageLoadTime,
      averageInteractionTime,
      memoryUsage: {
        average: averageMemory,
        peak: peakMemory,
        trend: this.calculateMemoryTrend(memoryMetrics)
      },
      errorRate,
      usageFrequency,
      performanceScore
    }
  }

  private calculateMemoryTrend(memoryMetrics: PerformanceMetric[]): 'increasing' | 'decreasing' | 'stable' {
    if (memoryMetrics.length < 10) return 'stable'

    const recent = memoryMetrics.slice(-5).map(m => m.memoryUsage || 0)
    const older = memoryMetrics.slice(-10, -5).map(m => m.memoryUsage || 0)

    const recentAvg = recent.reduce((sum, usage) => sum + usage, 0) / recent.length
    const olderAvg = older.reduce((sum, usage) => sum + usage, 0) / older.length

    const diff = recentAvg - olderAvg
    const threshold = olderAvg * 0.1 // 10% threshold

    if (diff > threshold) return 'increasing'
    if (diff < -threshold) return 'decreasing'
    return 'stable'
  }

  private detectIssues(toolId: string, metrics: PerformanceMetric[]): PerformanceIssue[] {
    const issues: PerformanceIssue[] = []

    // Check for slow load times
    const loadMetrics = metrics.filter(m => m.type === 'load' && m.duration)
    const slowLoads = loadMetrics.filter(m => (m.duration || 0) > 3000)
    if (slowLoads.length > loadMetrics.length * 0.2) {
      issues.push({
        id: `slow_load_${toolId}`,
        type: 'slow_load',
        severity: slowLoads.length > loadMetrics.length * 0.5 ? 'high' : 'medium',
        description: `Tool is loading slowly in ${Math.round((slowLoads.length / loadMetrics.length) * 100)}% of cases`,
        affectedMetrics: ['loadTime'],
        firstDetected: slowLoads[0]?.timestamp || new Date(),
        lastOccurred: slowLoads[slowLoads.length - 1]?.timestamp || new Date(),
        occurrenceCount: slowLoads.length,
        impact: 'Users experience delays when accessing the tool'
      })
    }

    // Check for memory issues
    const memoryMetrics = metrics.filter(m => m.type === 'memory' && m.memoryUsage)
    const highMemory = memoryMetrics.filter(m => (m.memoryUsage || 0) > 100)
    if (highMemory.length > 0) {
      issues.push({
        id: `high_memory_${toolId}`,
        type: 'memory_leak',
        severity: highMemory.length > memoryMetrics.length * 0.3 ? 'critical' : 'medium',
        description: `High memory usage detected (>${Math.max(...highMemory.map(m => m.memoryUsage || 0))}MB)`,
        affectedMetrics: ['memoryUsage'],
        firstDetected: highMemory[0]?.timestamp || new Date(),
        lastOccurred: highMemory[highMemory.length - 1]?.timestamp || new Date(),
        occurrenceCount: highMemory.length,
        impact: 'May cause browser slowdown or crashes'
      })
    }

    // Check for frequent errors
    const errorMetrics = metrics.filter(m => m.type === 'error')
    const errorRate = metrics.length > 0 ? errorMetrics.length / metrics.length : 0
    if (errorRate > 0.1) {
      issues.push({
        id: `frequent_errors_${toolId}`,
        type: 'frequent_errors',
        severity: errorRate > 0.2 ? 'critical' : 'high',
        description: `High error rate: ${Math.round(errorRate * 100)}% of interactions result in errors`,
        affectedMetrics: ['errorRate'],
        firstDetected: errorMetrics[0]?.timestamp || new Date(),
        lastOccurred: errorMetrics[errorMetrics.length - 1]?.timestamp || new Date(),
        occurrenceCount: errorMetrics.length,
        impact: 'Users frequently encounter errors when using the tool'
      })
    }

    return issues
  }

  private generateRecommendations(
    toolId: string, 
    issues: PerformanceIssue[], 
    metrics: PerformanceMetric[]
  ): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = []

    // Recommendations based on issues
    issues.forEach(issue => {
      switch (issue.type) {
        case 'slow_load':
          recommendations.push({
            id: `opt_load_${toolId}`,
            type: 'lazy_loading',
            priority: 'high',
            title: 'Implement Lazy Loading',
            description: 'Load components and resources only when needed to improve initial load time',
            estimatedImpact: 'Reduce load time by 30-50%',
            implementationEffort: 'medium',
            relatedIssues: [issue.id]
          })
          break

        case 'memory_leak':
          recommendations.push({
            id: `opt_memory_${toolId}`,
            type: 'memory_management',
            priority: 'critical',
            title: 'Optimize Memory Usage',
            description: 'Implement proper cleanup and memory management to prevent leaks',
            estimatedImpact: 'Reduce memory usage by 40-60%',
            implementationEffort: 'high',
            relatedIssues: [issue.id]
          })
          break

        case 'frequent_errors':
          recommendations.push({
            id: `opt_errors_${toolId}`,
            type: 'optimization',
            priority: 'critical',
            title: 'Improve Error Handling',
            description: 'Add comprehensive error handling and validation to prevent failures',
            estimatedImpact: 'Reduce error rate by 70-90%',
            implementationEffort: 'medium',
            relatedIssues: [issue.id]
          })
          break
      }
    })

    // General optimization recommendations
    const loadMetrics = metrics.filter(m => m.type === 'load' && m.duration)
    if (loadMetrics.length > 0) {
      const avgLoadTime = loadMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / loadMetrics.length
      
      if (avgLoadTime > 1000) {
        recommendations.push({
          id: `cache_${toolId}`,
          type: 'caching',
          priority: 'medium',
          title: 'Implement Caching Strategy',
          description: 'Cache frequently accessed data and computed results',
          estimatedImpact: 'Reduce load time by 20-40%',
          implementationEffort: 'low',
          relatedIssues: []
        })
      }
    }

    return recommendations
  }

  private checkThresholds(metric: PerformanceMetric): void {
    const threshold = this.thresholds.find(t => {
      switch (t.metric) {
        case 'loadTime':
          return metric.type === 'load' && metric.duration
        case 'interactionTime':
          return metric.type === 'interaction' && metric.duration
        case 'memoryUsage':
          return metric.type === 'memory' && metric.memoryUsage
        default:
          return false
      }
    })

    if (!threshold) return

    let value = 0
    switch (threshold.metric) {
      case 'loadTime':
      case 'interactionTime':
        value = metric.duration || 0
        break
      case 'memoryUsage':
        value = metric.memoryUsage || 0
        break
    }

    if (value > threshold.critical) {
      console.warn(`Critical performance threshold exceeded for ${metric.toolId}: ${threshold.metric} = ${value}${threshold.unit}`)
    } else if (value > threshold.warning) {
      console.warn(`Performance warning for ${metric.toolId}: ${threshold.metric} = ${value}${threshold.unit}`)
    }
  }

  private setupPerformanceObservers(): void {
    if (!window.PerformanceObserver) return

    // Observe navigation timing
    try {
      const navObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming
            this.recordMetric({
              toolId: 'app-studio',
              type: 'load',
              duration: navEntry.loadEventEnd - navEntry.loadEventStart,
              metadata: {
                domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
                firstPaint: navEntry.loadEventEnd - navEntry.fetchStart
              }
            })
          }
        })
      })
      navObserver.observe({ entryTypes: ['navigation'] })
      this.observers.set('navigation', navObserver)
    } catch (error) {
      console.warn('Failed to setup navigation observer:', error)
    }

    // Observe memory usage (if available)
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory
        if (memory) {
          this.recordMetric({
            toolId: 'app-studio',
            type: 'memory',
            memoryUsage: memory.usedJSHeapSize / (1024 * 1024), // Convert to MB
            metadata: {
              totalJSHeapSize: memory.totalJSHeapSize / (1024 * 1024),
              jsHeapSizeLimit: memory.jsHeapSizeLimit / (1024 * 1024)
            }
          })
        }
      }, 30000) // Every 30 seconds
    }
  }

  private startPeriodicReporting(): void {
    // Generate reports every hour for active tools
    setInterval(() => {
      this.metrics.forEach((_, toolId) => {
        this.generateReport(toolId, 'hour')
      })
    }, 60 * 60 * 1000) // Every hour
  }

  private persistToStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const data = {
        __schemaVersion: 1,
        metrics: Array.from(this.metrics.entries()).map(([toolId, metrics]) => [
          toolId,
          metrics.slice(-100) // Keep only last 100 metrics per tool
        ]),
        reports: Array.from(this.reports.entries()),
        thresholds: this.thresholds
      }

      localStorage.setItem('app-studio-performance', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to persist performance data:', error)
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem('app-studio-performance')
      if (!stored) return

      const data = JSON.parse(stored)

      if (data.metrics) {
        this.metrics = new Map(data.metrics.map(([toolId, metrics]: [string, any[]]) => [
          toolId,
          metrics.map(m => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
        ]))
      }

      if (data.reports) {
        this.reports = new Map(data.reports.map(([toolId, reports]: [string, any[]]) => [
          toolId,
          reports.map(r => ({
            ...r,
            generatedAt: new Date(r.generatedAt),
            issues: r.issues.map((issue: any) => ({
              ...issue,
              firstDetected: new Date(issue.firstDetected),
              lastOccurred: new Date(issue.lastOccurred)
            }))
          }))
        ]))
      }

      if (data.thresholds) {
        this.thresholds = data.thresholds
      }

    } catch (error) {
      console.error('Failed to load performance data:', error)
    }
  }
}

/**
 * Performance Tracker for individual tool sessions
 */
export class PerformanceTracker {
  private startTime: number
  private toolId: string
  private monitor: PerformanceMonitor
  private interactions: number = 0

  constructor(toolId: string, monitor: PerformanceMonitor) {
    this.toolId = toolId
    this.monitor = monitor
    this.startTime = performance.now()
  }

  /**
   * Record tool load completion
   */
  recordLoad(): void {
    const duration = performance.now() - this.startTime
    this.monitor.recordMetric({
      toolId: this.toolId,
      type: 'load',
      duration
    })
  }

  /**
   * Record user interaction
   */
  recordInteraction(type: string, duration?: number): void {
    this.interactions++
    this.monitor.recordMetric({
      toolId: this.toolId,
      type: 'interaction',
      duration,
      metadata: { interactionType: type, totalInteractions: this.interactions }
    })
  }

  /**
   * Record computation time
   */
  recordComputation(operation: string, duration: number): void {
    this.monitor.recordMetric({
      toolId: this.toolId,
      type: 'computation',
      duration,
      metadata: { operation }
    })
  }

  /**
   * Record error
   */
  recordError(error: Error | string): void {
    this.monitor.recordMetric({
      toolId: this.toolId,
      type: 'error',
      errorMessage: error instanceof Error ? error.message : error,
      metadata: { stack: error instanceof Error ? error.stack : undefined }
    })
  }

  /**
   * Record render time
   */
  recordRender(componentName: string, duration: number): void {
    this.monitor.recordMetric({
      toolId: this.toolId,
      type: 'render',
      duration,
      metadata: { component: componentName }
    })
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

// Performance monitoring hook for React components
export function usePerformanceTracking(toolId: string) {
  const tracker = performanceMonitor.startTracking(toolId)
  
  return {
    recordLoad: () => tracker.recordLoad(),
    recordInteraction: (type: string, duration?: number) => tracker.recordInteraction(type, duration),
    recordComputation: (operation: string, duration: number) => tracker.recordComputation(operation, duration),
    recordError: (error: Error | string) => tracker.recordError(error),
    recordRender: (componentName: string, duration: number) => tracker.recordRender(componentName, duration)
  }
}