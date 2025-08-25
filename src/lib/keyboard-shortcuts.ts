// Keyboard Shortcuts Manager for App Studio
// Provides global keyboard shortcuts and accessibility features

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  description: string
  action: () => void
  category: 'navigation' | 'search' | 'tools' | 'general'
}

export class KeyboardShortcutsManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map()
  private isEnabled = true
  private listeners: Set<(event: KeyboardEvent) => void> = new Set()

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this)
  }

  /**
   * Register a keyboard shortcut
   */
  register(shortcut: KeyboardShortcut): void {
    const key = this.getShortcutKey(shortcut)
    this.shortcuts.set(key, shortcut)
  }

  /**
   * Unregister a keyboard shortcut
   */
  unregister(shortcut: Partial<KeyboardShortcut>): void {
    const key = this.getShortcutKey(shortcut)
    this.shortcuts.delete(key)
  }

  /**
   * Enable keyboard shortcuts
   */
  enable(): void {
    if (this.isEnabled) return
    this.isEnabled = true
    if (typeof window !== 'undefined') {
      document.addEventListener('keydown', this.handleKeyDown)
    }
  }

  /**
   * Disable keyboard shortcuts
   */
  disable(): void {
    if (!this.isEnabled) return
    this.isEnabled = false
    if (typeof window !== 'undefined') {
      document.removeEventListener('keydown', this.handleKeyDown)
    }
  }

  /**
   * Get all registered shortcuts
   */
  getShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values())
  }

  /**
   * Get shortcuts by category
   */
  getShortcutsByCategory(category: KeyboardShortcut['category']): KeyboardShortcut[] {
    return this.getShortcuts().filter(shortcut => shortcut.category === category)
  }

  /**
   * Handle keydown events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled) return

    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return
    }

    const key = this.getEventKey(event)
    const shortcut = this.shortcuts.get(key)

    if (shortcut) {
      event.preventDefault()
      event.stopPropagation()
      shortcut.action()
    }
  }

  /**
   * Generate a unique key for a shortcut
   */
  private getShortcutKey(shortcut: Partial<KeyboardShortcut>): string {
    const modifiers = []
    if (shortcut.ctrlKey) modifiers.push('ctrl')
    if (shortcut.metaKey) modifiers.push('meta')
    if (shortcut.shiftKey) modifiers.push('shift')
    if (shortcut.altKey) modifiers.push('alt')
    
    return [...modifiers, shortcut.key?.toLowerCase()].join('+')
  }

  /**
   * Generate a key from a keyboard event
   */
  private getEventKey(event: KeyboardEvent): string {
    const modifiers = []
    if (event.ctrlKey) modifiers.push('ctrl')
    if (event.metaKey) modifiers.push('meta')
    if (event.shiftKey) modifiers.push('shift')
    if (event.altKey) modifiers.push('alt')
    
    return [...modifiers, event.key.toLowerCase()].join('+')
  }

  /**
   * Format shortcut for display
   */
  static formatShortcut(shortcut: KeyboardShortcut): string {
    const modifiers = []
    const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0

    if (shortcut.ctrlKey) modifiers.push(isMac ? '⌃' : 'Ctrl')
    if (shortcut.metaKey) modifiers.push(isMac ? '⌘' : 'Win')
    if (shortcut.shiftKey) modifiers.push(isMac ? '⇧' : 'Shift')
    if (shortcut.altKey) modifiers.push(isMac ? '⌥' : 'Alt')

    const key = shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key
    return [...modifiers, key].join(isMac ? '' : '+')
  }
}

// Global shortcuts manager instance
export const keyboardShortcuts = new KeyboardShortcutsManager()

// Default shortcuts configuration
export const DEFAULT_SHORTCUTS: Omit<KeyboardShortcut, 'action'>[] = [
  {
    key: '/',
    description: 'Focus search',
    category: 'search'
  },
  {
    key: 'Escape',
    description: 'Clear search / Close modals',
    category: 'general'
  },
  {
    key: 'h',
    description: 'Go to home/dashboard',
    category: 'navigation'
  },
  {
    key: 'p',
    description: 'Open preferences',
    category: 'navigation'
  },
  {
    key: 'c',
    description: 'Open collections',
    category: 'navigation'
  },
  {
    key: 'r',
    description: 'Open tool registry',
    category: 'navigation'
  },
  {
    key: 't',
    description: 'Toggle theme',
    category: 'general'
  },
  {
    key: 'l',
    description: 'Toggle layout',
    category: 'general'
  },
  {
    key: '?',
    shiftKey: true,
    description: 'Show keyboard shortcuts help',
    category: 'general'
  },
  {
    key: 'f',
    ctrlKey: true,
    description: 'Focus search (alternative)',
    category: 'search'
  },
  {
    key: 'k',
    ctrlKey: true,
    description: 'Quick command palette',
    category: 'search'
  }
]