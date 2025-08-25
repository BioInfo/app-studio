'use client'

import { useEffect } from 'react'
import { toolRegistry } from '@/lib/tool-registry'
import ImageResizer from '@/components/tools/ImageResizer'

export default function ImageResizerPage() {
  useEffect(() => {
    // Record tool usage when the page loads
    toolRegistry.recordUsage('image-resizer')
  }, [])

  return <ImageResizer />
}