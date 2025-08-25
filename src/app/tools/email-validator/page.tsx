'use client'

import { useEffect } from 'react'
import { toolRegistry } from '@/lib/tool-registry'
import EmailValidator from '@/components/tools/EmailValidator'

export default function EmailValidatorPage() {
  useEffect(() => {
    // Record tool usage when the page loads
    toolRegistry.recordUsage('email-validator')
  }, [])

  return <EmailValidator />
}