'use client'

import { useEffect } from 'react'
import { toolRegistry } from '@/lib/tool-registry'
import Calculator from '@/components/tools/Calculator'

export default function CalculatorPage() {
  useEffect(() => {
    toolRegistry.recordUsage('calculator')
  }, [])

  return <Calculator />
}