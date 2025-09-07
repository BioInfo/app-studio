'use client'

import React, { useState, useEffect } from 'react'
import { ArrowLeft, Hash, Copy, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface Calculation {
  id: string
  expression: string
  result: string
  timestamp: Date
}

const Calculator = () => {
  const [expression, setExpression] = useState('')
  const [result, setResult] = useState('')
  const [history, setHistory] = useState<Calculation[]>([])
  const [error, setError] = useState('')

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('tool-calculator-data')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.__schemaVersion >= 1) {
          setHistory(parsed.history || [])
        }
      }
    } catch (err) {
      console.warn('Failed to load calculator data:', err)
    }
  }, [])

  // Save calculation history to localStorage
  const saveData = (updatedHistory: Calculation[]) => {
    try {
      localStorage.setItem('tool-calculator-data', JSON.stringify({
        __schemaVersion: 1,
        history: updatedHistory,
        lastModified: new Date().toISOString()
      }))
    } catch (err) {
      console.error('Failed to save calculator data:', err)
    }
  }

  // Simple expression evaluation function
  const evaluateExpression = (expr: string): string => {
    try {
      // Clean up the expression
      let cleanExpr = expr.trim()

      // Handle percentage calculations (e.g., "50 + 10%")
      cleanExpr = cleanExpr.replace(/(\d+)%/g, '($1/100)')

      // Handle power notation (e.g., "2^8")
      cleanExpr = cleanExpr.replace(/\^/g, '**')

      // Handle π and e constants
      cleanExpr = cleanExpr.replace(/π/g, Math.PI.toString())
      cleanExpr = cleanExpr.replace(/e(?![a-zA-Z])/g, Math.E.toString())

      // Safely evaluate the expression
      const result = Function(`"use strict"; return (${cleanExpr})`)()

      if (typeof result === 'number' && !isNaN(result)) {
        return result.toString()
      } else {
        throw new Error('Invalid result')
      }
    } catch (err) {
      throw new Error('Invalid expression')
    }
  }

  const handleCalculate = () => {
    if (!expression.trim()) return

    try {
      const calcResult = evaluateExpression(expression)
      setResult(calcResult)
      setError('')

      // Add to history
      const newCalc: Calculation = {
        id: Date.now().toString(),
        expression,
        result: calcResult,
        timestamp: new Date()
      }

      const updatedHistory = [newCalc, ...history]
      setHistory(updatedHistory)
      saveData(updatedHistory)
    } catch (err) {
      setError('Invalid expression. Try something like: 5 + 3 * 2 or sqrt(16)')
      setResult('')
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleClearHistory = () => {
    setHistory([])
    saveData([])
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleCalculate()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-yellow-600 hover:text-yellow-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Hash className="w-8 h-8 text-yellow-600" />
              <h1 className="text-3xl font-bold text-gray-900">Calculator</h1>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Natural language calculator for quick math problems, expressions, and calculations.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calculator Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Calculate</h2>

            {/* Expression Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Expression
              </label>
              <textarea
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder='Enter expression (e.g., "50 + 10%" or "sqrt(16)^2")'
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none min-h-[80px] resize-none"
                rows={2}
              />
            </div>

            {/* Result */}
            {result && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Result
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-lg">
                    {result}
                  </div>
                  <button
                    onClick={() => handleCopy(result)}
                    className="p-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                    title="Copy result"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Calculate Button */}
            <button
              onClick={handleCalculate}
              disabled={!expression.trim()}
              className="w-full px-6 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 disabled:scale-100 active:scale-95"
            >
              Calculate
            </button>

            {/* Examples */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Examples:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-500">
                <div>50 + 25 * 2</div>
                <div>sqrt(144) * 3</div>
                <div>(100 - 20) / 4</div>
                <div>2^10 / 1000</div>
                <div>3.14 * radius</div>
                <div>sin(π/2)</div>
              </div>
            </div>
          </div>

          {/* History Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Calculation History</h2>
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Clear history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Hash className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No calculations yet</p>
                <p className="text-sm">Your calculations will appear here</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {history.map((calc) => (
                  <div
                    key={calc.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <div className="font-medium text-sm text-gray-600 mb-1">
                      {calc.expression}
                    </div>
                    <div className="font-mono text-lg text-gray-900 mb-2">
                      = {calc.result}
                    </div>
                    <div className="text-xs text-gray-400">
                      {calc.timestamp.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Calculator