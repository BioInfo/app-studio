'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { keyboardShortcuts, KeyboardShortcut, DEFAULT_SHORTCUTS } from '@/lib/keyboard-shortcuts'
import { usePreferences, useTheme, useLayout } from './PreferencesContext'

interface KeyboardShortcutsContextType {
  shortcuts: KeyboardShortcut[]
  isHelpVisible: boolean
  showHelp: () => void
  hideHelp: () => void
  toggleHelp: () => void
  focusSearch: () => void
  clearSearch: () => void
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | undefined>(undefined)

interface KeyboardShortcutsProviderProps {
  children: ReactNode
}

export function KeyboardShortcutsProvider({ children }: KeyboardShortcutsProviderProps) {
  const [isHelpVisible, setIsHelpVisible] = useState(false)
  const [searchInput, setSearchInput] = useState<HTMLInputElement | null>(null)
  const router = useRouter()
  const { toggleTheme } = useTheme()
  const { toggleLayout } = useLayout()

  // Find search input on mount and when DOM changes
  useEffect(() => {
    const findSearchInput = () => {
      const input = document.querySelector('input[type="text"]') as HTMLInputElement
      setSearchInput(input)
    }

    findSearchInput()
    
    // Use MutationObserver to detect when search input is added/removed
    const observer = new MutationObserver(findSearchInput)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [])

  const focusSearch = () => {
    if (searchInput) {
      searchInput.focus()
      searchInput.select()
    }
  }

  const clearSearch = () => {
    if (searchInput) {
      searchInput.value = ''
      searchInput.dispatchEvent(new Event('input', { bubbles: true }))
      searchInput.blur()
    }
  }

  const showHelp = () => setIsHelpVisible(true)
  const hideHelp = () => setIsHelpVisible(false)
  const toggleHelp = () => setIsHelpVisible(!isHelpVisible)

  // Register shortcuts on mount
  useEffect(() => {
    const shortcuts: KeyboardShortcut[] = [
      {
        ...DEFAULT_SHORTCUTS[0], // '/'
        action: focusSearch
      },
      {
        ...DEFAULT_SHORTCUTS[1], // 'Escape'
        action: () => {
          if (isHelpVisible) {
            hideHelp()
          } else {
            clearSearch()
          }
        }
      },
      {
        ...DEFAULT_SHORTCUTS[2], // 'h'
        action: () => router.push('/')
      },
      {
        ...DEFAULT_SHORTCUTS[3], // 'p'
        action: () => router.push('/preferences')
      },
      {
        ...DEFAULT_SHORTCUTS[4], // 'c'
        action: () => router.push('/collections')
      },
      {
        ...DEFAULT_SHORTCUTS[5], // 'r'
        action: () => router.push('/tools/registry')
      },
      {
        ...DEFAULT_SHORTCUTS[6], // 't'
        action: toggleTheme
      },
      {
        ...DEFAULT_SHORTCUTS[7], // 'l'
        action: toggleLayout
      },
      {
        ...DEFAULT_SHORTCUTS[8], // '?'
        action: toggleHelp
      },
      {
        ...DEFAULT_SHORTCUTS[9], // 'Ctrl+F'
        action: focusSearch
      },
      {
        ...DEFAULT_SHORTCUTS[10], // 'Ctrl+K'
        action: focusSearch
      }
    ]

    // Register all shortcuts
    shortcuts.forEach(shortcut => {
      keyboardShortcuts.register(shortcut)
    })

    // Enable shortcuts
    keyboardShortcuts.enable()

    return () => {
      // Cleanup: unregister shortcuts
      shortcuts.forEach(shortcut => {
        keyboardShortcuts.unregister(shortcut)
      })
      keyboardShortcuts.disable()
    }
  }, [router, toggleTheme, toggleLayout, isHelpVisible, searchInput])

  const value: KeyboardShortcutsContextType = {
    shortcuts: keyboardShortcuts.getShortcuts(),
    isHelpVisible,
    showHelp,
    hideHelp,
    toggleHelp,
    focusSearch,
    clearSearch
  }

  return (
    <KeyboardShortcutsContext.Provider value={value}>
      {children}
    </KeyboardShortcutsContext.Provider>
  )
}

export function useKeyboardShortcuts() {
  const context = useContext(KeyboardShortcutsContext)
  if (context === undefined) {
    throw new Error('useKeyboardShortcuts must be used within a KeyboardShortcutsProvider')
  }
  return context
}