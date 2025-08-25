'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Copy, Check, Wand2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const SmartMarkdownFormatter = () => {
  const [inputText, setInputText] = useState('')
  const [copied, setCopied] = useState(false)

  // Smart parsing logic
  const parseToMarkdown = useCallback((text: string) => {
    if (!text.trim()) return ''

    let lines = text.split('\n')
    let result: string[] = []
    let i = 0

    // First pass: clean up unnecessary line breaks
    let cleanedLines: string[] = []
    let currentParagraph = ''
    
    for (let j = 0; j < lines.length; j++) {
      let line = lines[j]
      let trimmed = line.trim()
      
      // If empty line, finish current paragraph if it exists
      if (!trimmed) {
        if (currentParagraph.trim()) {
          cleanedLines.push(currentParagraph.trim())
          currentParagraph = ''
        }
        cleanedLines.push('') // Preserve paragraph breaks
        continue
      }
      
      // Check if this looks like a header, list item, or code
      let isSpecialLine = (
        trimmed === trimmed.toUpperCase() && trimmed.length > 3 && /^[A-Z\s]+$/.test(trimmed) ||
        (trimmed.match(/^[A-Z][a-z].*[^.!?]$/) && trimmed.length < 60) ||
        trimmed.match(/^\d+[\.\)]\s+/) ||
        trimmed.match(/^[-\*\•]\s+/) ||
        trimmed.match(/^[a-z]\)\s+/i) ||
        line.match(/^    /) || 
        line.match(/^\t/) ||
        trimmed.includes('|') && trimmed.split('|').length > 2 ||
        trimmed.match(/^[a-zA-Z_][a-zA-Z0-9_]*\s*[=:]\s*/) ||
        (trimmed.match(/[{}();\[\]]/g)?.length || 0) > 2
      )
      
      if (isSpecialLine) {
        // Finish current paragraph first
        if (currentParagraph.trim()) {
          cleanedLines.push(currentParagraph.trim())
          currentParagraph = ''
        }
        cleanedLines.push(line)
      } else {
        // Add to current paragraph with space
        if (currentParagraph) {
          currentParagraph += ' ' + trimmed
        } else {
          currentParagraph = trimmed
        }
      }
    }
    
    // Don't forget the last paragraph
    if (currentParagraph.trim()) {
      cleanedLines.push(currentParagraph.trim())
    }

    lines = cleanedLines
    
    while (i < lines.length) {
      let line = lines[i]
      let trimmed = line.trim()

      // Skip empty lines but preserve spacing
      if (!trimmed) {
        result.push('')
        i++
        continue
      }

      // Detect headers (all caps, title case, or lines followed by dashes/equals)
      if (
        trimmed === trimmed.toUpperCase() && trimmed.length > 3 && /^[A-Z\s]+$/.test(trimmed) ||
        (trimmed.match(/^[A-Z][a-z].*[^.!?]$/) && trimmed.length < 60) ||
        (i + 1 < lines.length && lines[i + 1].trim().match(/^[=-]{3,}$/))
      ) {
        let level = 1
        if (trimmed.length < 20) level = 1
        else if (trimmed.length < 40) level = 2
        else level = 3
        
        result.push(`${'#'.repeat(level)} ${trimmed}`)
        
        // Skip underline if present
        if (i + 1 < lines.length && lines[i + 1].trim().match(/^[=-]{3,}$/)) {
          i += 2
        } else {
          i++
        }
        continue
      }

      // Detect numbered lists
      if (trimmed.match(/^\d+[\.\)]\s+/)) {
        let listItems: string[] = []
        while (i < lines.length && lines[i].trim().match(/^\d+[\.\)]\s+/)) {
          let content = lines[i].trim().replace(/^\d+[\.\)]\s+/, '')
          listItems.push(`1. ${content}`)
          i++
        }
        result.push(...listItems)
        continue
      }

      // Detect bullet lists
      if (trimmed.match(/^[-\*\•]\s+/) || trimmed.match(/^[a-z]\)\s+/i)) {
        let listItems: string[] = []
        while (i < lines.length && (lines[i].trim().match(/^[-\*\•]\s+/) || lines[i].trim().match(/^[a-z]\)\s+/i))) {
          let content = lines[i].trim().replace(/^[-\*\•]\s+/, '').replace(/^[a-z]\)\s+/i, '')
          listItems.push(`- ${content}`)
          i++
        }
        result.push(...listItems)
        continue
      }

      // Detect code blocks (indented text or technical patterns)
      if (
        line.match(/^    /) || 
        line.match(/^\t/) ||
        trimmed.match(/^[a-zA-Z_][a-zA-Z0-9_]*\s*[=:]\s*/) ||
        (trimmed.match(/[{}();\[\]]/g)?.length || 0) > 2 ||
        trimmed.match(/^(function|class|def|var|let|const|if|for|while)\b/)
      ) {
        let codeBlock: string[] = []
        let foundCode = false
        
        while (i < lines.length) {
          let codeLine = lines[i]
          if (
            codeLine.match(/^    /) || 
            codeLine.match(/^\t/) ||
            (codeLine.trim().match(/[{}();\[\]]/g)?.length || 0) > 1 ||
            codeLine.trim().match(/^(function|class|def|var|let|const|if|for|while|return|import|export)\b/) ||
            (!codeLine.trim() && foundCode)
          ) {
            codeBlock.push(codeLine.replace(/^    /, '').replace(/^\t/, ''))
            foundCode = true
          } else if (foundCode) {
            break
          } else {
            codeBlock.push(codeLine)
          }
          i++
        }
        
        if (codeBlock.length > 0) {
          result.push('```')
          result.push(...codeBlock)
          result.push('```')
        }
        continue
      }

      // Detect tables (lines with multiple | or tabs)
      if (trimmed.includes('|') && trimmed.split('|').length > 2) {
        let tableRows: string[] = []
        while (i < lines.length && lines[i].trim().includes('|')) {
          let row = lines[i].trim()
          if (!row.startsWith('|')) row = '| ' + row
          if (!row.endsWith('|')) row = row + ' |'
          tableRows.push(row)
          i++
        }
        
        if (tableRows.length > 0) {
          result.push(...tableRows)
          // Add header separator if it looks like a header
          if (tableRows.length > 1) {
            let cols = tableRows[0].split('|').length - 1
            result.splice(result.length - tableRows.length + 1, 0, '|' + ' --- |'.repeat(cols))
          }
        }
        continue
      }

      // Convert URLs to links
      let processedLine = trimmed.replace(
        /(https?:\/\/[^\s]+)/g, 
        '[$1]($1)'
      )

      // Convert email addresses
      processedLine = processedLine.replace(
        /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
        '[$1](mailto:$1)'
      )

      // Detect emphasis (words in quotes or ALL CAPS)
      processedLine = processedLine.replace(
        /"([^"]+)"/g,
        '*$1*'
      )

      processedLine = processedLine.replace(
        /\b([A-Z]{2,})\b/g,
        '**$1**'
      )

      result.push(processedLine)
      i++
    }

    return result.join('\n')
  }, [])

  const markdownOutput = useMemo(() => parseToMarkdown(inputText), [inputText, parseToMarkdown])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdownOutput)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  // Simple markdown to HTML renderer for preview
  const renderPreview = (markdown: string) => {
    if (!markdown.trim()) return '<p class="text-gray-400 italic">Your formatted markdown will appear here...</p>'
    
    let html = markdown
      // Headers
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2 text-gray-800">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-4 mb-2 text-gray-800">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-4 mb-3 text-gray-900">$1</h1>')
      
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-3 rounded text-sm overflow-x-auto my-3"><code>$1</code></pre>')
      
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>')
      
      // Bold and italic
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>')
      
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline">$1</a>')
      
      // Lists
      .replace(/^- (.*$)/gm, '<li class="ml-4">$1</li>')
      .replace(/^1\. (.*$)/gm, '<li class="ml-4 list-decimal">$1</li>')
      
      // Line breaks
      .replace(/\n/g, '<br>')

    // Wrap list items
    html = html.replace(/(<li.*?<\/li>)/g, '<ul class="my-2">$1</ul>')
    html = html.replace(/(<li.*?list-decimal.*?<\/li>)/g, '<ol class="my-2 list-decimal ml-4">$1</ol>')
    
    return html
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
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
              <Wand2 className="w-8 h-8 text-indigo-600" />
              <h1 className="text-3xl font-bold text-gray-900">Smart Markdown Formatter</h1>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Paste any text and watch it transform into beautifully formatted markdown. 
              Headers, lists, links, code, and tables are detected automatically.
            </p>
          </div>
        </div>

        {/* Main Interface */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
            {/* Input Section */}
            <div className="border-r border-gray-200">
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  📝 Paste Your Text
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Any format - we'll make it markdown
                </p>
              </div>
              <div className="p-6">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste your text here... 

Try pasting:
• Articles from websites
• Lists and bullet points  
• Code snippets
• Tables
• Any messy text that needs formatting!"
                  className="w-full h-[480px] p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-mono text-sm leading-relaxed"
                />
              </div>
            </div>

            {/* Preview Section */}
            <div>
              <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    ✨ Markdown Preview
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Live formatted output
                  </p>
                </div>
                <button
                  onClick={handleCopy}
                  disabled={!markdownOutput.trim()}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    !markdownOutput.trim()
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : copied
                      ? 'bg-green-600 text-white'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
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
                      Copy Markdown
                    </>
                  )}
                </button>
              </div>
              <div className="p-6">
                <div 
                  className="prose prose-sm max-w-none h-[480px] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: renderPreview(markdownOutput) }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Raw Markdown Output (Hidden by default, for copying) */}
        <div className="mt-8 bg-white rounded-lg shadow-lg">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-800">Raw Markdown Output</h3>
            <p className="text-sm text-gray-600">The actual markdown code (for debugging)</p>
          </div>
          <div className="p-4">
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto max-h-40 font-mono whitespace-pre-wrap">
              {markdownOutput || 'Markdown output will appear here...'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SmartMarkdownFormatter