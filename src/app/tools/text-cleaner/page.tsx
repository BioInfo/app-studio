'use client'

import { useEffect } from 'react'
import { toolRegistry } from '@/lib/tool-registry'
import TextCleaner from '@/components/tools/TextCleaner'

export default function TextCleanerPage() {
  useEffect(() => {
    // Record tool usage when the page loads
    toolRegistry.recordUsage('text-cleaner')
  }, [])

  return <TextCleaner />
}