'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Square, 
  Clock, 
  Zap, 
  Calendar,
  Settings,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Timer,
  Target,
  Activity,
  PlayCircle,
  PauseCircle,
  StopCircle,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react'
import { 
  workflowAutomationEngine, 
  WorkflowExecution, 
  WorkflowSchedule, 
  WorkflowTrigger,
  WorkflowMetrics,
  WORKFLOW_TEMPLATES
} from '@/lib/workflow-automation'
import { collectionManager, Collection } from '@/lib/collections'
import { toolRegistry } from '@/lib/tool-registry'

interface WorkflowAutomationManagerProps {
  workflowId?: string
}

const WorkflowAutomationManager: React.FC<WorkflowAutomationManagerProps> = ({ workflowId }) => {
  const [workflows, setWorkflows] = useState<Collection[]>([])
  const [executions, setExecutions] = useState<WorkflowExecution[]>([])
  const [schedules, setSchedules] = useState<WorkflowSchedule[]>([])
  const [triggers, setTriggers] = useState<WorkflowTrigger[]>([])
  const [selectedWorkflow, setSelectedWorkflow] = useState<Collection | null>(null)
  const [activeTab, setActiveTab] = useState<'executions' | 'schedules' | 'triggers' | 'metrics'>('executions')
  const [isLoading, setIsLoading] = useState(true)
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [showTriggerForm, setShowTriggerForm] = useState(false)
  const [metrics, setMetrics] = useState<WorkflowMetrics | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedWorkflow) {
      loadWorkflowData(selectedWorkflow.id)
    }
  }, [selectedWorkflow])

  const loadData = async () => {
    await workflowAutomationEngine.initialize()
    await collectionManager.initialize()
    
    const allCollections = collectionManager.getAll()
    const workflowCollections = allCollections.filter(c => c.isWorkflow)
    
    setWorkflows(workflowCollections)
    setExecutions(workflowAutomationEngine.getExecutions())
    setSchedules(workflowAutomationEngine.getSchedules())
    setTriggers(workflowAutomationEngine.getTriggers())
    
    if (workflowId) {
      const workflow = workflowCollections.find(w => w.id === workflowId)
      if (workflow) {
        setSelectedWorkflow(workflow)
      }
    } else if (workflowCollections.length > 0) {
      setSelectedWorkflow(workflowCollections[0])
    }
    
    setIsLoading(false)
  }

  const loadWorkflowData = (workflowId: string) => {
    const workflowExecutions = workflowAutomationEngine.getWorkflowExecutions(workflowId)
    const workflowMetrics = workflowAutomationEngine.getWorkflowMetrics(workflowId)
    
    setExecutions(workflowExecutions)
    setMetrics(workflowMetrics)
  }

  const executeWorkflow = async (workflow: Collection, autoAdvance: boolean = true) => {
    try {
      await workflowAutomationEngine.executeWorkflow(workflow.id, { autoAdvance })
      loadWorkflowData(workflow.id)
    } catch (error) {
      console.error('Failed to execute workflow:', error)
    }
  }

  const pauseExecution = (executionId: string) => {
    workflowAutomationEngine.pauseExecution(executionId)
    loadWorkflowData(selectedWorkflow!.id)
  }

  const resumeExecution = async (executionId: string) => {
    await workflowAutomationEngine.resumeExecution(executionId)
    loadWorkflowData(selectedWorkflow!.id)
  }

  const cancelExecution = (executionId: string) => {
    workflowAutomationEngine.cancelExecution(executionId)
    loadWorkflowData(selectedWorkflow!.id)
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
    return 'Just now'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />
      case 'running': return <PlayCircle className="w-4 h-4 text-blue-500 animate-pulse" />
      case 'paused': return <PauseCircle className="w-4 h-4 text-yellow-500" />
      case 'cancelled': return <StopCircle className="w-4 h-4 text-gray-500" />
      default: return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400'
      case 'failed': return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400'
      case 'running': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400'
      case 'paused': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'cancelled': return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400'
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading workflow automation...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/collections"
            className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Collections
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Workflow Automation</h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
                Automate your workflows with scheduling, triggers, and advanced execution controls.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Workflow Selector */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Workflows</h2>
              
              {workflows.length === 0 ? (
                <div className="text-center py-8">
                  <Zap className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">No workflows found</p>
                  <Link
                    href="/collections"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Create Workflow
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {workflows.map((workflow) => (
                    <button
                      key={workflow.id}
                      onClick={() => setSelectedWorkflow(workflow)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedWorkflow?.id === workflow.id
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: workflow.color }}
                        />
                        <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          {workflow.name}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                        {workflow.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                        <span>{workflow.toolIds.length} steps</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedWorkflow ? (
              <>
                {/* Workflow Header */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: selectedWorkflow.color }}
                      >
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                          {selectedWorkflow.name}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          {selectedWorkflow.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => executeWorkflow(selectedWorkflow, true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Play className="w-4 h-4" />
                        Run Auto
                      </button>
                      <button
                        onClick={() => executeWorkflow(selectedWorkflow, false)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <PlayCircle className="w-4 h-4" />
                        Run Manual
                      </button>
                    </div>
                  </div>

                  {/* Workflow Steps Preview */}
                  {selectedWorkflow.workflowSteps && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                      {selectedWorkflow.workflowSteps.map((step, index) => {
                        const tool = toolRegistry.get(step.toolId)
                        return (
                          <div key={index} className="flex items-center gap-2 flex-shrink-0">
                            <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                {index + 1}
                              </span>
                              <span className="text-sm text-gray-900 dark:text-gray-100">
                                {tool?.name || step.toolId}
                              </span>
                              {step.autoAdvance && (
                                <div title="Auto-advance enabled">
                                  <Zap className="w-3 h-3 text-yellow-500" />
                                </div>
                              )}
                            </div>
                            {index < selectedWorkflow.workflowSteps!.length - 1 && (
                              <ArrowLeft className="w-4 h-4 text-gray-400 rotate-180" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Tabs */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                  <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="flex">
                      {[
                        { id: 'executions', label: 'Executions', icon: Activity },
                        { id: 'schedules', label: 'Schedules', icon: Calendar },
                        { id: 'triggers', label: 'Triggers', icon: Target },
                        { id: 'metrics', label: 'Metrics', icon: BarChart3 }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                            activeTab === tab.id
                              ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
                        >
                          <tab.icon className="w-4 h-4" />
                          {tab.label}
                        </button>
                      ))}
                    </nav>
                  </div>

                  <div className="p-6">
                    {/* Executions Tab */}
                    {activeTab === 'executions' && (
                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Recent Executions
                          </h3>
                          <button
                            onClick={() => loadWorkflowData(selectedWorkflow.id)}
                            className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                          </button>
                        </div>

                        {executions.length === 0 ? (
                          <div className="text-center py-8">
                            <Activity className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">No executions yet</p>
                            <p className="text-gray-400 dark:text-gray-500 text-sm">
                              Run the workflow to see execution history
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {executions.slice(0, 10).map((execution) => (
                              <div
                                key={execution.id}
                                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    {getStatusIcon(execution.status)}
                                    <div>
                                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(execution.status)}`}>
                                        {execution.status.charAt(0).toUpperCase() + execution.status.slice(1)}
                                      </span>
                                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        Started {formatRelativeTime(execution.startedAt)}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    {execution.status === 'running' && (
                                      <button
                                        onClick={() => pauseExecution(execution.id)}
                                        className="p-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
                                        title="Pause execution"
                                      >
                                        <Pause className="w-4 h-4" />
                                      </button>
                                    )}
                                    {execution.status === 'paused' && (
                                      <button
                                        onClick={() => resumeExecution(execution.id)}
                                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                        title="Resume execution"
                                      >
                                        <Play className="w-4 h-4" />
                                      </button>
                                    )}
                                    {['running', 'paused'].includes(execution.status) && (
                                      <button
                                        onClick={() => cancelExecution(execution.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Cancel execution"
                                      >
                                        <Square className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Execution Progress */}
                                <div className="mb-3">
                                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    <span>Progress: {execution.currentStepIndex + 1} / {execution.stepResults.length}</span>
                                    {execution.totalDuration && (
                                      <span>Duration: {formatDuration(execution.totalDuration)}</span>
                                    )}
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                      style={{
                                        width: `${((execution.currentStepIndex + (execution.status === 'completed' ? 1 : 0)) / execution.stepResults.length) * 100}%`
                                      }}
                                    />
                                  </div>
                                </div>

                                {/* Step Results */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {execution.stepResults.map((result, index) => {
                                    const tool = toolRegistry.get(result.toolId)
                                    return (
                                      <div
                                        key={index}
                                        className={`p-2 rounded-lg border text-xs ${
                                          result.status === 'completed'
                                            ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                                            : result.status === 'failed'
                                            ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                                            : result.status === 'running'
                                            ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                                            : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 mb-1">
                                          {getStatusIcon(result.status)}
                                          <span className="font-medium text-gray-900 dark:text-gray-100">
                                            {tool?.name || result.toolId}
                                          </span>
                                        </div>
                                        {result.duration && (
                                          <p className="text-gray-600 dark:text-gray-400">
                                            {formatDuration(result.duration)}
                                          </p>
                                        )}
                                        {result.error && (
                                          <p className="text-red-600 dark:text-red-400 mt-1">
                                            {result.error}
                                          </p>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Metrics Tab */}
                    {activeTab === 'metrics' && metrics && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                          Workflow Metrics
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Executions</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                              {metrics.totalExecutions}
                            </p>
                          </div>

                          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                              <span className="text-sm font-medium text-green-900 dark:text-green-100">Success Rate</span>
                            </div>
                            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                              {metrics.totalExecutions > 0 
                                ? Math.round((metrics.successfulExecutions / metrics.totalExecutions) * 100)
                                : 0}%
                            </p>
                          </div>

                          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Timer className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                              <span className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Avg Duration</span>
                            </div>
                            <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                              {metrics.averageDuration > 0 ? formatDuration(metrics.averageDuration) : 'N/A'}
                            </p>
                          </div>

                          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                              <span className="text-sm font-medium text-red-900 dark:text-red-100">Error Rate</span>
                            </div>
                            <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                              {Math.round(metrics.errorRate * 100)}%
                            </p>
                          </div>
                        </div>

                        {metrics.lastExecuted && (
                          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Last executed: {formatRelativeTime(metrics.lastExecuted)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Schedules and Triggers tabs would be implemented similarly */}
                    {activeTab === 'schedules' && (
                      <div className="text-center py-8">
                        <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">Scheduling feature coming soon</p>
                      </div>
                    )}

                    {activeTab === 'triggers' && (
                      <div className="text-center py-8">
                        <Target className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">Triggers feature coming soon</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
                <Zap className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Select a Workflow
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Choose a workflow from the sidebar to view its automation details.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkflowAutomationManager