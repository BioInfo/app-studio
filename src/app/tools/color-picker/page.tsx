'use client'

import { useEffect } from 'react'
import { toolRegistry } from '@/lib/tool-registry'
import ColorPicker from '@/components/tools/ColorPicker'

export default function ColorPickerPage() {
  useEffect(() => {
    // Record tool usage when the page loads
    toolRegistry.recordUsage('color-picker')
  }, [])

  return <ColorPicker />
}