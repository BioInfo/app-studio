'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { Zap, Download, Upload, Wifi, Clock, History, Play, Square, RotateCcw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface SpeedTestResult {
  id: string
  timestamp: string
  ping: number | null
  downloadSpeed: number | null
  uploadSpeed: number | null
  status: 'completed' | 'failed' | 'partial'
}

interface SpeedTestData {
  __schemaVersion: number
  results: SpeedTestResult[]
  lastModified: string
}

type TestPhase = 'idle' | 'ping' | 'download' | 'upload' | 'completed'

const InternetSpeedTest = () => {
  const [currentPhase, setCurrentPhase] = useState<TestPhase>('idle')
  const [ping, setPing] = useState<number | null>(null)
  const [downloadSpeed, setDownloadSpeed] = useState<number | null>(null)
  const [uploadSpeed, setUploadSpeed] = useState<number | null>(null)
  const [progress, setProgress] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<SpeedTestResult[]>([])
  const [error, setError] = useState<string | null>(null)

  // Load saved results from localStorage
  useEffect(() => {
    const loadResults = () => {
      try {
        const stored = localStorage.getItem('tool-speed-test-data')
        if (stored) {
          const parsed: SpeedTestData = JSON.parse(stored)
          if (parsed.__schemaVersion >= 1) {
            setResults(parsed.results || [])
          }
        }
      } catch (error) {
        console.warn('Failed to load speed test results:', error)
      }
    }
    loadResults()
  }, [])

  // Save results to localStorage
  const saveResults = useCallback((newResults: SpeedTestResult[]) => {
    try {
      const data: SpeedTestData = {
        __schemaVersion: 1,
        results: newResults.slice(0, 50), // Keep only last 50 results
        lastModified: new Date().toISOString()
      }
      localStorage.setItem('tool-speed-test-data', JSON.stringify(data))
      setResults(newResults)
    } catch (error) {
      console.error('Failed to save speed test results:', error)
    }
  }, [])

  // Ping test using image loading technique
  const testPing = async (): Promise<number> => {
    const iterations = 5
    const pings: number[] = []
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      try {
        await new Promise((resolve, reject) => {
          const img = new Image()
          img.onload = resolve
          img.onerror = reject
          // Use a small image from a reliable CDN with cache busting
          img.src = `https://www.google.com/favicon.ico?t=${Date.now()}`
        })
        const end = performance.now()
        pings.push(end - start)
      } catch {
        // Skip failed pings
      }
      setProgress((i + 1) / iterations * 100)
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    if (pings.length === 0) throw new Error('All ping attempts failed')
    return Math.round(pings.reduce((a, b) => a + b, 0) / pings.length)
  }

  // Download speed test using fetch
  const testDownloadSpeed = async (): Promise<number> => {
    const testDuration = 10000 // 10 seconds
    let totalBytes = 0
    const startTime = performance.now()
    
    // Use a reliable test file URL (this is a common approach for speed tests)
    const testUrl = 'https://httpbin.org/bytes/1048576' // 1MB file
    
    const downloadPromises: Promise<void>[] = []
    
    // Start multiple concurrent downloads
    for (let i = 0; i < 4; i++) {
      const promise = (async () => {
        while (performance.now() - startTime < testDuration) {
          try {
            const response = await fetch(`${testUrl}?t=${Date.now()}`)
            if (!response.ok) throw new Error('Download failed')
            
            const reader = response.body?.getReader()
            if (!reader) throw new Error('No reader available')
            
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              totalBytes += value?.length || 0
              
              const elapsed = performance.now() - startTime
              if (elapsed >= testDuration) break
              
              setProgress((elapsed / testDuration) * 100)
            }
          } catch {
            // Continue with other downloads
            break
          }
        }
      })()
      
      downloadPromises.push(promise)
    }
    
    await Promise.allSettled(downloadPromises)
    
    const elapsed = performance.now() - startTime
    const speedMbps = (totalBytes * 8) / (elapsed / 1000) / (1024 * 1024)
    return Math.round(speedMbps * 100) / 100
  }

  // Upload speed test using POST requests
  const testUploadSpeed = async (): Promise<number> => {
    const testDuration = 10000 // 10 seconds
    const chunkSize = 1024 * 1024 // 1MB
    let totalBytes = 0
    const startTime = performance.now()
    
    // Create test data
    const testData = new Uint8Array(chunkSize).fill(65) // Fill with 'A'
    
    const uploadPromises: Promise<void>[] = []
    
    // Start multiple concurrent uploads
    for (let i = 0; i < 2; i++) {
      const promise = (async () => {
        while (performance.now() - startTime < testDuration) {
          try {
            const response = await fetch('https://httpbin.org/post', {
              method: 'POST',
              body: testData,
              headers: {
                'Content-Type': 'application/octet-stream'
              }
            })
            
            if (!response.ok) throw new Error('Upload failed')
            
            totalBytes += chunkSize
            const elapsed = performance.now() - startTime
            if (elapsed >= testDuration) break
            
            setProgress((elapsed / testDuration) * 100)
          } catch {
            // Continue with other uploads
            break
          }
        }
      })()
      
      uploadPromises.push(promise)
    }
    
    await Promise.allSettled(uploadPromises)
    
    const elapsed = performance.now() - startTime
    const speedMbps = (totalBytes * 8) / (elapsed / 1000) / (1024 * 1024)
    return Math.round(speedMbps * 100) / 100
  }

  // Run complete speed test
  const runSpeedTest = async () => {
    setIsRunning(true)
    setError(null)
    setPing(null)
    setDownloadSpeed(null)
    setUploadSpeed(null)
    setProgress(0)

    const result: SpeedTestResult = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ping: null,
      downloadSpeed: null,
      uploadSpeed: null,
      status: 'failed'
    }

    try {
      // Ping test
      setCurrentPhase('ping')
      setProgress(0)
      const pingResult = await testPing()
      setPing(pingResult)
      result.ping = pingResult

      // Download test
      setCurrentPhase('download')
      setProgress(0)
      const downloadResult = await testDownloadSpeed()
      setDownloadSpeed(downloadResult)
      result.downloadSpeed = downloadResult

      // Upload test
      setCurrentPhase('upload')
      setProgress(0)
      const uploadResult = await testUploadSpeed()
      setUploadSpeed(uploadResult)
      result.uploadSpeed = uploadResult

      result.status = 'completed'
      setCurrentPhase('completed')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speed test failed')
      result.status = result.ping || result.downloadSpeed || result.uploadSpeed ? 'partial' : 'failed'
    } finally {
      setIsRunning(false)
      setProgress(100)
      
      // Save result
      const newResults = [result, ...results]
      saveResults(newResults)
    }
  }

  // Stop test
  const stopTest = () => {
    setIsRunning(false)
    setCurrentPhase('idle')
    setProgress(0)
  }

  // Clear history
  const clearHistory = () => {
    saveResults([])
  }

  // Format speed for display
  const formatSpeed = (speed: number | null) => {
    if (speed === null) return '--'
    if (speed < 1) return `${(speed * 1000).toFixed(0)} Kbps`
    return `${speed.toFixed(1)} Mbps`
  }

  // Format date for display
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Zap className="w-8 h-8 text-orange-600" />
              <h1 className="text-3xl font-bold text-gray-900">Internet Speed Test</h1>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Test your internet connection speed with ping, download, and upload measurements. 
              Save and track your speed test results over time.
            </p>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Speed Test Controls</h2>
            <div className="flex gap-4">
              <button
                onClick={runSpeedTest}
                disabled={isRunning}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  isRunning
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-orange-600 text-white hover:bg-orange-700 active:scale-95'
                }`}
              >
                {isRunning ? (
                  <>
                    <Square className="w-4 h-4" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start Test
                  </>
                )}
              </button>

              {isRunning && (
                <button
                  onClick={stopTest}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                >
                  <Square className="w-4 h-4" />
                  Stop
                </button>
              )}
            </div>
          </div>

          {/* Current Test Status */}
          {isRunning && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">
                  {currentPhase === 'ping' && 'Testing ping...'}
                  {currentPhase === 'download' && 'Testing download speed...'}
                  {currentPhase === 'upload' && 'Testing upload speed...'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Results Display */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Test Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Ping */}
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Wifi className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Ping</h3>
              </div>
              <p className="text-3xl font-bold text-orange-600">
                {ping !== null ? `${ping} ms` : '--'}
              </p>
            </div>

            {/* Download Speed */}
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Download className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Download</h3>
              </div>
              <p className="text-3xl font-bold text-green-600">
                {formatSpeed(downloadSpeed)}
              </p>
            </div>

            {/* Upload Speed */}
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Upload className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Upload</h3>
              </div>
              <p className="text-3xl font-bold text-blue-600">
                {formatSpeed(uploadSpeed)}
              </p>
            </div>
          </div>
        </div>

        {/* Test History */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">Test History</h2>
            </div>
            {results.length > 0 && (
              <button
                onClick={clearHistory}
                className="flex items-center gap-2 px-3 py-1 text-sm text-red-600 hover:text-red-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Clear History
              </button>
            )}
          </div>

          {results.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No test results yet. Run a speed test to see your results here.
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {formatDate(result.timestamp)}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      result.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : result.status === 'partial'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {result.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <span className="text-gray-600">
                      Ping: {result.ping !== null ? `${result.ping} ms` : '--'}
                    </span>
                    <span className="text-gray-600">
                      ↓ {formatSpeed(result.downloadSpeed)}
                    </span>
                    <span className="text-gray-600">
                      ↑ {formatSpeed(result.uploadSpeed)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default InternetSpeedTest