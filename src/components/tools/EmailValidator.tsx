'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Mail, Check, X, AlertTriangle, ArrowLeft, Download, Upload } from 'lucide-react'
import Link from 'next/link'

interface EmailValidationResult {
  email: string
  isValid: boolean
  issues: string[]
  suggestions?: string
}

interface ValidationStats {
  total: number
  valid: number
  invalid: number
  warnings: number
}

const EmailValidator = () => {
  const [emailList, setEmailList] = useState('')
  const [results, setResults] = useState<EmailValidationResult[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const [showOnlyInvalid, setShowOnlyInvalid] = useState(false)

  // Common email domains for suggestions
  const commonDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
    'icloud.com', 'live.com', 'msn.com', 'comcast.net', 'verizon.net'
  ]

  // Outlook-specific validation rules
  const outlookDomains = ['outlook.com', 'hotmail.com', 'live.com', 'msn.com']

  const validateEmail = useCallback((email: string): EmailValidationResult => {
    const trimmedEmail = email.trim().toLowerCase()
    const issues: string[] = []
    let suggestions: string | undefined

    // Basic format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const isBasicValid = emailRegex.test(trimmedEmail)

    if (!isBasicValid) {
      issues.push('Invalid email format')
    }

    // Check for common issues
    if (trimmedEmail.includes('..')) {
      issues.push('Contains consecutive dots')
    }

    if (trimmedEmail.startsWith('.') || trimmedEmail.endsWith('.')) {
      issues.push('Starts or ends with a dot')
    }

    if (trimmedEmail.includes(' ')) {
      issues.push('Contains spaces')
    }

    // Check for special characters in local part
    const localPart = trimmedEmail.split('@')[0]
    if (localPart && /[<>()[\]\\,;:\s@"]/.test(localPart)) {
      issues.push('Contains invalid characters in local part')
    }

    // Domain validation
    const domain = trimmedEmail.split('@')[1]
    if (domain) {
      // Check for valid domain format
      if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain)) {
        issues.push('Invalid domain format')
      }

      // Check for common typos in popular domains
      const domainLower = domain.toLowerCase()
      
      // Gmail typos
      if (['gmai.com', 'gmial.com', 'gmail.co', 'gmaill.com'].includes(domainLower)) {
        suggestions = trimmedEmail.replace(domainLower, 'gmail.com')
        issues.push('Possible typo in domain')
      }
      
      // Yahoo typos
      if (['yaho.com', 'yahoo.co', 'yahooo.com'].includes(domainLower)) {
        suggestions = trimmedEmail.replace(domainLower, 'yahoo.com')
        issues.push('Possible typo in domain')
      }
      
      // Outlook typos
      if (['outlook.co', 'outlok.com', 'outloo.com'].includes(domainLower)) {
        suggestions = trimmedEmail.replace(domainLower, 'outlook.com')
        issues.push('Possible typo in domain')
      }

      // Check for missing TLD
      if (!domain.includes('.')) {
        issues.push('Missing top-level domain')
      }

      // Check for suspicious domains
      if (domain.includes('test') || domain.includes('example')) {
        issues.push('Test or example domain')
      }
    }

    // Check for Outlook-specific issues
    if (domain && outlookDomains.includes(domain)) {
      // Outlook emails have specific length limits
      if (localPart && localPart.length > 64) {
        issues.push('Local part too long for Outlook (max 64 characters)')
      }
    }

    // Check for disposable email domains
    const disposableDomains = [
      '10minutemail.com', 'tempmail.org', 'guerrillamail.com', 
      'mailinator.com', 'throwaway.email'
    ]
    if (domain && disposableDomains.includes(domain)) {
      issues.push('Disposable email domain')
    }

    return {
      email: trimmedEmail,
      isValid: issues.length === 0,
      issues,
      suggestions
    }
  }, [outlookDomains])

  const validateEmailList = useCallback(() => {
    setIsValidating(true)
    
    // Split emails by common delimiters
    const emails = emailList
      .split(/[,;\n\r\t]+/)
      .map(email => email.trim())
      .filter(email => email.length > 0)

    const validationResults = emails.map(validateEmail)
    setResults(validationResults)
    setIsValidating(false)
  }, [emailList, validateEmail])

  const stats: ValidationStats = useMemo(() => {
    const total = results.length
    const valid = results.filter(r => r.isValid).length
    const invalid = results.filter(r => !r.isValid).length
    const warnings = results.filter(r => r.issues.length > 0 && r.isValid).length

    return { total, valid, invalid, warnings }
  }, [results])

  const filteredResults = useMemo(() => {
    if (showOnlyInvalid) {
      return results.filter(r => !r.isValid)
    }
    return results
  }, [results, showOnlyInvalid])

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setEmailList(content)
    }
    reader.readAsText(file)
  }, [])

  const downloadResults = useCallback((format: 'csv' | 'txt') => {
    let content = ''
    
    if (format === 'csv') {
      content = 'Email,Valid,Issues,Suggestions\n'
      results.forEach(result => {
        const issues = result.issues.join('; ')
        const suggestions = result.suggestions || ''
        content += `"${result.email}","${result.isValid}","${issues}","${suggestions}"\n`
      })
    } else {
      content = 'Email Validation Results\n'
      content += '========================\n\n'
      content += `Total: ${stats.total}\n`
      content += `Valid: ${stats.valid}\n`
      content += `Invalid: ${stats.invalid}\n\n`
      
      results.forEach(result => {
        content += `${result.email} - ${result.isValid ? 'VALID' : 'INVALID'}\n`
        if (result.issues.length > 0) {
          content += `  Issues: ${result.issues.join(', ')}\n`
        }
        if (result.suggestions) {
          content += `  Suggestion: ${result.suggestions}\n`
        }
        content += '\n'
      })
    }

    const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `email-validation-results.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [results, stats])

  const getValidEmails = useCallback(() => {
    return results.filter(r => r.isValid).map(r => r.email).join('\n')
  }, [results])

  const copyValidEmails = useCallback(async () => {
    const validEmails = getValidEmails()
    try {
      await navigator.clipboard.writeText(validEmails)
    } catch (err) {
      console.error('Failed to copy emails:', err)
    }
  }, [getValidEmails])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Mail className="w-8 h-8 text-indigo-600" />
              <h1 className="text-3xl font-bold text-gray-900">Email List Validator</h1>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Validate email lists for Outlook and other providers. Check format, detect typos, 
              and get suggestions for common domain mistakes.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Email List Input</h2>
              <div className="flex gap-2">
                <label className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Upload File
                  <input
                    type="file"
                    accept=".txt,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            
            <textarea
              value={emailList}
              onChange={(e) => setEmailList(e.target.value)}
              placeholder="Enter email addresses separated by commas, semicolons, or new lines:

john.doe@gmail.com
jane.smith@outlook.com
invalid-email@
test@example.com"
              className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-mono text-sm"
            />
            
            <div className="mt-4 flex gap-3">
              <button
                onClick={validateEmailList}
                disabled={!emailList.trim() || isValidating}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  !emailList.trim() || isValidating
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                }`}
              >
                <Mail className="w-4 h-4" />
                {isValidating ? 'Validating...' : 'Validate Emails'}
              </button>
            </div>

            {results.length > 0 && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={copyValidEmails}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Check className="w-4 h-4" />
                  Copy Valid
                </button>
                <button
                  onClick={() => downloadResults('csv')}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
                <button
                  onClick={() => downloadResults('txt')}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  TXT
                </button>
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Validation Results</h2>
              {results.length > 0 && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showOnlyInvalid}
                    onChange={(e) => setShowOnlyInvalid(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  Show only invalid
                </label>
              )}
            </div>

            {results.length > 0 && (
              <div className="mb-4 grid grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.valid}</div>
                  <div className="text-sm text-gray-600">Valid</div>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{stats.invalid}</div>
                  <div className="text-sm text-gray-600">Invalid</div>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {Math.round((stats.valid / stats.total) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
              </div>
            )}

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredResults.length === 0 && results.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  Enter email addresses above to validate them
                </div>
              )}

              {filteredResults.length === 0 && results.length > 0 && showOnlyInvalid && (
                <div className="text-center text-green-600 py-8">
                  🎉 All emails are valid!
                </div>
              )}

              {filteredResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    result.isValid
                      ? 'bg-green-50 border-green-400'
                      : 'bg-red-50 border-red-400'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {result.isValid ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <X className="w-5 h-5 text-red-600" />
                    )}
                    <span className="font-mono text-sm">{result.email}</span>
                  </div>

                  {result.issues.length > 0 && (
                    <div className="ml-7">
                      <div className="text-sm text-gray-600 mb-1">Issues:</div>
                      <ul className="text-sm text-red-600 space-y-1">
                        {result.issues.map((issue, issueIndex) => (
                          <li key={issueIndex} className="flex items-center gap-2">
                            <AlertTriangle className="w-3 h-3" />
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.suggestions && (
                    <div className="ml-7 mt-2">
                      <div className="text-sm text-gray-600">Suggestion:</div>
                      <div className="text-sm text-blue-600 font-mono">
                        {result.suggestions}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Email Validation Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Common Issues:</h4>
              <ul className="space-y-1">
                <li>• Missing @ symbol</li>
                <li>• Invalid domain format</li>
                <li>• Typos in popular domains</li>
                <li>• Extra spaces or special characters</li>
                <li>• Missing top-level domain (.com, .org, etc.)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Outlook Specific:</h4>
              <ul className="space-y-1">
                <li>• Local part max 64 characters</li>
                <li>• Supports outlook.com, hotmail.com, live.com</li>
                <li>• Case insensitive</li>
                <li>• Dots allowed but not consecutive</li>
                <li>• Plus addressing supported</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmailValidator