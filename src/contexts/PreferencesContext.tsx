'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { UserPreferences, PreferencesStorage, DEFAULT_PREFERENCES } from '@/lib/storage'

interface PreferencesContextType {
  preferences: UserPreferences
  updatePreferences: (updates: Partial<Omit<UserPreferences, '__schemaVersion'>>) => void
  toggleFavorite: (toolId: string) => void
  addToRecent: (toolId: string) => void
  isLoading: boolean
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined)

interface PreferencesProviderProps {
  children: ReactNode
}

export function PreferencesProvider({ children }: PreferencesProviderProps) {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES)
  const [isLoading, setIsLoading] = useState(true)

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = () => {
      try {
        const stored = PreferencesStorage.get()
        setPreferences(stored)
      } catch (error) {
        console.error('Failed to load preferences:', error)
        setPreferences(DEFAULT_PREFERENCES)
      } finally {
        setIsLoading(false)
      }
    }

    loadPreferences()
  }, [])

  // Update preferences and persist to storage
  const updatePreferences = (updates: Partial<Omit<UserPreferences, '__schemaVersion'>>) => {
    const newPreferences = { ...preferences, ...updates }
    setPreferences(newPreferences)
    
    try {
      PreferencesStorage.set(newPreferences)
    } catch (error) {
      console.error('Failed to save preferences:', error)
      // Revert on failure
      setPreferences(preferences)
    }
  }

  // Toggle favorite status for a tool
  const toggleFavorite = (toolId: string) => {
    const currentFavorites = preferences.favoriteTools
    const isFavorite = currentFavorites.includes(toolId)
    
    const newFavorites = isFavorite
      ? currentFavorites.filter(id => id !== toolId)
      : [...currentFavorites, toolId]
    
    updatePreferences({ favoriteTools: newFavorites })
  }

  // Add tool to recent tools (max 10, most recent first)
  const addToRecent = (toolId: string) => {
    const currentRecent = preferences.recentTools.filter(id => id !== toolId)
    const newRecent = [toolId, ...currentRecent].slice(0, 10)
    
    updatePreferences({ recentTools: newRecent })
  }

  const value: PreferencesContextType = {
    preferences,
    updatePreferences,
    toggleFavorite,
    addToRecent,
    isLoading
  }

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider')
  }
  return context
}

// Hook for theme-specific functionality
export function useTheme() {
  const { preferences, updatePreferences } = usePreferences()
  
  const setTheme = (theme: UserPreferences['theme']) => {
    updatePreferences({ theme })
  }

  const toggleTheme = () => {
    const nextTheme = preferences.theme === 'light' ? 'dark' : 'light'
    setTheme(nextTheme)
  }

  // Get effective theme (resolve 'system' to actual theme)
  const getEffectiveTheme = (): 'light' | 'dark' => {
    if (preferences.theme === 'system') {
      if (typeof window !== 'undefined') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        console.log('System theme detected:', isDark ? 'dark' : 'light')
        return isDark ? 'dark' : 'light'
      }
      return 'light' // fallback for SSR
    }
    console.log('Manual theme selected:', preferences.theme)
    return preferences.theme
  }

  return {
    theme: preferences.theme,
    effectiveTheme: getEffectiveTheme(),
    setTheme,
    toggleTheme
  }
}

// Hook for layout-specific functionality
export function useLayout() {
  const { preferences, updatePreferences } = usePreferences()
  
  const setLayout = (layout: UserPreferences['layout']) => {
    updatePreferences({ layout })
  }

  const toggleLayout = () => {
    const nextLayout = preferences.layout === 'grid' ? 'list' : 'grid'
    setLayout(nextLayout)
  }

  return {
    layout: preferences.layout,
    setLayout,
    toggleLayout
  }
}