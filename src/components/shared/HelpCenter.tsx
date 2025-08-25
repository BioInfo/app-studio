'use client'

import React, { useState, useEffect } from 'react'
import { 
  Search, 
  Book, 
  PlayCircle, 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  X, 
  ChevronRight,
  Clock,
  Tag,
  User,
  MessageCircle,
  ArrowLeft,
  Filter,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'
import { 
  helpSystemManager, 
  HelpArticle, 
  HelpCategory, 
  HelpSearchResult,
  OnboardingFlow,
  OnboardingStep,
  useHelpSystem
} from '@/lib/help-system'

interface HelpCenterProps {
  isOpen: boolean
  onClose: () => void
  initialQuery?: string
  initialArticleId?: string
}

const HelpCenter: React.FC<HelpCenterProps> = ({ 
  isOpen, 
  onClose, 
  initialQuery = '', 
  initialArticleId 
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'browse' | 'onboarding'>('search')
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchResults, setSearchResults] = useState<HelpSearchResult[]>([])
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null)
  const [categories, setCategories] = useState<HelpCategory[]>([])
  const [onboardingFlows, setOnboardingFlows] = useState<OnboardingFlow[]>([])
  const [currentStep, setCurrentStep] = useState<OnboardingStep | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, boolean>>({})

  const helpSystem = useHelpSystem()

  useEffect(() => {
    if (isOpen) {
      initializeHelpCenter()
    }
  }, [isOpen])

  useEffect(() => {
    if (initialArticleId) {
      const article = helpSystem.getArticle(initialArticleId)
      if (article) {
        setSelectedArticle(article)
        setActiveTab('search')
      }
    }
  }, [initialArticleId])

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch()
    } else {
      setSearchResults([])
    }
  }, [searchQuery, selectedCategory])

  const initializeHelpCenter = async () => {
    setIsLoading(true)
    try {
      await helpSystemManager.initialize()
      setCategories(helpSystem.getCategories())
      setOnboardingFlows(helpSystem.getAvailableFlows())
      setCurrentStep(helpSystem.getCurrentStep())
      
      if (initialQuery) {
        setSearchQuery(initialQuery)
      }
    } catch (error) {
      console.error('Failed to initialize help center:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const performSearch = () => {
    const results = helpSystem.searchArticles(
      searchQuery, 
      selectedCategory === 'all' ? undefined : selectedCategory
    )
    setSearchResults(results)
  }

  const handleArticleClick = (article: HelpArticle) => {
    setSelectedArticle(article)
  }

  const handleFeedback = (articleId: string, helpful: boolean) => {
    helpSystem.recordFeedback(articleId, helpful)
    setFeedbackGiven(prev => ({ ...prev, [articleId]: helpful }))
  }

  const startOnboarding = (flowId: string) => {
    const success = helpSystem.startOnboarding(flowId)
    if (success) {
      setCurrentStep(helpSystem.getCurrentStep())
      onClose() // Close help center to show onboarding
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400'
      case 'intermediate': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'advanced': return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400'
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const highlightSearchTerms = (text: string, searchTerms: string[]) => {
    if (!searchTerms.length) return text
    
    let highlightedText = text
    searchTerms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi')
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">$1</mark>')
    })
    
    return highlightedText
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-4xl bg-white dark:bg-gray-900 shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <Book className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Help Center
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex">
              {[
                { id: 'search', label: 'Search & Browse', icon: Search },
                { id: 'browse', label: 'Categories', icon: Filter },
                { id: 'onboarding', label: 'Getting Started', icon: PlayCircle }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse mx-auto mb-4"></div>
                  <p className="text-gray-500 dark:text-gray-400">Loading help content...</p>
                </div>
              </div>
            ) : selectedArticle ? (
              /* Article View */
              <div className="h-full overflow-y-auto">
                <div className="p-6">
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mb-4 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to results
                  </button>

                  <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                      {selectedArticle.title}
                    </h1>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {selectedArticle.estimatedReadTime} min read
                      </div>
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${getDifficultyColor(selectedArticle.difficulty)}`}>
                        {selectedArticle.difficulty}
                      </span>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {selectedArticle.views} views
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {selectedArticle.tags.map((tag) => (
                        <span
                          key={tag}
                          className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs rounded-md"
                        >
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="prose dark:prose-invert max-w-none mb-8">
                    <div dangerouslySetInnerHTML={{ __html: selectedArticle.content.replace(/\n/g, '<br>') }} />
                  </div>

                  {/* Feedback */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Was this helpful?
                    </h3>
                    
                    {feedbackGiven[selectedArticle.id] !== undefined ? (
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <span>Thank you for your feedback!</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleFeedback(selectedArticle.id, true)}
                          className="flex items-center gap-2 px-4 py-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        >
                          <ThumbsUp className="w-4 h-4" />
                          Yes, helpful
                        </button>
                        <button
                          onClick={() => handleFeedback(selectedArticle.id, false)}
                          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <ThumbsDown className="w-4 h-4" />
                          Not helpful
                        </button>
                      </div>
                    )}

                    <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                      {selectedArticle.helpful} people found this helpful • {selectedArticle.notHelpful} didn't
                    </div>
                  </div>

                  {/* Related Articles */}
                  {selectedArticle.relatedArticles.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Related Articles
                      </h3>
                      <div className="space-y-2">
                        {selectedArticle.relatedArticles.map((relatedId) => {
                          const relatedArticle = helpSystem.getArticle(relatedId)
                          if (!relatedArticle) return null
                          
                          return (
                            <button
                              key={relatedId}
                              onClick={() => setSelectedArticle(relatedArticle)}
                              className="flex items-center gap-3 w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                              <Book className="w-4 h-4 text-gray-400" />
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                  {relatedArticle.title}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {relatedArticle.estimatedReadTime} min read
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Tab Content */
              <div className="h-full overflow-y-auto">
                {activeTab === 'search' && (
                  <div className="p-6">
                    {/* Search Bar */}
                    <div className="mb-6">
                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Search help articles..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        />
                      </div>

                      {/* Category Filter */}
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      >
                        <option value="all">All Categories</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Search Results */}
                    {searchQuery.trim() ? (
                      <div>
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Search Results ({searchResults.length})
                          </h3>
                        </div>

                        {searchResults.length === 0 ? (
                          <div className="text-center py-8">
                            <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                              No results found
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400">
                              Try different keywords or browse categories below
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {searchResults.map((result) => (
                              <button
                                key={result.article.id}
                                onClick={() => handleArticleClick(result.article)}
                                className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md transition-all"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                    <span dangerouslySetInnerHTML={{
                                      __html: highlightSearchTerms(result.article.title, result.matchedKeywords)
                                    }} />
                                  </h4>
                                  <div className="flex items-center gap-2 ml-4">
                                    <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-md">
                                      {Math.round(result.relevanceScore)}% match
                                    </span>
                                  </div>
                                </div>
                                
                                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                                  <span dangerouslySetInnerHTML={{
                                    __html: highlightSearchTerms(result.snippet, result.matchedKeywords)
                                  }} />
                                </p>
                                
                                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                  <span className={`px-2 py-1 rounded-md ${getDifficultyColor(result.article.difficulty)}`}>
                                    {result.article.difficulty}
                                  </span>
                                  <span>{result.article.estimatedReadTime} min read</span>
                                  <span>{result.article.category.name}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Popular Articles */
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                          Popular Articles
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {categories.slice(0, 4).map((category) => {
                            const articles = helpSystem.getArticlesByCategory(category.id).slice(0, 3)
                            return (
                              <div key={category.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <div 
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: category.color }}
                                  />
                                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                    {category.name}
                                  </h4>
                                </div>
                                <div className="space-y-2">
                                  {articles.map((article) => (
                                    <button
                                      key={article.id}
                                      onClick={() => handleArticleClick(article)}
                                      className="block w-full text-left text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                    >
                                      {article.title}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'browse' && (
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                      Browse by Category
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {categories.map((category) => {
                        const articles = helpSystem.getArticlesByCategory(category.id)
                        return (
                          <div key={category.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                                style={{ backgroundColor: category.color }}
                              >
                                <Book className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                  {category.name}
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {articles.length} articles
                                </p>
                              </div>
                            </div>
                            
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                              {category.description}
                            </p>
                            
                            <div className="space-y-2">
                              {articles.slice(0, 5).map((article) => (
                                <button
                                  key={article.id}
                                  onClick={() => handleArticleClick(article)}
                                  className="flex items-center justify-between w-full p-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                  <span className="text-sm text-gray-900 dark:text-gray-100">
                                    {article.title}
                                  </span>
                                  <ChevronRight className="w-4 h-4 text-gray-400" />
                                </button>
                              ))}
                              {articles.length > 5 && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 pt-2">
                                  +{articles.length - 5} more articles
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {activeTab === 'onboarding' && (
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                      Getting Started Tours
                    </h3>
                    
                    {currentStep && (
                      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <span className="font-medium text-blue-900 dark:text-blue-100">
                            Tour in Progress
                          </span>
                        </div>
                        <p className="text-blue-800 dark:text-blue-200 text-sm">
                          You have an active onboarding tour. Close this help center to continue.
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {onboardingFlows.map((flow) => (
                        <div key={flow.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <PlayCircle className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                {flow.name}
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {flow.estimatedDuration} minutes • {flow.steps.length} steps
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                            {flow.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                              flow.category === 'first_time' 
                                ? 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400'
                                : 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400'
                            }`}>
                              {flow.category.replace('_', ' ')}
                            </span>
                            
                            <button
                              onClick={() => startOnboarding(flow.id)}
                              disabled={!!currentStep}
                              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <PlayCircle className="w-4 h-4" />
                              Start Tour
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {onboardingFlows.length === 0 && (
                      <div className="text-center py-8">
                        <Lightbulb className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                          No tours available
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          Check back later for guided tours and tutorials
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HelpCenter