'use client'

import { useEffect } from 'react'
import { toolRegistry } from '@/lib/tool-registry'
import SmartMarkdownFormatter from '@/components/tools/SmartMarkdownFormatter'

export default function MarkdownFormatterPage() {
  useEffect(() => {
    // Record tool usage when the page loads
    toolRegistry.recordUsage('markdown-formatter')
  }, [])

  return <SmartMarkdownFormatter />
}