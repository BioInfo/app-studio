// Advanced Workflow Automation for App Studio
// Provides automated workflow execution, scheduling, and monitoring

import { Collection, WorkflowStep, collectionManager } from './collections'
import { toolRegistry } from './tool-registry'
import { UsageStorage } from './storage'

export interface WorkflowExecution {
  id: string
  workflowId: string
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
  currentStepIndex: number
  startedAt: Date
  completedAt?: Date
  pausedAt?: Date
  error?: string
  stepResults: WorkflowStepResult[]
  totalDuration?: number
  autoAdvanceEnabled: boolean
}

export interface WorkflowStepResult {
  stepIndex: number
  toolId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  startedAt?: Date
  completedAt?: Date
  duration?: number
  error?: string
  data?: any
}

export interface WorkflowSchedule {
  id: string
  workflowId: string
  name: string
  enabled: boolean
  type: 'once' | 'daily' | 'weekly' | 'monthly' | 'interval'
  scheduledAt?: Date
  intervalMinutes?: number
  daysOfWeek?: number[] // 0-6, Sunday = 0
  dayOfMonth?: number
  createdAt: Date
  lastRun?: Date
  nextRun?: Date
  runCount: number
}

export interface WorkflowTrigger {
  id: string
  workflowId: string
  type: 'tool_usage' | 'time_based' | 'data_change' | 'external_event'
  enabled: boolean
  conditions: Record<string, any>
  createdAt: Date
  lastTriggered?: Date
  triggerCount: number
}

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  steps: WorkflowStep[]
  variables: WorkflowVariable[]
  tags: string[]
  isPublic: boolean
  createdAt: Date
  usageCount: number
}

export interface WorkflowVariable {
  name: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'file'
  defaultValue?: any
  required: boolean
  description: string
}

export interface WorkflowMetrics {
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  averageDuration: number
  lastExecuted?: Date
  mostUsedStep?: string
  errorRate: number
}

/**
 * Workflow Automation Engine
 */
export class WorkflowAutomationEngine {
  private executions: Map<string, WorkflowExecution> = new Map()
  private schedules: Map<string, WorkflowSchedule> = new Map()
  private triggers: Map<string, WorkflowTrigger> = new Map()
  private templates: Map<string, WorkflowTemplate> = new Map()
  private timers: Map<string, NodeJS.Timeout> = new Map()
  private initialized = false

  /**
   * Initialize the automation engine
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    this.loadFromStorage()
    this.startScheduler()
    this.setupTriggerListeners()
    this.initialized = true
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(
    workflowId: string, 
    options: {
      autoAdvance?: boolean
      variables?: Record<string, any>
      scheduledExecution?: boolean
    } = {}
  ): Promise<WorkflowExecution> {
    const workflow = collectionManager.get(workflowId)
    if (!workflow || !workflow.isWorkflow) {
      throw new Error(`Workflow with ID "${workflowId}" not found`)
    }

    const execution: WorkflowExecution = {
      id: this.generateExecutionId(),
      workflowId,
      status: 'pending',
      currentStepIndex: 0,
      startedAt: new Date(),
      stepResults: [],
      autoAdvanceEnabled: options.autoAdvance ?? true
    }

    this.executions.set(execution.id, execution)
    
    // Initialize step results
    if (workflow.workflowSteps) {
      execution.stepResults = workflow.workflowSteps.map((step, index) => ({
        stepIndex: index,
        toolId: step.toolId,
        status: 'pending'
      }))
    }

    // Start execution
    await this.runWorkflowExecution(execution, options.variables)
    
    this.persistToStorage()
    return execution
  }

  /**
   * Run workflow execution
   */
  private async runWorkflowExecution(
    execution: WorkflowExecution, 
    variables?: Record<string, any>
  ): Promise<void> {
    const workflow = collectionManager.get(execution.workflowId)
    if (!workflow?.workflowSteps) return

    execution.status = 'running'

    try {
      for (let i = execution.currentStepIndex; i < workflow.workflowSteps.length; i++) {
        const step = workflow.workflowSteps[i]
        const stepResult = execution.stepResults[i]

        execution.currentStepIndex = i
        stepResult.status = 'running'
        stepResult.startedAt = new Date()

        try {
          // Execute step
          await this.executeWorkflowStep(step, stepResult, variables)
          
          stepResult.status = 'completed'
          stepResult.completedAt = new Date()
          stepResult.duration = stepResult.completedAt.getTime() - stepResult.startedAt!.getTime()

          // Record tool usage
          UsageStorage.incrementUsage(step.toolId)

          // Handle auto-advance
          if (step.autoAdvance && execution.autoAdvanceEnabled) {
            if (step.waitTime && step.waitTime > 0) {
              await this.delay(step.waitTime * 1000)
            }
          } else if (!execution.autoAdvanceEnabled) {
            // Pause for manual advancement
            execution.status = 'paused'
            execution.pausedAt = new Date()
            this.persistToStorage()
            return
          }

        } catch (error) {
          stepResult.status = 'failed'
          stepResult.error = error instanceof Error ? error.message : String(error)
          stepResult.completedAt = new Date()
          
          execution.status = 'failed'
          execution.error = `Step ${i + 1} failed: ${stepResult.error}`
          this.persistToStorage()
          return
        }
      }

      // Workflow completed successfully
      execution.status = 'completed'
      execution.completedAt = new Date()
      execution.totalDuration = execution.completedAt.getTime() - execution.startedAt.getTime()

    } catch (error) {
      execution.status = 'failed'
      execution.error = error instanceof Error ? error.message : String(error)
    }

    this.persistToStorage()
  }

  /**
   * Execute a single workflow step
   */
  private async executeWorkflowStep(
    step: WorkflowStep,
    stepResult: WorkflowStepResult,
    variables?: Record<string, any>
  ): Promise<void> {
    const tool = toolRegistry.get(step.toolId)
    if (!tool) {
      throw new Error(`Tool "${step.toolId}" not found`)
    }

    // For now, we'll simulate step execution
    // In a real implementation, this would integrate with the actual tool execution
    await this.delay(Math.random() * 1000 + 500) // Simulate processing time

    stepResult.data = {
      toolId: step.toolId,
      toolName: tool.name,
      executedAt: new Date().toISOString(),
      variables: variables || {},
      description: step.description
    }
  }

  /**
   * Pause workflow execution
   */
  pauseExecution(executionId: string): boolean {
    const execution = this.executions.get(executionId)
    if (!execution || execution.status !== 'running') return false

    execution.status = 'paused'
    execution.pausedAt = new Date()
    this.persistToStorage()
    return true
  }

  /**
   * Resume workflow execution
   */
  async resumeExecution(executionId: string): Promise<boolean> {
    const execution = this.executions.get(executionId)
    if (!execution || execution.status !== 'paused') return false

    execution.status = 'running'
    execution.pausedAt = undefined
    
    await this.runWorkflowExecution(execution)
    return true
  }

  /**
   * Cancel workflow execution
   */
  cancelExecution(executionId: string): boolean {
    const execution = this.executions.get(executionId)
    if (!execution || ['completed', 'failed', 'cancelled'].includes(execution.status)) {
      return false
    }

    execution.status = 'cancelled'
    execution.completedAt = new Date()
    this.persistToStorage()
    return true
  }

  /**
   * Schedule a workflow
   */
  scheduleWorkflow(schedule: Omit<WorkflowSchedule, 'id' | 'createdAt' | 'runCount'>): WorkflowSchedule {
    const newSchedule: WorkflowSchedule = {
      ...schedule,
      id: this.generateScheduleId(),
      createdAt: new Date(),
      runCount: 0
    }

    this.calculateNextRun(newSchedule)
    this.schedules.set(newSchedule.id, newSchedule)
    this.setupScheduleTimer(newSchedule)
    this.persistToStorage()

    return newSchedule
  }

  /**
   * Create workflow trigger
   */
  createTrigger(trigger: Omit<WorkflowTrigger, 'id' | 'createdAt' | 'triggerCount'>): WorkflowTrigger {
    const newTrigger: WorkflowTrigger = {
      ...trigger,
      id: this.generateTriggerId(),
      createdAt: new Date(),
      triggerCount: 0
    }

    this.triggers.set(newTrigger.id, newTrigger)
    this.persistToStorage()

    return newTrigger
  }

  /**
   * Get workflow metrics
   */
  getWorkflowMetrics(workflowId: string): WorkflowMetrics {
    const executions = Array.from(this.executions.values())
      .filter(e => e.workflowId === workflowId)

    const totalExecutions = executions.length
    const successfulExecutions = executions.filter(e => e.status === 'completed').length
    const failedExecutions = executions.filter(e => e.status === 'failed').length
    
    const completedExecutions = executions.filter(e => e.totalDuration)
    const averageDuration = completedExecutions.length > 0
      ? completedExecutions.reduce((sum, e) => sum + (e.totalDuration || 0), 0) / completedExecutions.length
      : 0

    const lastExecuted = executions.length > 0
      ? new Date(Math.max(...executions.map(e => e.startedAt.getTime())))
      : undefined

    return {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      averageDuration,
      lastExecuted,
      errorRate: totalExecutions > 0 ? failedExecutions / totalExecutions : 0
    }
  }

  /**
   * Get all executions
   */
  getExecutions(): WorkflowExecution[] {
    return Array.from(this.executions.values())
  }

  /**
   * Get executions for a specific workflow
   */
  getWorkflowExecutions(workflowId: string): WorkflowExecution[] {
    return Array.from(this.executions.values())
      .filter(e => e.workflowId === workflowId)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
  }

  /**
   * Get all schedules
   */
  getSchedules(): WorkflowSchedule[] {
    return Array.from(this.schedules.values())
  }

  /**
   * Get all triggers
   */
  getTriggers(): WorkflowTrigger[] {
    return Array.from(this.triggers.values())
  }

  /**
   * Private helper methods
   */
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateScheduleId(): string {
    return `sched_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateTriggerId(): string {
    return `trig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private calculateNextRun(schedule: WorkflowSchedule): void {
    const now = new Date()
    
    switch (schedule.type) {
      case 'once':
        schedule.nextRun = schedule.scheduledAt
        break
      case 'daily':
        schedule.nextRun = new Date(now.getTime() + 24 * 60 * 60 * 1000)
        break
      case 'weekly':
        schedule.nextRun = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        break
      case 'monthly':
        const nextMonth = new Date(now)
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        schedule.nextRun = nextMonth
        break
      case 'interval':
        if (schedule.intervalMinutes) {
          schedule.nextRun = new Date(now.getTime() + schedule.intervalMinutes * 60 * 1000)
        }
        break
    }
  }

  private setupScheduleTimer(schedule: WorkflowSchedule): void {
    if (!schedule.enabled || !schedule.nextRun) return

    const delay = schedule.nextRun.getTime() - Date.now()
    if (delay <= 0) return

    const timer = setTimeout(async () => {
      try {
        await this.executeWorkflow(schedule.workflowId, { scheduledExecution: true })
        schedule.lastRun = new Date()
        schedule.runCount++
        
        // Calculate next run
        this.calculateNextRun(schedule)
        if (schedule.nextRun) {
          this.setupScheduleTimer(schedule)
        }
        
        this.persistToStorage()
      } catch (error) {
        console.error(`Scheduled workflow execution failed:`, error)
      }
    }, delay)

    this.timers.set(schedule.id, timer)
  }

  private startScheduler(): void {
    // Setup timers for all enabled schedules
    this.schedules.forEach(schedule => {
      if (schedule.enabled) {
        this.setupScheduleTimer(schedule)
      }
    })
  }

  private setupTriggerListeners(): void {
    // Setup event listeners for triggers
    // This would integrate with the actual tool usage events
  }

  private persistToStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const data = {
        __schemaVersion: 1,
        executions: Array.from(this.executions.entries()),
        schedules: Array.from(this.schedules.entries()),
        triggers: Array.from(this.triggers.entries()),
        templates: Array.from(this.templates.entries())
      }

      localStorage.setItem('app-studio-workflow-automation', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to persist workflow automation data:', error)
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem('app-studio-workflow-automation')
      if (!stored) return

      const data = JSON.parse(stored)
      
      if (data.executions) {
        this.executions = new Map(data.executions.map(([id, exec]: [string, any]) => [
          id,
          {
            ...exec,
            startedAt: new Date(exec.startedAt),
            completedAt: exec.completedAt ? new Date(exec.completedAt) : undefined,
            pausedAt: exec.pausedAt ? new Date(exec.pausedAt) : undefined,
            stepResults: exec.stepResults.map((result: any) => ({
              ...result,
              startedAt: result.startedAt ? new Date(result.startedAt) : undefined,
              completedAt: result.completedAt ? new Date(result.completedAt) : undefined
            }))
          }
        ]))
      }

      if (data.schedules) {
        this.schedules = new Map(data.schedules.map(([id, sched]: [string, any]) => [
          id,
          {
            ...sched,
            createdAt: new Date(sched.createdAt),
            scheduledAt: sched.scheduledAt ? new Date(sched.scheduledAt) : undefined,
            lastRun: sched.lastRun ? new Date(sched.lastRun) : undefined,
            nextRun: sched.nextRun ? new Date(sched.nextRun) : undefined
          }
        ]))
      }

      if (data.triggers) {
        this.triggers = new Map(data.triggers.map(([id, trig]: [string, any]) => [
          id,
          {
            ...trig,
            createdAt: new Date(trig.createdAt),
            lastTriggered: trig.lastTriggered ? new Date(trig.lastTriggered) : undefined
          }
        ]))
      }

      if (data.templates) {
        this.templates = new Map(data.templates.map(([id, temp]: [string, any]) => [
          id,
          {
            ...temp,
            createdAt: new Date(temp.createdAt)
          }
        ]))
      }

    } catch (error) {
      console.error('Failed to load workflow automation data:', error)
    }
  }
}

// Global automation engine instance
export const workflowAutomationEngine = new WorkflowAutomationEngine()

// Predefined workflow templates
export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'daily-productivity',
    name: 'Daily Productivity Workflow',
    description: 'A workflow to start your productive day with essential tools',
    category: 'productivity',
    steps: [
      { toolId: 'text-cleaner', order: 0, description: 'Clean up notes from yesterday', autoAdvance: true, waitTime: 2 },
      { toolId: 'markdown-formatter', order: 1, description: 'Format daily agenda', autoAdvance: true, waitTime: 3 },
      { toolId: 'email-validator', order: 2, description: 'Validate contact lists', autoAdvance: false }
    ],
    variables: [
      { name: 'startTime', type: 'date', required: true, description: 'When to start the workflow' },
      { name: 'includeEmail', type: 'boolean', defaultValue: true, required: false, description: 'Include email validation step' }
    ],
    tags: ['productivity', 'daily', 'automation'],
    isPublic: true,
    createdAt: new Date(),
    usageCount: 0
  },
  {
    id: 'design-workflow',
    name: 'Design Asset Preparation',
    description: 'Prepare and optimize design assets for web and print',
    category: 'design',
    steps: [
      { toolId: 'color-picker', order: 0, description: 'Select color palette', autoAdvance: false },
      { toolId: 'image-resizer', order: 1, description: 'Resize images for different formats', autoAdvance: true, waitTime: 1 }
    ],
    variables: [
      { name: 'targetFormats', type: 'string', defaultValue: 'web,print', required: true, description: 'Target output formats' },
      { name: 'quality', type: 'number', defaultValue: 85, required: false, description: 'Image quality percentage' }
    ],
    tags: ['design', 'images', 'optimization'],
    isPublic: true,
    createdAt: new Date(),
    usageCount: 0
  }
]