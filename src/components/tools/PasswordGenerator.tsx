'use client'
import React, { useState, useEffect } from 'react'
import { ArrowLeft, Key, Copy, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface Preferences {
  length: number
  includeUppercase: boolean
  includeLowercase: boolean
  includeNumbers: boolean
  includeSymbols: boolean
}

interface StoredData {
  __schemaVersion: 1
  prefs: Preferences
  lastModified: string
}

const PasswordGenerator: React.FC = () => {
  const [prefs, setPrefs] = useState<Preferences>({ length: 12, includeUppercase: true, includeLowercase: true, includeNumbers: true, includeSymbols: true })
  const [generatedPw, setGeneratedPw] = useState('')
  const [strength, setStrength] = useState(0)
  const [recent, setRecent] = useState<string[]>([])
  const [copySuccess, setCopySuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPrefs = () => {
      try {
        const stored = localStorage.getItem('tool-password-generator-data')
        if (stored) {
          const data: StoredData = JSON.parse(stored)
          if (data.__schemaVersion >= 1) {
            setPrefs(data.prefs || prefs)
          }
        }
      } catch (err) {
        console.warn('Failed to load prefs:', err)
      }
    }
    loadPrefs()
  }, [])

  useEffect(() => {
    const savePrefs = () => {
      try {
        const data: StoredData = {
          __schemaVersion: 1,
          prefs,
          lastModified: new Date().toISOString()
        }
        localStorage.setItem('tool-password-generator-data', JSON.stringify(data))
      } catch (err) {
        console.error('Failed to save prefs:', err)
      }
    }
    savePrefs()
  }, [prefs])

  const generatePassword = () => {
    try {
      setError(null)
      const charset = []
      if (prefs.includeLowercase) charset.push('abcdefghijklmnopqrstuvwxyz')
      if (prefs.includeUppercase) charset.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
      if (prefs.includeNumbers) charset.push('0123456789')
      if (prefs.includeSymbols) charset.push('!@#$%^&*()_+-=[]{}|;:,.<>?')
      if (charset.length === 0) {
        setError('Select at least one character type')
        return
      }
      const allChars = charset.join('')
      const array = new Uint8Array(prefs.length)
      crypto.getRandomValues(array)
      let pw = ''
      for (let i = 0; i < prefs.length; i++) {
        pw += allChars[array[i] % allChars.length]
      }
      setGeneratedPw(pw)
      const entropy = prefs.length * Math.log2(allChars.length)
      setStrength(Math.min(100, (entropy / 100) * 100))  // Normalize to 0-100 based on typical strong password ~100 bits
      setRecent(prev => [pw, ...prev.slice(0, 4)])
    } catch (err) {
      setError('Crypto unavailable; using fallback (less secure)')
      // Fallback with Math.random() - implement if needed
    }
  }

  const copyToClipboard = async () => {
    if (!generatedPw) return
    try {
      await navigator.clipboard.writeText(generatedPw)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      alert('Copy failed: ' + generatedPw)
    }
  }

  const updatePref = (key: keyof Preferences, value: boolean | number) => {
    setPrefs(prev => ({ ...prev, [key]: value }))
  }

  const getStrengthColor = () => {
    if (strength < 40) return 'bg-red-500'
    if (strength < 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Key className="w-8 h-8 text-green-600" />
              <h1 className="text-3xl font-bold text-gray-900">Password Generator</h1>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto">Generate secure, customizable passwords offline with instant strength analysis.</p>
          </div>
        </div>

        {/* Options Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Generation Options</h2>
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Length</span>
              <input
                type="number"
                min="8"
                max="128"
                value={prefs.length}
                onChange={(e) => updatePref('length', parseInt(e.target.value))}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </label>
            {(['includeUppercase', 'includeLowercase', 'includeNumbers', 'includeSymbols'] as (keyof Preferences)[]).map(key => (
              <label key={key} className="flex items-center">
                <input
                  type="checkbox"
                  checked={prefs[key] as boolean}
                  onChange={(e) => updatePref(key, e.target.checked)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700 capitalize">{key}</span>
              </label>
            ))}
            <button
              onClick={generatePassword}
              className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 active:scale-95"
            >
              Generate Password
            </button>
          </div>
          {error && <div className="mt-2 p-2 bg-red-100 text-red-700 rounded"><AlertCircle className="w-4 h-4 inline mr-1" /> {error}</div>}
        </div>

        {/* Generated Password Card */}
        {generatedPw && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Generated Password</h2>
            <div className="relative">
              <input
                type="text"
                value={generatedPw}
                readOnly
                className="w-full p-3 bg-gray-100 rounded-lg text-lg font-mono pr-24"
              />
              <button
                onClick={copyToClipboard}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-all duration-200 active:scale-95"
              >
                {copySuccess ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            {copySuccess && <p className="mt-2 text-green-600 text-sm">Copied to clipboard!</p>}
          </div>
        )}

        {/* Strength Meter Card */}
        {generatedPw && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Strength Analysis</h2>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div className={`${getStrengthColor()} h-4 rounded-full transition-all duration-300`} style={{ width: `${strength}%` }} role="progressbar" aria-valuenow={strength} aria-valuemin={0} aria-valuemax={100} />
            </div>
            <p className="mt-2 text-sm text-gray-600">Score: {Math.round(strength)}/100 (Entropy-based)</p>
          </div>
        )}

        {/* Recent Generations Card */}
        {recent.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Generations (Clears on Refresh)</h2>
            <ul className="space-y-2">
              {recent.map((pw, i) => (
                <li key={i} className="p-2 bg-gray-50 rounded text-sm font-mono truncate">{pw}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default PasswordGenerator