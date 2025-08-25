'use client'

import { Star } from 'lucide-react'
import { usePreferences } from '@/contexts/PreferencesContext'

interface FavoriteButtonProps {
  toolId: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function FavoriteButton({ toolId, className = '', size = 'md' }: FavoriteButtonProps) {
  const { preferences, toggleFavorite } = usePreferences()
  const isFavorite = preferences.favoriteTools.includes(toolId)

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation if used inside a link
    e.stopPropagation()
    toggleFavorite(toolId)
  }

  return (
    <button
      onClick={handleClick}
      className={`
        transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 rounded-full p-1
        ${className}
      `}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Star 
        className={`
          ${sizeClasses[size]} transition-colors
          ${isFavorite 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-400 hover:text-yellow-400 dark:text-gray-500 dark:hover:text-yellow-400'
          }
        `}
      />
    </button>
  )
}