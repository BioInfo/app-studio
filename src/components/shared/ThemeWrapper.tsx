'use client'

import { useEffect } from 'react'
import { useTheme } from '@/contexts/PreferencesContext'

interface ThemeWrapperProps {
  children: React.ReactNode
}

export function ThemeWrapper({ children }: ThemeWrapperProps) {
  const { effectiveTheme } = useTheme()

  useEffect(() => {
    // Apply theme class to document root
    const root = document.documentElement
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark')
    
    // Add current theme class
    root.classList.add(effectiveTheme)
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', effectiveTheme === 'dark' ? '#1f2937' : '#ffffff')
    } else {
      // Create meta theme-color if it doesn't exist
      const meta = document.createElement('meta')
      meta.name = 'theme-color'
      meta.content = effectiveTheme === 'dark' ? '#1f2937' : '#ffffff'
      document.head.appendChild(meta)
    }

    // Debug logging (remove in production)
    console.log('Theme applied:', effectiveTheme)
  }, [effectiveTheme])

  // Listen for system theme changes when using 'system' theme
  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      // Force re-render when system theme changes
      if (effectiveTheme) {
        const root = document.documentElement
        root.classList.remove('light', 'dark')
        root.classList.add(effectiveTheme)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [effectiveTheme])

  return <>{children}</>
}