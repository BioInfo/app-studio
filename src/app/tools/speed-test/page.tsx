'use client'
import { useEffect } from 'react'
import { toolRegistry } from '@/lib/tool-registry'
import InternetSpeedTest from '@/components/tools/InternetSpeedTest'

export default function SpeedTestPage() {
  useEffect(() => {
    toolRegistry.recordUsage('speed-test')
  }, [])

  return <InternetSpeedTest />
}