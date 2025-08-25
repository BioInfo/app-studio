'use client'

import { useEffect } from 'react'
import { toolRegistry } from '@/lib/tool-registry'
import UnitConverter from '@/components/tools/UnitConverter'

export default function UnitConverterPage() {
  useEffect(() => {
    // Record tool usage when the page loads
    toolRegistry.recordUsage('unit-converter')
  }, [])

  return <UnitConverter />
}