'use client'
import { useEffect } from 'react'
import { toolRegistry } from '@/lib/tool-registry'
import PasswordGenerator from '@/components/tools/PasswordGenerator'

export default function PasswordGeneratorPage() {
  useEffect(() => {
    toolRegistry.recordUsage('password-generator')
  }, [])

  return <PasswordGenerator />
}