'use client'

import { useEffect } from 'react'
import { toolRegistry } from '@/lib/tool-registry'
import ToolRegistryManager from '@/components/tools/ToolRegistryManager'

export default function ToolRegistryPage() {
  useEffect(() => {
    // Record tool usage when the page loads
    toolRegistry.recordUsage('registry')
  }, [])

  return <ToolRegistryManager />
}