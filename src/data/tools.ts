// Default tools configuration for App Studio
// This file contains the initial set of tools available in the platform

import { Tool, ToolCategory } from '../lib/tool-registry'

export const DEFAULT_TOOLS: Tool[] = [
  {
    id: 'markdown-formatter',
    name: 'Smart Markdown Formatter',
    description: 'Transform any text into beautifully formatted markdown. Headers, lists, links, code, and tables are detected automatically.',
    category: ToolCategory.PRODUCTIVITY,
    icon: 'Wand2',
    path: '/tools/markdown-formatter',
    usageCount: 0,
    lastUsed: null,
    isFavorite: true,
    tags: ['markdown', 'formatting', 'text', 'conversion'],
    createdAt: new Date('2025-08-25T00:00:00.000Z'),
    version: '1.0.0',
    isEnabled: true
  },
  {
    id: 'registry',
    name: 'Tool Registry Manager',
    description: 'Manage installed tools, add new tools, and configure tool settings. Central hub for tool administration.',
    category: ToolCategory.UTILITIES,
    icon: 'Settings',
    path: '/tools/registry',
    usageCount: 0,
    lastUsed: null,
    isFavorite: false,
    tags: ['registry', 'management', 'tools', 'admin', 'configuration'],
    createdAt: new Date('2025-08-25T12:41:00.000Z'),
    version: '1.0.0',
    isEnabled: true
  },
  {
    id: 'text-cleaner',
    name: 'Text Cleaner',
    description: 'Clean up messy text by removing extra spaces, line breaks, special characters, and more. Perfect for preparing text for documents or data processing.',
    category: ToolCategory.UTILITIES,
    icon: 'Eraser',
    path: '/tools/text-cleaner',
    usageCount: 0,
    lastUsed: null,
    isFavorite: false,
    tags: ['text', 'cleaning', 'formatting', 'spaces', 'utilities'],
    createdAt: new Date('2025-08-25T12:47:00.000Z'),
    version: '1.0.0',
    isEnabled: true
  },
  {
    id: 'color-picker',
    name: 'Color Picker',
    description: 'Pick colors, convert between formats (HEX, RGB, HSL), and explore color harmonies. Perfect for designers and developers working with colors.',
    category: ToolCategory.DESIGN,
    icon: 'Palette',
    path: '/tools/color-picker',
    usageCount: 0,
    lastUsed: null,
    isFavorite: false,
    tags: ['color', 'design', 'hex', 'rgb', 'hsl', 'palette'],
    createdAt: new Date('2025-08-25T12:48:00.000Z'),
    version: '1.0.0',
    isEnabled: true
  },
  {
    id: 'image-resizer',
    name: 'Image Resizer',
    description: 'Resize images for web, social media, or print. Maintain aspect ratios, adjust quality, and convert between formats.',
    category: ToolCategory.DESIGN,
    icon: 'Image',
    path: '/tools/image-resizer',
    usageCount: 0,
    lastUsed: null,
    isFavorite: false,
    tags: ['image', 'resize', 'photo', 'social media', 'web'],
    createdAt: new Date('2025-08-25T12:49:00.000Z'),
    version: '1.0.0',
    isEnabled: true
  },
  {
    id: 'unit-converter',
    name: 'Unit Converter',
    description: 'Convert between different units of measurement. Supports length, weight, temperature, area, volume, speed, and energy conversions.',
    category: ToolCategory.UTILITIES,
    icon: 'Calculator',
    path: '/tools/unit-converter',
    usageCount: 0,
    lastUsed: null,
    isFavorite: false,
    tags: ['units', 'conversion', 'measurement', 'calculator', 'metric'],
    createdAt: new Date('2025-08-25T12:50:00.000Z'),
    version: '1.0.0',
    isEnabled: true
  },
  {
    id: 'email-validator',
    name: 'Email List Validator',
    description: 'Validate email lists for Outlook and other providers. Check format, detect typos, and get suggestions for common domain mistakes.',
    category: ToolCategory.UTILITIES,
    icon: 'Mail',
    path: '/tools/email-validator',
    usageCount: 0,
    lastUsed: null,
    isFavorite: false,
    tags: ['email', 'validation', 'outlook', 'list', 'verification'],
    createdAt: new Date('2025-08-25T12:51:00.000Z'),
    version: '1.0.0',
    isEnabled: true
  },
  {
    id: 'speed-test',
    name: 'Internet Speed Test',
    description: 'Test your internet connection speed with download, upload, and ping measurements. Save and track your speed test results over time.',
    category: ToolCategory.UTILITIES,
    icon: 'Zap',
    path: '/tools/speed-test',
    usageCount: 0,
    lastUsed: null,
    isFavorite: false,
    tags: ['speed', 'internet', 'download', 'upload', 'ping', 'network', 'performance'],
    createdAt: new Date('2025-09-05T16:45:00.000Z'),
    version: '1.0.0',
    isEnabled: true
  },
  {
    id: 'password-generator',
    name: 'Password Generator',
    description: 'Generate secure, customizable passwords offline with strength analysis.',
    category: ToolCategory.UTILITIES,
    icon: 'Key',
    path: '/tools/password-generator',
    usageCount: 0,
    lastUsed: null,
    isFavorite: false,
    tags: ['password', 'security', 'generator', 'strength', 'offline'],
    createdAt: new Date('2025-09-06T14:28:00.000Z'),
    version: '1.0.0',
    isEnabled: true
  },
  {
    id: 'calculator',
    name: 'Calculator',
    description: 'Natural language calculator for quick math problems, expressions, and calculations.',
    category: ToolCategory.UTILITIES,
    icon: 'Hash',
    path: '/tools/calculator',
    usageCount: 0,
    lastUsed: null,
    isFavorite: false,
    tags: ['calculator', 'math', 'computation', 'expressions', 'natural language'],
    createdAt: new Date('2025-09-06T15:04:00.000Z'),
    version: '1.0.0',
    isEnabled: true
  }
  // Additional tools will be added here as they are developed
]

/**
 * Get tool by ID from default tools
 */
export function getDefaultTool(id: string): Tool | undefined {
  return DEFAULT_TOOLS.find(tool => tool.id === id)
}

/**
 * Get tools by category from default tools
 */
export function getDefaultToolsByCategory(category: ToolCategory): Tool[] {
  return DEFAULT_TOOLS.filter(tool => tool.category === category)
}

/**
 * Get all available categories from default tools
 */
export function getAvailableCategories(): ToolCategory[] {
  const categories = new Set<ToolCategory>()
  DEFAULT_TOOLS.forEach(tool => categories.add(tool.category))
  return Array.from(categories)
}