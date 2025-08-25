'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  TrendingUp, 
  Clock, 
  Star, 
  BarChart3, 
  PieChart, 
  Calendar,
  Activity,
  Target,
  Zap
} from 'lucide-react'
import { toolRegistry, Tool, ToolCategory } from '@/lib/tool-registry'
import { UsageStorage } from '@/lib/storage'
import { usePreferences } from '@/contexts/PreferencesContext'

interface AnalyticsData {
  totalUsage: number
  totalTools: number
  favoriteCount: number
  mostUsedTool: Tool | null
  recentlyUsedCount: number
  categoryUsage: Record<ToolCategory, number>
  dailyUsage: Array<{ date: string; count: number }>
  toolUsageRanking: Array<{ tool: Tool; usage: number; percentage: number }>
  usageStreaks: {
    current: number
    longest: number
  }
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d')
  const { preferences } = usePreferences()

  useEffect(() => {
    const calculateAnalytics = async () => {
      await toolRegistry.initialize()
      const tools = toolRegistry.getAll()
      const usageData = UsageStorage.get()

      // Calculate total usage
      const totalUsage = Object.values(usageData).reduce((sum: number, data) => {
        const count = typeof data === 'object' && data !== null ? data.usageCount : 0
        return sum + count
      }, 0)

      // Find most used tool
      let mostUsedTool: Tool | null = null
      let maxUsage = 0
      tools.forEach(tool => {
        const usage = usageData[tool.id]
        const count = typeof usage === 'object' && usage !== null ? usage.usageCount : 0
        if (count > maxUsage) {
          maxUsage = count
          mostUsedTool = tool
        }
      })

      // Calculate category usage
      const categoryUsage: Record<ToolCategory, number> = {
        [ToolCategory.PRODUCTIVITY]: 0,
        [ToolCategory.DEVELOPMENT]: 0,
        [ToolCategory.DESIGN]: 0,
        [ToolCategory.UTILITIES]: 0,
        [ToolCategory.COMMUNICATION]: 0,
        [ToolCategory.FINANCE]: 0
      }

      tools.forEach(tool => {
        const usage = usageData[tool.id]
        const count = typeof usage === 'object' && usage !== null ? usage.usageCount : 0
        categoryUsage[tool.category] += count
      })

      // Calculate tool usage ranking
      const toolUsageRanking = tools
        .map(tool => {
          const usage = usageData[tool.id]
          const count = typeof usage === 'object' && usage !== null ? usage.usageCount : 0
          return {
            tool,
            usage: count,
            percentage: totalUsage > 0 ? (count / totalUsage) * 100 : 0
          }
        })
        .sort((a, b) => b.usage - a.usage)
        .slice(0, 10)

      // Calculate daily usage (mock data for now - would need more detailed tracking)
      const dailyUsage = Array.from({ length: 30 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (29 - i))
        return {
          date: date.toISOString().split('T')[0],
          count: Math.floor(Math.random() * 10) + 1 // Mock data
        }
      })

      // Calculate recently used tools count
      const recentlyUsedCount = tools.filter(tool => {
        const usage = usageData[tool.id]
        if (typeof usage === 'object' && usage !== null && usage.lastUsed) {
          const lastUsed = new Date(usage.lastUsed)
          const daysDiff = (Date.now() - lastUsed.getTime()) / (1000 * 60 * 60 * 24)
          return daysDiff <= 7
        }
        return false
      }).length

      // Mock usage streaks calculation
      const usageStreaks = {
        current: Math.floor(Math.random() * 7) + 1,
        longest: Math.floor(Math.random() * 15) + 5
      }

      setAnalytics({
        totalUsage: totalUsage as number,
        totalTools: tools.length,
        favoriteCount: preferences.favoriteTools.length,
        mostUsedTool,
        recentlyUsedCount,
        categoryUsage,
        dailyUsage,
        toolUsageRanking,
        usageStreaks
      })
      setIsLoading(false)
    }

    calculateAnalytics()
  }, [preferences.favoriteTools.length])

  if (isLoading || !analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Loading analytics...</h3>
          </div>
        </div>
      </div>
    )
  }

  const topCategories = Object.entries(analytics.categoryUsage)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Back to dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Usage Analytics</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Insights into your productivity patterns</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="all">All time</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Usage</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analytics.totalUsage}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Tools</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analytics.recentlyUsedCount}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Used in last 7 days</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Favorites</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analytics.favoriteCount}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">of {analytics.totalTools} tools</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Streak</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analytics.usageStreaks.current}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">days active</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Tools */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Most Used Tools</h2>
            </div>
            <div className="space-y-4">
              {analytics.toolUsageRanking.slice(0, 5).map((item, index) => (
                <div key={item.tool.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{item.tool.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{item.tool.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{item.usage}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <PieChart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Usage by Category</h2>
            </div>
            <div className="space-y-4">
              {topCategories.map(([category, usage]) => {
                const percentage = analytics.totalUsage > 0 ? (usage / analytics.totalUsage) * 100 : 0
                return (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                        {category}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {usage} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-indigo-600 dark:bg-indigo-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Most Used Tool Highlight */}
        {analytics.mostUsedTool && (
          <div className="mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">🏆 Your Top Tool</h3>
                <p className="text-2xl font-bold">{analytics.mostUsedTool.name}</p>
                <p className="text-indigo-100 capitalize">{analytics.mostUsedTool.category}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">
                  {analytics.toolUsageRanking.find(item => item.tool.id === analytics.mostUsedTool?.id)?.usage || 0}
                </p>
                <p className="text-indigo-100">times used</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}