// Fuzzy Search Implementation for App Studio
// Provides fuzzy matching capabilities for tool search

export interface FuzzyMatch {
  item: any
  score: number
  matches: Array<{
    indices: [number, number][]
    value: string
    key: string
  }>
}

export interface FuzzySearchOptions {
  keys: string[]
  threshold?: number
  includeScore?: boolean
  includeMatches?: boolean
  minMatchCharLength?: number
  shouldSort?: boolean
}

/**
 * Simple fuzzy search implementation
 * Based on approximate string matching algorithms
 */
export class FuzzySearch {
  private options: Required<FuzzySearchOptions>

  constructor(options: FuzzySearchOptions) {
    this.options = {
      keys: options.keys,
      threshold: options.threshold ?? 0.6,
      includeScore: options.includeScore ?? true,
      includeMatches: options.includeMatches ?? true,
      minMatchCharLength: options.minMatchCharLength ?? 1,
      shouldSort: options.shouldSort ?? true
    }
  }

  /**
   * Search through items using fuzzy matching
   */
  search(query: string, items: any[]): FuzzyMatch[] {
    if (!query || query.length < this.options.minMatchCharLength) {
      return items.map(item => ({
        item,
        score: 1,
        matches: []
      }))
    }

    const results: FuzzyMatch[] = []
    const normalizedQuery = query.toLowerCase()

    for (const item of items) {
      let bestScore = 0
      const matches: FuzzyMatch['matches'] = []

      for (const key of this.options.keys) {
        const value = this.getNestedValue(item, key)
        if (typeof value !== 'string') continue

        const normalizedValue = value.toLowerCase()
        const score = this.calculateScore(normalizedQuery, normalizedValue)
        
        if (score > bestScore) {
          bestScore = score
        }

        if (score >= this.options.threshold) {
          const indices = this.findMatches(normalizedQuery, normalizedValue)
          matches.push({
            indices,
            value,
            key
          })
        }
      }

      if (bestScore >= this.options.threshold) {
        results.push({
          item,
          score: bestScore,
          matches
        })
      }
    }

    if (this.options.shouldSort) {
      results.sort((a, b) => b.score - a.score)
    }

    return results
  }

  /**
   * Calculate fuzzy match score between query and text
   */
  private calculateScore(query: string, text: string): number {
    if (query === text) return 1
    if (text.includes(query)) return 0.9

    // Calculate based on character matches and order
    let score = 0
    let queryIndex = 0
    let consecutiveMatches = 0
    let maxConsecutive = 0

    for (let i = 0; i < text.length && queryIndex < query.length; i++) {
      if (text[i] === query[queryIndex]) {
        score += 1
        queryIndex++
        consecutiveMatches++
        maxConsecutive = Math.max(maxConsecutive, consecutiveMatches)
      } else {
        consecutiveMatches = 0
      }
    }

    // Normalize score
    const matchRatio = queryIndex / query.length
    const lengthRatio = query.length / text.length
    const consecutiveBonus = maxConsecutive / query.length

    return (matchRatio * 0.6) + (lengthRatio * 0.2) + (consecutiveBonus * 0.2)
  }

  /**
   * Find character match indices for highlighting
   */
  private findMatches(query: string, text: string): [number, number][] {
    const indices: [number, number][] = []
    let queryIndex = 0
    let start = -1

    for (let i = 0; i < text.length && queryIndex < query.length; i++) {
      if (text[i] === query[queryIndex]) {
        if (start === -1) start = i
        queryIndex++
        
        // If this is the last character of a match sequence
        if (queryIndex === query.length || 
            (i + 1 < text.length && text[i + 1] !== query[queryIndex])) {
          if (start !== -1) {
            indices.push([start, i])
            start = -1
          }
        }
      } else if (start !== -1) {
        indices.push([start, i - 1])
        start = -1
      }
    }

    if (start !== -1) {
      indices.push([start, text.length - 1])
    }

    return indices
  }

  /**
   * Get nested object value by key path
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      if (Array.isArray(current)) {
        return current.map(item => item?.[key]).join(' ')
      }
      return current?.[key]
    }, obj)
  }
}

/**
 * Highlight matched characters in text
 */
export function highlightMatches(
  text: string, 
  matches: [number, number][], 
  className: string = 'bg-yellow-200 dark:bg-yellow-800'
): string {
  if (!matches.length) return text

  let result = ''
  let lastIndex = 0

  for (const [start, end] of matches) {
    result += text.slice(lastIndex, start)
    result += `<span class="${className}">${text.slice(start, end + 1)}</span>`
    lastIndex = end + 1
  }

  result += text.slice(lastIndex)
  return result
}

/**
 * Create a fuzzy searcher for tools
 */
export function createToolSearcher() {
  return new FuzzySearch({
    keys: ['name', 'description', 'tags', 'category'],
    threshold: 0.3,
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 1
  })
}