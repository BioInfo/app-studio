
// Comprehensive Help System and Onboarding for App Studio
// Provides contextual help, guided tours, and interactive tutorials

export interface HelpArticle {
  id: string
  title: string
  content: string
  category: HelpCategory
  tags: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedReadTime: number // in minutes
  lastUpdated: Date
  views: number
  helpful: number
  notHelpful: number
  relatedArticles: string[]
  searchKeywords: string[]
}

export interface HelpCategory {
  id: string
  name: string
  description: string
  icon: string
  color: string
  order: number
}

export interface OnboardingStep {
  id: string
  title: string
  description: string
  target: string // CSS selector or element ID
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
  action?: 'click' | 'hover' | 'input' | 'wait'
  actionData?: any
  skippable: boolean
  order: number
  conditions?: OnboardingCondition[]
}

export interface OnboardingCondition {
  type: 'element_exists' | 'element_visible' | 'storage_key' | 'user_action'
  target: string
  value?: any
}

export interface OnboardingFlow {
  id: string
  name: string
  description: string
  category: 'first_time' | 'feature_introduction' | 'advanced_usage'
  steps: OnboardingStep[]
  prerequisites: string[]
  estimatedDuration: number // in minutes
  isActive: boolean
  completionRate: number
}

export interface UserProgress {
  userId: string
  completedFlows: string[]
  completedSteps: string[]
  skippedSteps: string[]
  currentFlow?: string
  currentStep?: string
  preferences: {
    showTooltips: boolean
    autoStartTours: boolean
    tourSpeed: 'slow' | 'normal' | 'fast'
    skipAnimations: boolean
  }
  helpUsage: {
    articlesViewed: string[]
    searchQueries: string[]
    feedbackGiven: { articleId: string; helpful: boolean; comment?: string }[]
  }
}

export interface ContextualHelp {
  elementId: string
  title: string
  content: string
  type: 'tooltip' | 'popover' | 'modal' | 'inline'
  trigger: 'hover' | 'click' | 'focus' | 'auto'
  position: 'top' | 'bottom' | 'left' | 'right'
  showOnce: boolean
  conditions?: string[]
}

export interface HelpSearchResult {
  article: HelpArticle
  relevanceScore: number
  matchedKeywords: string[]
  snippet: string
}

/**
 * Help System Manager
 */
export class HelpSystemManager {
  private articles: Map<string, HelpArticle> = new Map()
  private categories: Map<string, HelpCategory> = new Map()
  private onboardingFlows: Map<string, OnboardingFlow> = new Map()
  private contextualHelp: Map<string, ContextualHelp> = new Map()
  private userProgress: UserProgress | null = null
  private initialized = false

  /**
   * Initialize the help system
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    this.loadDefaultContent()
    this.loadFromStorage()
    this.setupContextualHelp()
    this.initialized = true
  }

  /**
   * Search help articles
   */
  searchArticles(query: string, category?: string): HelpSearchResult[] {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2)
    const results: HelpSearchResult[] = []

    this.articles.forEach(article => {
      if (category && article.category.id !== category) return

      let relevanceScore = 0
      const matchedKeywords: string[] = []

      // Search in title (highest weight)
      searchTerms.forEach(term => {
        if (article.title.toLowerCase().includes(term)) {
          relevanceScore += 10
          matchedKeywords.push(term)
        }
      })

      // Search in content (medium weight)
      searchTerms.forEach(term => {
        if (article.content.toLowerCase().includes(term)) {
          relevanceScore += 5
          if (!matchedKeywords.includes(term)) {
            matchedKeywords.push(term)
          }
        }
      })

      // Search in tags and keywords (low weight)
      searchTerms.forEach(term => {
        const inTags = article.tags.some(tag => tag.toLowerCase().includes(term))
        const inKeywords = article.searchKeywords.some(keyword => keyword.toLowerCase().includes(term))
        
        if (inTags || inKeywords) {
          relevanceScore += 2
          if (!matchedKeywords.includes(term)) {
            matchedKeywords.push(term)
          }
        }
      })

      if (relevanceScore > 0) {
        // Create snippet
        const snippet = this.createSnippet(article.content, searchTerms)
        
        results.push({
          article,
          relevanceScore,
          matchedKeywords,
          snippet
        })

        // Track search
        this.trackArticleView(article.id)
      }
    })

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore)
  }

  /**
   * Get article by ID
   */
  getArticle(id: string): HelpArticle | undefined {
    const article = this.articles.get(id)
    if (article) {
      this.trackArticleView(id)
    }
    return article
  }

  /**
   * Get articles by category
   */
  getArticlesByCategory(categoryId: string): HelpArticle[] {
    return Array.from(this.articles.values())
      .filter(article => article.category.id === categoryId)
      .sort((a, b) => a.title.localeCompare(b.title))
  }

  /**
   * Get all categories
   */
  getCategories(): HelpCategory[] {
    return Array.from(this.categories.values())
      .sort((a, b) => a.order - b.order)
  }

  /**
   * Start onboarding flow
   */
  startOnboardingFlow(flowId: string): boolean {
    const flow = this.onboardingFlows.get(flowId)
    if (!flow || !flow.isActive) return false

    if (!this.userProgress) {
      this.initializeUserProgress()
    }

    this.userProgress!.currentFlow = flowId
    this.userProgress!.currentStep = flow.steps[0]?.id
    this.persistUserProgress()

    return true
  }

  /**
   * Complete onboarding step
   */
  completeOnboardingStep(stepId: string): void {
    if (!this.userProgress) return

    if (!this.userProgress.completedSteps.includes(stepId)) {
      this.userProgress.completedSteps.push(stepId)
    }

    // Find next step
    const currentFlow = this.userProgress.currentFlow
    if (currentFlow) {
      const flow = this.onboardingFlows.get(currentFlow)
      if (flow) {
        const currentStepIndex = flow.steps.findIndex(step => step.id === stepId)
        const nextStep = flow.steps[currentStepIndex + 1]
        
        if (nextStep) {
          this.userProgress.currentStep = nextStep.id
        } else {
          // Flow completed
          if (!this.userProgress.completedFlows.includes(currentFlow)) {
            this.userProgress.completedFlows.push(currentFlow)
          }
          this.userProgress.currentFlow = undefined
          this.userProgress.currentStep = undefined
        }
      }
    }

    this.persistUserProgress()
  }

  /**
   * Skip onboarding step
   */
  skipOnboardingStep(stepId: string): void {
    if (!this.userProgress) return

    if (!this.userProgress.skippedSteps.includes(stepId)) {
      this.userProgress.skippedSteps.push(stepId)
    }

    this.completeOnboardingStep(stepId) // Move to next step
  }

  /**
   * Get current onboarding step
   */
  getCurrentOnboardingStep(): OnboardingStep | null {
    if (!this.userProgress?.currentFlow || !this.userProgress?.currentStep) {
      return null
    }

    const flow = this.onboardingFlows.get(this.userProgress.currentFlow)
    if (!flow) return null

    return flow.steps.find(step => step.id === this.userProgress!.currentStep) || null
  }

  /**
   * Get available onboarding flows
   */
  getAvailableOnboardingFlows(): OnboardingFlow[] {
    return Array.from(this.onboardingFlows.values())
      .filter(flow => flow.isActive)
      .sort((a, b) => a.category.localeCompare(b.category))
  }

  /**
   * Get contextual help for element
   */
  getContextualHelp(elementId: string): ContextualHelp | undefined {
    return this.contextualHelp.get(elementId)
  }

  /**
   * Record help feedback
   */
  recordFeedback(articleId: string, helpful: boolean, comment?: string): void {
    const article = this.articles.get(articleId)
    if (!article) return

    if (helpful) {
      article.helpful++
    } else {
      article.notHelpful++
    }

    if (!this.userProgress) {
      this.initializeUserProgress()
    }

    this.userProgress!.helpUsage.feedbackGiven.push({
      articleId,
      helpful,
      comment
    })

    this.persistUserProgress()
    this.persistArticles()
  }

  /**
   * Get user progress
   */
  getUserProgress(): UserProgress | null {
    return this.userProgress
  }

  /**
   * Update user preferences
   */
  updateUserPreferences(preferences: Partial<UserProgress['preferences']>): void {
    if (!this.userProgress) {
      this.initializeUserProgress()
    }

    this.userProgress!.preferences = {
      ...this.userProgress!.preferences,
      ...preferences
    }

    this.persistUserProgress()
  }

  /**
   * Private helper methods
   */
  private loadDefaultContent(): void {
    // Load default categories
    const defaultCategories: HelpCategory[] = [
      {
        id: 'getting-started',
        name: 'Getting Started',
        description: 'Learn the basics of App Studio',
        icon: 'PlayCircle',
        color: '#10b981',
        order: 1
      },
      {
        id: 'tools',
        name: 'Tools',
        description: 'How to use individual tools',
        icon: 'Wrench',
        color: '#3b82f6',
        order: 2
      },
      {
        id: 'workflows',
        name: 'Workflows',
        description: 'Creating and managing workflows',
        icon: 'Zap',
        color: '#8b5cf6',
        order: 3
      },
      {
        id: 'customization',
        name: 'Customization',
        description: 'Personalizing your experience',
        icon: 'Settings',
        color: '#f59e0b',
        order: 4
      },
      {
        id: 'troubleshooting',
        name: 'Troubleshooting',
        description: 'Common issues and solutions',
        icon: 'AlertCircle',
        color: '#ef4444',
        order: 5
      }
    ]

    defaultCategories.forEach(category => {
      this.categories.set(category.id, category)
    })

    // Load default articles
    const defaultArticles: Omit<HelpArticle, 'views' | 'helpful' | 'notHelpful'>[] = [
      {
        id: 'welcome-to-app-studio',
        title: 'Welcome to App Studio',
        content: `# Welcome to App Studio

App Studio is your personal productivity toolkit that brings together all your essential tools in one beautiful, organized interface.

## What is App Studio?

App Studio is a local-first application that helps you:
- Access your favorite productivity tools quickly
- Organize tools into collections and workflows
- Track your usage and optimize your workflow
- Customize your experience with themes and layouts

## Getting Started

1. **Explore the Dashboard**: Browse available tools and see your recent activity
2. **Try a Tool**: Click on any tool card to start using it
3. **Create Collections**: Group related tools together for easier access
4. **Set Up Workflows**: Automate sequences of tool usage

## Key Features

- **Local-First**: All your data stays on your device
- **Fast Search**: Find tools quickly with smart search
- **Customizable**: Choose themes, layouts, and preferences
- **Analytics**: Track your productivity and tool usage

Ready to get started? Take the guided tour or explore on your own!`,
        category: this.categories.get('getting-started')!,
        tags: ['welcome', 'introduction', 'overview'],
        difficulty: 'beginner',
        estimatedReadTime: 3,
        lastUpdated: new Date(),
        relatedArticles: ['dashboard-overview', 'first-tool'],
        searchKeywords: ['welcome', 'introduction', 'getting started', 'overview', 'app studio']
      },
      {
        id: 'dashboard-overview',
        title: 'Dashboard Overview',
        content: `# Dashboard Overview

The App Studio dashboard is your central hub for accessing tools and managing your productivity workflow.

## Main Sections

### Header
- **Search Bar**: Quickly find tools by name, description, or tags
- **Theme Toggle**: Switch between light and dark modes
- **Layout Toggle**: Choose between grid and list views
- **Navigation**: Access Collections, Registry, and Preferences

### Recent Tools
Shows your most recently used tools for quick access.

### Tool Cards
Each tool is displayed as a card showing:
- Tool name and description
- Category and tags
- Usage statistics
- Favorite status

### Filters
- **Categories**: Filter by tool category
- **Collections**: Show tools from specific collections
- **Search**: Use smart search with fuzzy matching

## Tips
- Use keyboard shortcuts for faster navigation
- Star your favorite tools for easy access
- Try the smart search for better results`,
        category: this.categories.get('getting-started')!,
        tags: ['dashboard', 'interface', 'navigation'],
        difficulty: 'beginner',
        estimatedReadTime: 2,
        lastUpdated: new Date(),
        relatedArticles: ['welcome-to-app-studio', 'keyboard-shortcuts'],
        searchKeywords: ['dashboard', 'interface', 'navigation', 'header', 'search', 'filters']
      },
      {
        id: 'creating-workflows',
        title: 'Creating Workflows',
        content: `# Creating Workflows

Workflows allow you to automate sequences of tool usage, making your productivity tasks more efficient.

## What are Workflows?

Workflows are collections of tools that run in a specific sequence. They can:
- Execute automatically with minimal user intervention
- Include wait times between steps
- Handle errors gracefully
- Track execution progress

## Creating a Workflow

1. Go to Collections page
2. Click "New Collection"
3. Select "Workflow" as the type
4. Add tools in the desired order
5. Configure step settings:
   - Auto-advance: Automatically proceed to next step
   - Wait time: Delay before next step
   - Description: Notes about the step

## Workflow Automation

Access advanced automation features:
- **Scheduling**: Run workflows at specific times
- **Triggers**: Start workflows based on events
- **Monitoring**: Track execution history and performance

## Best Practices

- Keep workflows focused on specific tasks
- Test workflows before relying on them
- Use descriptive names and descriptions
- Monitor performance and optimize as needed`,
        category: this.categories.get('workflows')!,
        tags: ['workflows', 'automation', 'productivity'],
        difficulty: 'intermediate',
        estimatedReadTime: 4,
        lastUpdated: new Date(),
        relatedArticles: ['collections-overview', 'workflow-automation'],
        searchKeywords: ['workflows', 'automation', 'sequences', 'productivity', 'collections']
      }
    ]

    defaultArticles.forEach(articleData => {
      const article: HelpArticle = {
        ...articleData,
        views: 0,
        helpful: 0,
        notHelpful: 0
      }
      this.articles.set(article.id, article)
    })

    // Load default onboarding flows
    const defaultFlows: OnboardingFlow[] = [
      {
        id: 'first-time-user',
        name: 'Welcome to App Studio',
        description: 'Get started with the basics of App Studio',
        category: 'first_time',
        estimatedDuration: 5,
        isActive: true,
        completionRate: 0,
        prerequisites: [],
        steps: [
          {
            id: 'welcome',
            title: 'Welcome to App Studio!',
            description: 'App Studio is your personal productivity toolkit. Let\'s take a quick tour to get you started.',
            target: 'body',
            position: 'center',
            skippable: true,
            order: 1
          },
          {
            id: 'dashboard-intro',
            title: 'Your Dashboard',
            description: 'This is your dashboard where you can see all available tools. Each card represents a different productivity tool.',
            target: '.tools-grid, .tools-list',
            position: 'top',
            skippable: true,
            order: 2
          },
          {
            id: 'search-demo',
            title: 'Smart Search',
            description: 'Use the search bar to quickly find tools. Try typing "text" to see the smart search in action.',
            target: 'input[type="text"]',
            position: 'bottom',
            action: 'input',
            actionData: { value: 'text' },
            skippable: true,
            order: 3
          },
          {
            id: 'try-tool',
            title: 'Try a Tool',
            description: 'Click on any tool card to start using it. Let\'s try the Text Cleaner tool.',
            target: '[href="/tools/text-cleaner"]',
            position: 'top',
            action: 'click',
            skippable: true,
            order: 4
          },
          {
            id: 'preferences',
            title: 'Customize Your Experience',
            description: 'Visit the preferences page to customize themes, layouts, and other settings.',
            target: '[href="/preferences"]',
            position: 'bottom',
            skippable: true,
            order: 5
          }
        ]
      }
    ]

    defaultFlows.forEach(flow => {
      this.onboardingFlows.set(flow.id, flow)
    })
  }

  private createSnippet(content: string, searchTerms: string[]): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    
    // Find sentence with most search terms
    let bestSentence = sentences[0] || ''
    let maxMatches = 0

    sentences.forEach(sentence => {
      const matches = searchTerms.filter(term => 
        sentence.toLowerCase().includes(term.toLowerCase())
      ).length

      if (matches > maxMatches) {
        maxMatches = matches
        bestSentence = sentence
      }
    })

    // Truncate if too long
    if (bestSentence.length > 150) {
      bestSentence = bestSentence.substring(0, 147) + '...'
    }

    return bestSentence.trim()
  }

  private trackArticleView(articleId: string): void {
    const article = this.articles.get(articleId)
    if (article) {
      article.views++
      this.persistArticles()
    }

    if (!this.userProgress) {
      this.initializeUserProgress()
    }

    if (!this.userProgress!.helpUsage.articlesViewed.includes(articleId)) {
      this.userProgress!.helpUsage.articlesViewed.push(articleId)
      this.persistUserProgress()
    }
  }

  private initializeUserProgress(): void {
    this.userProgress = {
      userId: this.generateUserId(),
      completedFlows: [],
      completedSteps: [],
      skippedSteps: [],
      preferences: {
        showTooltips: true,
        autoStartTours: true,
        tourSpeed: 'normal',
        skipAnimations: false
      },
      helpUsage: {
        articlesViewed: [],
        searchQueries: [],
        feedbackGiven: []
      }
    }
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private setupContextualHelp(): void {
    // Setup contextual help for key UI elements
    const contextualHelpItems: ContextualHelp[] = [
      {
        elementId: 'search-input',
        title: 'Smart Search',
        content: 'Use smart search to find tools by name, description, or functionality. Try typing what you want to do!',
        type: 'tooltip',
        trigger: 'focus',
        position: 'bottom',
        showOnce: true
      },
      {
        elementId: 'theme-toggle',
        title: 'Theme Toggle',
        content: 'Switch between light, dark, and system themes to match your preference.',
        type: 'tooltip',
        trigger: 'hover',
        position: 'bottom',
        showOnce: false
      },
      {
        elementId: 'layout-toggle',
        title: 'Layout Toggle',
        content: 'Switch between grid and list views for the tool display.',
        type: 'tooltip',
        trigger: 'hover',
        position: 'bottom',
        showOnce: false
      }
    ]

    contextualHelpItems.forEach(item => {
      this.contextualHelp.set(item.elementId, item)
    })
  }

  private persistUserProgress(): void {
    if (typeof window === 'undefined' || !this.userProgress) return

    try {
      localStorage.setItem('app-studio-help-progress', JSON.stringify(this.userProgress))
    } catch (error) {
      console.error('Failed to persist help progress:', error)
    }
  }

  private persistArticles(): void {
    if (typeof window === 'undefined') return

    try {
      const articlesData = Array.from(this.articles.entries()).map(([id, article]) => [
        id,
        {
          ...article,
          lastUpdated: article.lastUpdated.toISOString()
        }
      ])

      localStorage.setItem('app-studio-help-articles', JSON.stringify({
        __schemaVersion: 1,
        articles: articlesData
      }))
    } catch (error) {
      console.error('Failed to persist help articles:', error)
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return

    try {
      // Load user progress
      const progressData = localStorage.getItem('app-studio-help-progress')
      if (progressData) {
        this.userProgress = JSON.parse(progressData)
      }

      // Load articles (for view counts and feedback)
      const articlesData = localStorage.getItem('app-studio-help-articles')
      if (articlesData) {
        const data = JSON.parse(articlesData)
        if (data.articles) {
          data.articles.forEach(([id, articleData]: [string, any]) => {
            const existingArticle = this.articles.get(id)
            if (existingArticle) {
              existingArticle.views = articleData.views || 0
              existingArticle.helpful = articleData.helpful || 0
              existingArticle.notHelpful = articleData.notHelpful || 0
            }
          })
        }
      }
    } catch (error) {
      console.error('Failed to load help system data:', error)
    }
  }
}

// Global help system instance
export const helpSystemManager = new HelpSystemManager()

// React hook for help system
export function useHelpSystem() {
  return {
    searchArticles: (query: string, category?: string) => helpSystemManager.searchArticles(query, category),
    getArticle: (id: string) => helpSystemManager.getArticle(id),
    getArticles: () => Array.from(helpSystemManager['articles'].values()),
    getArticlesByCategory: (categoryId: string) => helpSystemManager.getArticlesByCategory(categoryId),
    getCategories: () => helpSystemManager.getCategories(),
    startOnboarding: (flowId: string) => helpSystemManager.startOnboardingFlow(flowId),
    completeStep: (stepId: string) => helpSystemManager.completeOnboardingStep(stepId),
    skipStep: (stepId: string) => helpSystemManager.skipOnboardingStep(stepId),
    getCurrentStep: () => helpSystemManager.getCurrentOnboardingStep(),
    getAvailableFlows: () => helpSystemManager.getAvailableOnboardingFlows(),
    recordFeedback: (articleId: string, helpful: boolean, comment?: string) =>
      helpSystemManager.recordFeedback(articleId, helpful, comment),
    getUserProgress: () => helpSystemManager.getUserProgress(),
    updatePreferences: (preferences: Partial<UserProgress['preferences']>) =>
      helpSystemManager.updateUserPreferences(preferences)
  }
}