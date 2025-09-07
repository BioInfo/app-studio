# AGENTS.md - Guide for Creating and Integrating Apps in App Studio

This document provides comprehensive guidance for agents (AI assistants, developers, or contributors) on how to create new tools/apps and seamlessly integrate them into the App Studio framework. App Studio is a local-first productivity platform built with Next.js 14, TypeScript, and Tailwind CSS. All development must strictly adhere to the established patterns, architectural decisions, and coding standards documented in the Memory Bank and project guidelines.

## 📚 Prerequisites and Context

Before proceeding, ensure familiarity with the core resources:

- **Memory Bank Files** (`memory-bank/`):
  - `productContext.md`: High-level project goals, key features, and overall architecture
  - `activeContext.md`: Current status, recent changes, and open questions
  - `decisionLog.md`: Architectural and implementation decisions with rationale
  - `systemPatterns.md`: Recurring patterns and standards
  - `progress.md`: Task completion tracking and project milestones

- **Project Guidelines**:
  - [`.roo/rules/global.md`](/Users/bioinfo/.roo/rules/global.md): Organizational development standards
  - [`.roo/rules/guidelines.md`](/Users/bioinfo/.roo/rules/guidelines.md): Project-specific rules for App Studio
  - `README.md`: Technical overview, quick start, and architectural details

- **Key Architectural Principles**:
  - **Local-First**: All data stored in browser localStorage (keys: `app-studio-tools`, `app-studio-preferences`, `app-studio-usage`, `tool-${toolId}-data`)
  - **Next.js 14 App Router**: File-based routing with nested tool routes
  - **TypeScript Strict Mode**: Explicit types, no implicit `any`, discriminated unions for categories
  - **React Functional Components**: With hooks, co-located styles, Context for global state
  - **Versioned Storage**: Schemas include `__schemaVersion` for migration support

### 🎨 Design and UI Patterns

**CRITICAL: All tools MUST follow the established layout structure for visual consistency.**

#### **Required Layout Structure:**
1. **Full-screen gradient background** with tool-specific color theme
2. **Header section** with back button and centered title/description
3. **White rounded cards** with shadow for content sections
4. **Consistent spacing, typography, and button styling**

#### **Layout Template:**
```typescript
return (
  <div className="min-h-screen bg-gradient-to-br from-{color}-50 to-{color}-100 p-4">
    <div className="max-w-7xl mx-auto">
      {/* Header with Back Button */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-{color}-600 hover:text-{color}-700 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <{IconName} className="w-8 h-8 text-{color}-600" />
            <h1 className="text-3xl font-bold text-gray-900">Tool Name</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Tool description explaining its purpose and functionality.
          </p>
        </div>
      </div>

      {/* Content sections in white cards */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Section Title</h2>
        {/* Section content */}
      </div>
    </div>
  </div>
)
```

#### **Design System:**
- **Color Themes by Tool Type**:
  - Text/Writing tools: Blue/Indigo gradients (`from-blue-50 to-indigo-100`)
  - Design tools: Purple/Pink gradients (`from-purple-50 to-pink-100`)
  - Utility tools: Green/Emerald gradients (`from-green-50 to-emerald-100`)
  - Performance/Network tools: Orange/Red gradients (`from-orange-50 to-red-100`)
- **Component Styles**: Rounded corners (`rounded-xl`), subtle shadows (`shadow-lg`), consistent padding (`p-6`)
- **Typography**:
  - Main title: `text-3xl font-bold text-gray-900`
  - Section headers: `text-lg font-semibold text-gray-800`
  - Body text: `text-gray-600`
- **Buttons**:
  - Primary: `bg-{color}-600 hover:bg-{color}-700 text-white rounded-lg px-6 py-3 transition-all duration-200`
  - Secondary: `bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg px-4 py-2`
- **Cards**: `bg-white rounded-xl shadow-lg p-6`
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints
- **Animations**: Smooth transitions with `transition-all duration-200` and `active:scale-95` for buttons

## 🔧 Step-by-Step Integration Guide

### 1. **Planning and Validation**

1. **Review Memory Bank Decisions**:
   - Check `decisionLog.md` for any conflicting architectural choices
   - Verify alignment with `productContext.md` goals
   - Confirm no duplicate functionality exists

2. **Validate Tool Requirements**:
   - Ensure the tool provides clear, measurable value
   - Fits within existing `ToolCategory` enum or propose extension
   - Consider local-first constraints (no server-side processing unless self-contained)
   - Plan for localStorage data structure with versioning

### 2. **Create the Tool Component**

Location: `src/components/tools/{ToolName}.tsx`

**Patterns to Follow**:
- Use `'use client'` directive
- Functional React component with TypeScript
- Proper state management using hooks
- Sanity checks for browser environment (localStorage availability)
- Error handling with user-friendly messages

```typescript
'use client'
import React, { useState, useEffect } from 'react'
import { ArrowLeft, {IconName} } from 'lucide-react'
import Link from 'next/link'

const {ToolName} = () => {
  // State management following established patterns
  const [data, setData] = useState('')

  // Local-first logic: Load from/ save to localStorage
  useEffect(() => {
    const loadData = () => {
      try {
        const stored = localStorage.getItem(`tool-{toolId}-data`)
        if (stored) {
          const parsed = JSON.parse(stored)
          // Validate schema version
          if (parsed.__schemaVersion >= 1) {
            setData(parsed.data || '')
          }
        }
      } catch (error) {
        console.warn('Failed to load tool data:', error)
      }
    }
    loadData()
  }, [])

  // Save function following established patterns
  const saveData = (newData: string) => {
    try {
      localStorage.setItem(`tool-{toolId}-data`, JSON.stringify({
        __schemaVersion: 1,
        data: newData,
        lastModified: new Date().toISOString()
      }))
      setData(newData)
    } catch (error) {
      console.error('Failed to save data:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-{color}-50 to-{color}-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-{color}-600 hover:text-{color}-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <{IconName} className="w-8 h-8 text-{color}-600" />
              <h1 className="text-3xl font-bold text-gray-900">Tool Name</h1>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Tool description explaining its purpose and functionality.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Main Section</h2>
          
          {/* Form elements with established styling */}
          <textarea
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-{color}-500 focus:border-transparent outline-none"
            placeholder="Enter content..."
            value={data}
            onChange={(e) => setData(e.target.value)}
          />
          
          <button
            onClick={() => saveData(data)}
            className="mt-4 px-6 py-3 bg-{color}-600 hover:bg-{color}-700 text-white rounded-lg transition-all duration-200 active:scale-95"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export default {ToolName}
```

### 3. **Create the Route Page**

Location: `src/app/tools/{tool-slug}/page.tsx`

**Patterns to Follow**:
- `'use client'` for interactivity
- Usage tracking via `toolRegistry.recordUsage()`
- Consistent layout and error boundaries

```typescript
'use client'
import { useEffect } from 'react'
import { toolRegistry } from '@/lib/tool-registry'
import {ToolName} from '@/components/tools/{ToolName}'

export default function {ToolName}Page() {
  useEffect(() => {
    toolRegistry.recordUsage('{tool-id}')  // Matches registry entry
  }, [])

  return <{ToolName} />
}
```

### 4. **Register the Tool**

1. **Add Entry to `src/data/tools.ts`**:
```typescript
{
  id: '{tool-id}',
  name: 'Tool Display Name',
  description: 'Clear description following product context',
  category: ToolCategory.{CATEGORY},  // From established enum
  icon: '{LucideIconName}',  // From Lucide React
  path: '/tools/{tool-slug}',
  version: '1.0.0',
  createdAt: new Date().toISOString(),
  lastUsed: null,
  usageCount: 0,
}
```

2. **Update Storage Schema** if needed (version bump in `src/lib/storage.ts`)

3. **Add to Registry System** (`src/lib/tool-registry.ts`):
   - Ensure tool loads in dashboard
   - Verify category filtering works
   - Confirm favorites and usage tracking integrate

### 5. **Testing and Validation**

**Unit Tests** (following `testing-utils.ts` patterns):
- Component rendering with proper props
- State management and localStorage persistence
- Error boundary behavior

**Integration Tests**:
- Route accessibility and rendering
- Dashboard integration
- Usage tracking updates

**Accessibility Audit**:
- Keyboard navigation
- Screen reader support
- Color contrast (≤4.5:1 ratio)

### 6. **Documentation Updates**

1. **Update README.md**:
   - Add tool to "Built-in Tools" section
   - Follow existing format and descriptions

2. **Update Memory Bank**:
   - Add decision record to `decisionLog.md`
   - Update progress in `progress.md`
   - Note changes in `activeContext.md` if significant

## 🚨 Critical Rules and Avoidances

- **Never Break Local-First**: No server requests; all processing client-side
- **Strict TypeScript Compliance**: `tsconfig.json` strict mode must pass
- **Version Control**: Commit following Conventional Commits
- **Data Migration**: Always support backwards compatibility
- **UI Consistency**: Must match design system (colors, typography, spacing)
- **Performance**: Bundle size < 2s first paint, < 100ms subsequent interactions
- **Security**: Sanitize all user inputs; no `eval()` or dynamic imports without validation

## 🔍 Debugging and Troubleshooting

- **TypeScript Errors**: Run `npx tsc --noEmit` and fix all issues
- **Build Failures**: Check Next.js compilation logs
- **Runtime Issues**: Use browser DevTools; check localStorage keys
- **Component Integration**: Verify dashboard renders tool cards correctly

## 📝 Final Checklist

- [ ] Tool follows local-first architecture
- [ ] Component uses established React patterns
- [ ] Route integrates with App Router
- [ ] Registry entry matches schema
- [ ] localStorage persistence with versioning
- [ ] Responsive design and dark mode support
- [ ] TypeScript strict mode compliance
- [ ] Documentation updated (README, Memory Bank)
- [ ] Testing completed and passing
- [ ] Accessibility audit passed
- [ ] Performance benchmarks met

By following this guide and referencing the Memory Bank extensively, agents can confidently create tools that integrate seamlessly into App Studio while maintaining code quality, architectural integrity, and user experience standards.