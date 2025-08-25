'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Copy, Check, Eraser, ArrowLeft, Download } from 'lucide-react'
import Link from 'next/link'

const TextCleaner = () => {
  const [inputText, setInputText] = useState('')
  const [copied, setCopied] = useState(false)
  const [cleaningOptions, setCleaningOptions] = useState({
    removeExtraSpaces: true,
    removeExtraLineBreaks: true,
    removeLeadingTrailingSpaces: true,
    removeSpecialCharacters: false,
    removeNumbers: false,
    convertToLowercase: false,
    convertToUppercase: false,
    removeEmptyLines: true,
    normalizeLineEndings: true,
    removeTabsAndIndentation: false
  })

  const cleanText = useCallback((text: string) => {
    if (!text) return ''
    
    let cleaned = text

    // Remove leading and trailing spaces from each line
    if (cleaningOptions.removeLeadingTrailingSpaces) {
      cleaned = cleaned.split('\n').map(line => line.trim()).join('\n')
    }

    // Remove extra spaces (multiple spaces become single space)
    if (cleaningOptions.removeExtraSpaces) {
      cleaned = cleaned.replace(/[ \t]+/g, ' ')
    }

    // Remove tabs and indentation
    if (cleaningOptions.removeTabsAndIndentation) {
      cleaned = cleaned.replace(/^\s+/gm, '')
    }

    // Remove empty lines
    if (cleaningOptions.removeEmptyLines) {
      cleaned = cleaned.replace(/^\s*\n/gm, '')
    }

    // Remove extra line breaks (multiple line breaks become single)
    if (cleaningOptions.removeExtraLineBreaks) {
      cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
    }

    // Normalize line endings
    if (cleaningOptions.normalizeLineEndings) {
      cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    }

    // Remove special characters (keep only letters, numbers, spaces, and basic punctuation)
    if (cleaningOptions.removeSpecialCharacters) {
      cleaned = cleaned.replace(/[^\w\s.,!?;:'"()\-]/g, '')
    }

    // Remove numbers
    if (cleaningOptions.removeNumbers) {
      cleaned = cleaned.replace(/\d/g, '')
    }

    // Case conversion
    if (cleaningOptions.convertToLowercase) {
      cleaned = cleaned.toLowerCase()
    } else if (cleaningOptions.convertToUppercase) {
      cleaned = cleaned.toUpperCase()
    }

    // Final cleanup - remove leading/trailing whitespace
    cleaned = cleaned.trim()

    return cleaned
  }, [cleaningOptions])

  const cleanedText = useMemo(() => cleanText(inputText), [inputText, cleanText])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanedText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([cleanedText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cleaned-text.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleOptionChange = (option: keyof typeof cleaningOptions) => {
    setCleaningOptions(prev => {
      const newOptions = { ...prev, [option]: !prev[option] }
      
      // Ensure only one case conversion is active
      if (option === 'convertToLowercase' && newOptions.convertToLowercase) {
        newOptions.convertToUppercase = false
      } else if (option === 'convertToUppercase' && newOptions.convertToUppercase) {
        newOptions.convertToLowercase = false
      }
      
      return newOptions
    })
  }

  const getStats = () => {
    const originalLength = inputText.length
    const cleanedLength = cleanedText.length
    const originalLines = inputText.split('\n').length
    const cleanedLines = cleanedText.split('\n').length
    const originalWords = inputText.trim() ? inputText.trim().split(/\s+/).length : 0
    const cleanedWords = cleanedText.trim() ? cleanedText.trim().split(/\s+/).length : 0

    return {
      originalLength,
      cleanedLength,
      originalLines,
      cleanedLines,
      originalWords,
      cleanedWords,
      reduction: originalLength > 0 ? ((originalLength - cleanedLength) / originalLength * 100).toFixed(1) : '0'
    }
  }

  const stats = getStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Eraser className="w-8 h-8 text-emerald-600" />
              <h1 className="text-3xl font-bold text-gray-900">Text Cleaner</h1>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Clean up messy text by removing extra spaces, line breaks, special characters, and more. 
              Perfect for preparing text for documents or data processing.
            </p>
          </div>
        </div>

        {/* Cleaning Options */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Cleaning Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(cleaningOptions).map(([key, value]) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={() => handleOptionChange(key as keyof typeof cleaningOptions)}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{stats.originalLength}</div>
              <div className="text-sm text-gray-600">Original Characters</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{stats.cleanedLength}</div>
              <div className="text-sm text-gray-600">Cleaned Characters</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{stats.originalWords}</div>
              <div className="text-sm text-gray-600">Original Words</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{stats.cleanedWords}</div>
              <div className="text-sm text-gray-600">Cleaned Words</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{stats.originalLines}</div>
              <div className="text-sm text-gray-600">Original Lines</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{stats.cleanedLines}</div>
              <div className="text-sm text-gray-600">Cleaned Lines</div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <div className="text-lg font-semibold text-emerald-600">
              {stats.reduction}% reduction in size
            </div>
          </div>
        </div>

        {/* Main Interface */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
            {/* Input Section */}
            <div className="border-r border-gray-200">
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  📝 Original Text
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Paste your messy text here
                </p>
              </div>
              <div className="p-6">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste your text here...

Try pasting:
• Text with extra    spaces
• Text with


multiple line breaks
• Text with special characters @#$%
• Mixed    case   TEXT
• Indented text
• Any messy text that needs cleaning!"
                  className="w-full h-[480px] p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none font-mono text-sm leading-relaxed"
                />
              </div>
            </div>

            {/* Output Section */}
            <div>
              <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    ✨ Cleaned Text
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Your cleaned text output
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleDownload}
                    disabled={!cleanedText.trim()}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      !cleanedText.trim()
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={handleCopy}
                    disabled={!cleanedText.trim()}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      !cleanedText.trim()
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : copied
                        ? 'bg-green-600 text-white'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="p-6">
                <textarea
                  value={cleanedText}
                  readOnly
                  placeholder="Your cleaned text will appear here..."
                  className="w-full h-[480px] p-4 border border-gray-300 rounded-lg resize-none bg-gray-50 font-mono text-sm leading-relaxed"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TextCleaner