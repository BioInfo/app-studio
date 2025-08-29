'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Copy, Check, Wand2, ArrowLeft, ToggleLeft, ToggleRight } from 'lucide-react'
import Link from 'next/link'

type ConversionMode = 'text-to-markdown' | 'markdown-to-rich-text'

const SmartMarkdownFormatter = () => {
  const [inputText, setInputText] = useState('')
  const [copied, setCopied] = useState(false)
  const [mode, setMode] = useState<ConversionMode>('text-to-markdown')

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

  // Enhanced markdown to rich HTML converter
  const markdownToRichHtml = useCallback((markdown: string) => {
    if (!markdown.trim()) return ''
    
    let html = markdown
      // Code blocks (must be processed before inline code)
      .replace(/```(\w+)?\n?([\s\S]*?)```/g, '<div class="bg-gray-900 text-gray-100 p-4 rounded-lg my-4 overflow-x-auto"><pre><code class="text-sm font-mono">$2</code></pre></div>')
      
      // Headers
      .replace(/^### (.*$)/gm, '<h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800 border-b border-gray-200 pb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-semibold mt-8 mb-4 text-gray-900 border-b-2 border-gray-300 pb-2">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mt-8 mb-6 text-gray-900 border-b-2 border-blue-500 pb-3">$1</h1>')
      
      // Blockquotes
      .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 italic text-gray-700">$1</blockquote>')
      
      // Horizontal rules
      .replace(/^---$/gm, '<hr class="my-8 border-t-2 border-gray-300">')
      
      // Tables (basic support)
      .replace(/\|(.+)\|/g, (match, content) => {
        const cells = content.split('|').map((cell: string) => cell.trim())
        return '<tr>' + cells.map((cell: string) => `<td class="border border-gray-300 px-3 py-2">${cell}</td>`).join('') + '</tr>'
      })
      
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-red-600 px-2 py-1 rounded text-sm font-mono">$1</code>')
      
      // Bold and italic (order matters)
      .replace(/\*\*\*([^*]+)\*\*\*/g, '<strong class="font-bold"><em class="italic">$1</em></strong>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em class="italic text-gray-700">$1</em>')
      
      // Strikethrough
      .replace(/~~([^~]+)~~/g, '<del class="line-through text-gray-500">$1</del>')
      
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-colors">$1</a>')
      
      // Images
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg shadow-md my-4">')

    // Process lists
    const lines = html.split('\n')
    const processedLines: string[] = []
    let inUnorderedList = false
    let inOrderedList = false
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()
      
      // Unordered list items
      if (trimmed.match(/^- /)) {
        if (!inUnorderedList) {
          processedLines.push('<ul class="list-disc list-inside my-4 space-y-2 ml-4">')
          inUnorderedList = true
        }
        if (inOrderedList) {
          processedLines.push('</ol>')
          inOrderedList = false
        }
        processedLines.push(`<li class="text-gray-700">${trimmed.substring(2)}</li>`)
      }
      // Ordered list items
      else if (trimmed.match(/^\d+\. /)) {
        if (!inOrderedList) {
          processedLines.push('<ol class="list-decimal list-inside my-4 space-y-2 ml-4">')
          inOrderedList = true
        }
        if (inUnorderedList) {
          processedLines.push('</ul>')
          inUnorderedList = false
        }
        processedLines.push(`<li class="text-gray-700">${trimmed.replace(/^\d+\. /, '')}</li>`)
      }
      // Regular content
      else {
        if (inUnorderedList) {
          processedLines.push('</ul>')
          inUnorderedList = false
        }
        if (inOrderedList) {
          processedLines.push('</ol>')
          inOrderedList = false
        }
        
        if (trimmed) {
          // Don't wrap headers, blockquotes, code blocks, etc. in paragraphs
          if (!trimmed.match(/^<(h[1-6]|blockquote|div|hr|tr)/)) {
            processedLines.push(`<p class="my-3 text-gray-700 leading-relaxed">${line}</p>`)
          } else {
            processedLines.push(line)
          }
        } else {
          processedLines.push('')
        }
      }
    }
    
    // Close any open lists
    if (inUnorderedList) processedLines.push('</ul>')
    if (inOrderedList) processedLines.push('</ol>')
    
    return processedLines.join('\n')
  }, [])

  const output = useMemo(() => {
    if (mode === 'text-to-markdown') {
      return parseToMarkdown(inputText)
    } else {
      return markdownToRichHtml(inputText)
    }
  }, [inputText, mode, parseToMarkdown, markdownToRichHtml])

  const handleCopy = async () => {
    try {
      if (mode === 'text-to-markdown') {
        await navigator.clipboard.writeText(output)
      } else {
        // For rich text, copy both HTML and plain text
        const plainText = output.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([output], { type: 'text/html' }),
            'text/plain': new Blob([plainText], { type: 'text/plain' })
          })
        ])
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
      // Fallback to plain text copy
      try {
        const plainText = mode === 'text-to-markdown' ? output : output.replace(/<[^>]*>/g, '')
        await navigator.clipboard.writeText(plainText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (fallbackErr) {
        console.error('Fallback copy also failed: ', fallbackErr)
      }
    }
  }

  // Simple markdown to HTML renderer for preview (used for text-to-markdown mode)
  const renderPreview = (markdown: string) => {
    if (!markdown.trim()) {
      return mode === 'text-to-markdown'
        ? '<p class="text-gray-400 italic">Your formatted markdown will appear here...</p>'
        : '<p class="text-gray-400 italic">Your rich text will appear here...</p>'
    }
    
    if (mode === 'markdown-to-rich-text') {
      return output
    }
    
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
              {mode === 'text-to-markdown'
                ? 'Paste any text and watch it transform into beautifully formatted markdown. Headers, lists, links, code, and tables are detected automatically.'
                : 'Paste markdown and get beautifully formatted rich text. Perfect for copying into documents, emails, or presentations.'
              }
            </p>
            
            {/* Mode Toggle */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => setMode('text-to-markdown')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  mode === 'text-to-markdown'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📝 Text → Markdown
              </button>
              
              <div className="flex items-center">
                {mode === 'text-to-markdown' ? (
                  <ToggleLeft className="w-8 h-8 text-gray-400" />
                ) : (
                  <ToggleRight className="w-8 h-8 text-indigo-600" />
                )}
              </div>
              
              <button
                onClick={() => setMode('markdown-to-rich-text')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  mode === 'markdown-to-rich-text'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ✨ Markdown → Rich Text
              </button>
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
                  {mode === 'text-to-markdown' ? '📝 Paste Your Text' : '📄 Paste Your Markdown'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {mode === 'text-to-markdown'
                    ? 'Any format - we\'ll make it markdown'
                    : 'Markdown syntax - we\'ll make it rich text'
                  }
                </p>
              </div>
              <div className="p-6">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={mode === 'text-to-markdown'
                    ? `Paste your text here...

Try pasting:
• Articles from websites
• Lists and bullet points
• Code snippets
• Tables
• Any messy text that needs formatting!`
                    : `Paste your markdown here...

Try pasting:
# Headers
**Bold text** and *italic text*
- Bullet lists
1. Numbered lists
\`code snippets\`
[Links](https://example.com)
> Blockquotes`
                  }
                  className="w-full h-[480px] p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-mono text-sm leading-relaxed"
                />
              </div>
            </div>

            {/* Preview Section */}
            <div>
              <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    {mode === 'text-to-markdown' ? '✨ Markdown Preview' : '🎨 Rich Text Preview'}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Live formatted output
                  </p>
                </div>
                <button
                  onClick={handleCopy}
                  disabled={!output.trim()}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    !output.trim()
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
                      {mode === 'text-to-markdown' ? 'Copy Markdown' : 'Copy Rich Text'}
                    </>
                  )}
                </button>
              </div>
              <div className="p-6">
                <div
                  className="prose prose-sm max-w-none h-[480px] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: renderPreview(mode === 'text-to-markdown' ? output : inputText) }}
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
              {output || 'Markdown output will appear here...'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SmartMarkdownFormatter