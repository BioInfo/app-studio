// UI/UX Animations and Micro-interactions for App Studio
// Provides smooth animations, transitions, and interactive feedback

export interface AnimationConfig {
  duration: number
  easing: string
  delay?: number
  fill?: 'forwards' | 'backwards' | 'both' | 'none'
}

export interface TransitionConfig {
  property: string
  duration: number
  easing: string
  delay?: number
}

export interface MicroInteraction {
  trigger: 'hover' | 'click' | 'focus' | 'load' | 'scroll'
  animation: string
  config: AnimationConfig
  target?: string
}

/**
 * Animation presets for common UI elements
 */
export const ANIMATION_PRESETS = {
  // Fade animations
  fadeIn: {
    duration: 300,
    easing: 'ease-out',
    keyframes: [
      { opacity: 0, transform: 'translateY(10px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ]
  },
  fadeOut: {
    duration: 200,
    easing: 'ease-in',
    keyframes: [
      { opacity: 1, transform: 'translateY(0)' },
      { opacity: 0, transform: 'translateY(-10px)' }
    ]
  },

  // Scale animations
  scaleIn: {
    duration: 200,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    keyframes: [
      { opacity: 0, transform: 'scale(0.8)' },
      { opacity: 1, transform: 'scale(1)' }
    ]
  },
  scaleOut: {
    duration: 150,
    easing: 'ease-in',
    keyframes: [
      { opacity: 1, transform: 'scale(1)' },
      { opacity: 0, transform: 'scale(0.9)' }
    ]
  },

  // Slide animations
  slideInLeft: {
    duration: 300,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    keyframes: [
      { opacity: 0, transform: 'translateX(-20px)' },
      { opacity: 1, transform: 'translateX(0)' }
    ]
  },
  slideInRight: {
    duration: 300,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    keyframes: [
      { opacity: 0, transform: 'translateX(20px)' },
      { opacity: 1, transform: 'translateX(0)' }
    ]
  },
  slideInUp: {
    duration: 300,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    keyframes: [
      { opacity: 0, transform: 'translateY(20px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ]
  },
  slideInDown: {
    duration: 300,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    keyframes: [
      { opacity: 0, transform: 'translateY(-20px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ]
  },

  // Bounce animations
  bounce: {
    duration: 600,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    keyframes: [
      { transform: 'scale(1)' },
      { transform: 'scale(1.1)' },
      { transform: 'scale(1)' }
    ]
  },

  // Pulse animations
  pulse: {
    duration: 1000,
    easing: 'ease-in-out',
    keyframes: [
      { opacity: 1 },
      { opacity: 0.7 },
      { opacity: 1 }
    ]
  },

  // Shake animation
  shake: {
    duration: 500,
    easing: 'ease-in-out',
    keyframes: [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-5px)' },
      { transform: 'translateX(5px)' },
      { transform: 'translateX(-5px)' },
      { transform: 'translateX(5px)' },
      { transform: 'translateX(0)' }
    ]
  },

  // Loading animations
  spin: {
    duration: 1000,
    easing: 'linear',
    keyframes: [
      { transform: 'rotate(0deg)' },
      { transform: 'rotate(360deg)' }
    ]
  },

  // Card hover effects
  cardHover: {
    duration: 200,
    easing: 'ease-out',
    keyframes: [
      { transform: 'translateY(0) scale(1)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
      { transform: 'translateY(-2px) scale(1.02)', boxShadow: '0 8px 25px rgba(0,0,0,0.15)' }
    ]
  },

  // Button press effect
  buttonPress: {
    duration: 100,
    easing: 'ease-in-out',
    keyframes: [
      { transform: 'scale(1)' },
      { transform: 'scale(0.95)' }
    ]
  },

  // Success feedback
  success: {
    duration: 400,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    keyframes: [
      { transform: 'scale(1)', backgroundColor: 'currentColor' },
      { transform: 'scale(1.1)', backgroundColor: '#10b981' },
      { transform: 'scale(1)', backgroundColor: 'currentColor' }
    ]
  },

  // Error feedback
  error: {
    duration: 400,
    easing: 'ease-in-out',
    keyframes: [
      { transform: 'translateX(0)', backgroundColor: 'currentColor' },
      { transform: 'translateX(-3px)', backgroundColor: '#ef4444' },
      { transform: 'translateX(3px)', backgroundColor: '#ef4444' },
      { transform: 'translateX(-3px)', backgroundColor: '#ef4444' },
      { transform: 'translateX(0)', backgroundColor: 'currentColor' }
    ]
  }
}

/**
 * Animation utility class
 */
export class AnimationManager {
  private activeAnimations: Map<string, Animation> = new Map()
  private observers: Map<string, IntersectionObserver> = new Map()
  private prefersReducedMotion: boolean = false

  constructor() {
    this.checkReducedMotionPreference()
    this.setupReducedMotionListener()
  }

  /**
   * Animate an element with a preset or custom animation
   */
  animate(
    element: HTMLElement,
    animationName: keyof typeof ANIMATION_PRESETS | Keyframe[],
    config?: Partial<AnimationConfig>
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.prefersReducedMotion) {
        resolve()
        return
      }

      try {
        let keyframes: Keyframe[]
        let animationConfig: AnimationConfig

        if (typeof animationName === 'string') {
          const preset = ANIMATION_PRESETS[animationName]
          if (!preset) {
            reject(new Error(`Animation preset "${animationName}" not found`))
            return
          }
          keyframes = preset.keyframes
          animationConfig = {
            duration: preset.duration,
            easing: preset.easing,
            ...config
          }
        } else {
          keyframes = animationName
          animationConfig = {
            duration: 300,
            easing: 'ease-out',
            ...config
          }
        }

        const animation = element.animate(keyframes, {
          duration: animationConfig.duration,
          easing: animationConfig.easing,
          delay: animationConfig.delay || 0,
          fill: animationConfig.fill || 'forwards'
        })

        const animationId = this.generateAnimationId()
        this.activeAnimations.set(animationId, animation)

        animation.addEventListener('finish', () => {
          this.activeAnimations.delete(animationId)
          resolve()
        })

        animation.addEventListener('cancel', () => {
          this.activeAnimations.delete(animationId)
          reject(new Error('Animation was cancelled'))
        })

      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Animate multiple elements in sequence
   */
  async animateSequence(
    elements: HTMLElement[],
    animationName: keyof typeof ANIMATION_PRESETS,
    config?: Partial<AnimationConfig>,
    stagger: number = 100
  ): Promise<void> {
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i]
      const delay = (config?.delay || 0) + (i * stagger)
      
      // Don't await - let animations run in parallel with stagger
      this.animate(element, animationName, { ...config, delay })
    }

    // Wait for the last animation to complete
    const lastDelay = (config?.delay || 0) + ((elements.length - 1) * stagger)
    const lastDuration = config?.duration || ANIMATION_PRESETS[animationName].duration
    
    return new Promise(resolve => {
      setTimeout(resolve, lastDelay + lastDuration)
    })
  }

  /**
   * Setup scroll-triggered animations
   */
  setupScrollAnimations(elements: NodeListOf<Element> | Element[]): void {
    if (this.prefersReducedMotion) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement
            const animationType = element.dataset.scrollAnimation as keyof typeof ANIMATION_PRESETS
            const delay = parseInt(element.dataset.scrollDelay || '0')
            
            if (animationType && ANIMATION_PRESETS[animationType]) {
              setTimeout(() => {
                this.animate(element, animationType)
              }, delay)
            }
            
            observer.unobserve(element)
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    )

    elements.forEach(element => observer.observe(element))
    this.observers.set('scroll', observer)
  }

  /**
   * Add hover animations to elements
   */
  setupHoverAnimations(elements: NodeListOf<Element> | Element[]): void {
    if (this.prefersReducedMotion) return

    elements.forEach(element => {
      const htmlElement = element as HTMLElement
      
      htmlElement.addEventListener('mouseenter', () => {
        this.animate(htmlElement, 'cardHover')
      })

      htmlElement.addEventListener('mouseleave', () => {
        // Reverse the animation
        this.animate(htmlElement, [
          { transform: 'translateY(-2px) scale(1.02)', boxShadow: '0 8px 25px rgba(0,0,0,0.15)' },
          { transform: 'translateY(0) scale(1)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
        ], { duration: 200, easing: 'ease-out' })
      })
    })
  }

  /**
   * Add click feedback animations
   */
  setupClickFeedback(elements: NodeListOf<Element> | Element[]): void {
    if (this.prefersReducedMotion) return

    elements.forEach(element => {
      const htmlElement = element as HTMLElement
      
      htmlElement.addEventListener('mousedown', () => {
        this.animate(htmlElement, 'buttonPress')
      })

      htmlElement.addEventListener('mouseup', () => {
        this.animate(htmlElement, [
          { transform: 'scale(0.95)' },
          { transform: 'scale(1)' }
        ], { duration: 100, easing: 'ease-out' })
      })
    })
  }

  /**
   * Show loading animation
   */
  showLoading(element: HTMLElement, text: string = 'Loading...'): void {
    if (this.prefersReducedMotion) {
      element.textContent = text
      return
    }

    element.innerHTML = `
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
        <span>${text}</span>
      </div>
    `
  }

  /**
   * Show success feedback
   */
  async showSuccess(element: HTMLElement, message: string = 'Success!'): Promise<void> {
    const originalContent = element.innerHTML
    
    element.innerHTML = `
      <div class="flex items-center gap-2 text-green-600">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span>${message}</span>
      </div>
    `

    if (!this.prefersReducedMotion) {
      await this.animate(element, 'success')
    }

    setTimeout(() => {
      element.innerHTML = originalContent
    }, 2000)
  }

  /**
   * Show error feedback
   */
  async showError(element: HTMLElement, message: string = 'Error!'): Promise<void> {
    const originalContent = element.innerHTML
    
    element.innerHTML = `
      <div class="flex items-center gap-2 text-red-600">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
        <span>${message}</span>
      </div>
    `

    if (!this.prefersReducedMotion) {
      await this.animate(element, 'error')
    }

    setTimeout(() => {
      element.innerHTML = originalContent
    }, 3000)
  }

  /**
   * Create a ripple effect
   */
  createRipple(element: HTMLElement, event: MouseEvent): void {
    if (this.prefersReducedMotion) return

    const rect = element.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = event.clientX - rect.left - size / 2
    const y = event.clientY - rect.top - size / 2

    const ripple = document.createElement('div')
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      pointer-events: none;
      transform: scale(0);
      z-index: 1;
    `

    element.style.position = 'relative'
    element.style.overflow = 'hidden'
    element.appendChild(ripple)

    this.animate(ripple, [
      { transform: 'scale(0)', opacity: 1 },
      { transform: 'scale(1)', opacity: 0 }
    ], { duration: 600, easing: 'ease-out' }).then(() => {
      ripple.remove()
    })
  }

  /**
   * Cancel all active animations
   */
  cancelAllAnimations(): void {
    this.activeAnimations.forEach(animation => {
      animation.cancel()
    })
    this.activeAnimations.clear()
  }

  /**
   * Cleanup observers
   */
  cleanup(): void {
    this.observers.forEach(observer => {
      observer.disconnect()
    })
    this.observers.clear()
    this.cancelAllAnimations()
  }

  /**
   * Private helper methods
   */
  private checkReducedMotionPreference(): void {
    if (typeof window !== 'undefined') {
      this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    }
  }

  private setupReducedMotionListener(): void {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      mediaQuery.addEventListener('change', (e) => {
        this.prefersReducedMotion = e.matches
        if (this.prefersReducedMotion) {
          this.cancelAllAnimations()
        }
      })
    }
  }

  private generateAnimationId(): string {
    return `anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Global animation manager instance
export const animationManager = new AnimationManager()

/**
 * React hook for animations
 */
export function useAnimations() {
  return {
    animate: (element: HTMLElement, animation: keyof typeof ANIMATION_PRESETS | Keyframe[], config?: Partial<AnimationConfig>) =>
      animationManager.animate(element, animation, config),
    animateSequence: (elements: HTMLElement[], animation: keyof typeof ANIMATION_PRESETS, config?: Partial<AnimationConfig>, stagger?: number) =>
      animationManager.animateSequence(elements, animation, config, stagger),
    setupScrollAnimations: (elements: NodeListOf<Element> | Element[]) =>
      animationManager.setupScrollAnimations(elements),
    setupHoverAnimations: (elements: NodeListOf<Element> | Element[]) =>
      animationManager.setupHoverAnimations(elements),
    setupClickFeedback: (elements: NodeListOf<Element> | Element[]) =>
      animationManager.setupClickFeedback(elements),
    showLoading: (element: HTMLElement, text?: string) =>
      animationManager.showLoading(element, text),
    showSuccess: (element: HTMLElement, message?: string) =>
      animationManager.showSuccess(element, message),
    showError: (element: HTMLElement, message?: string) =>
      animationManager.showError(element, message),
    createRipple: (element: HTMLElement, event: MouseEvent) =>
      animationManager.createRipple(element, event)
  }
}

/**
 * CSS classes for common animations (to be used with Tailwind)
 */
export const ANIMATION_CLASSES = {
  // Fade animations
  'fade-in': 'animate-[fadeIn_0.3s_ease-out_forwards]',
  'fade-out': 'animate-[fadeOut_0.2s_ease-in_forwards]',
  
  // Scale animations
  'scale-in': 'animate-[scaleIn_0.2s_cubic-bezier(0.34,1.56,0.64,1)_forwards]',
  'scale-out': 'animate-[scaleOut_0.15s_ease-in_forwards]',
  
  // Slide animations
  'slide-in-left': 'animate-[slideInLeft_0.3s_cubic-bezier(0.25,0.46,0.45,0.94)_forwards]',
  'slide-in-right': 'animate-[slideInRight_0.3s_cubic-bezier(0.25,0.46,0.45,0.94)_forwards]',
  'slide-in-up': 'animate-[slideInUp_0.3s_cubic-bezier(0.25,0.46,0.45,0.94)_forwards]',
  'slide-in-down': 'animate-[slideInDown_0.3s_cubic-bezier(0.25,0.46,0.45,0.94)_forwards]',
  
  // Utility animations
  'bounce': 'animate-[bounce_0.6s_cubic-bezier(0.68,-0.55,0.265,1.55)]',
  'pulse': 'animate-[pulse_1s_ease-in-out_infinite]',
  'spin': 'animate-[spin_1s_linear_infinite]',
  'shake': 'animate-[shake_0.5s_ease-in-out]',
  
  // Hover effects
  'hover-lift': 'transition-transform duration-200 ease-out hover:translate-y-[-2px] hover:scale-[1.02]',
  'hover-glow': 'transition-shadow duration-200 ease-out hover:shadow-lg',
  'hover-scale': 'transition-transform duration-200 ease-out hover:scale-105',
  
  // Loading states
  'loading-pulse': 'animate-pulse',
  'loading-spin': 'animate-spin',
  'loading-bounce': 'animate-bounce'
}