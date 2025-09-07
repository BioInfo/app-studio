# App Studio - Local-First Productivity Tools Platform

A beautiful, local-first platform that centralizes productivity tools into a single, unified launcher. Built with Next.js 14, TypeScript, and Tailwind CSS.

![App Studio Dashboard](https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)

## ✨ Features

### 🎯 Core Platform
- **Local-First Architecture**: All data stored in browser localStorage - no external dependencies
- **Beautiful Dashboard**: Visual cards with search, filtering, and favorites
- **Usage Tracking**: Track tool usage and access recently used tools
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Tool Registry**: Dynamic tool management and registration system

### 🛠️ Built-in Tools

#### 📝 Smart Markdown Formatter
Transform any text into beautifully formatted markdown with automatic detection of:
- Headers and titles
- Lists and bullet points
- Code blocks and syntax
- Links and email addresses
- Tables and structured data

#### 🧹 Text Cleaner
Clean up messy text with powerful options:
- Remove extra spaces and line breaks
- Strip special characters
- Convert case (upper/lower)
- Remove empty lines
- Normalize line endings
- Statistics and download functionality

#### 🎨 Color Picker
Professional color tool with:
- HEX, RGB, HSL, HSV format support
- Color harmony generation (complementary, analogous, triadic)
- Color history and favorites
- Format conversion and copying
- Visual color picker interface

#### 🖼️ Image Resizer
Resize images for any purpose:
- Drag-and-drop upload
- Social media presets (Instagram, Facebook, Twitter, etc.)
- Quality control and format conversion
- Aspect ratio maintenance
- Batch processing support

#### 🔢 Unit Converter
Convert between units across 7 categories:
- **Length**: meters, feet, inches, kilometers, miles
- **Weight**: kilograms, pounds, ounces, tons
- **Temperature**: Celsius, Fahrenheit, Kelvin, Rankine
- **Area**: square meters, acres, hectares
- **Volume**: liters, gallons, cups, fluid ounces
- **Speed**: m/s, km/h, mph, knots
- **Energy**: joules, calories, BTU, kWh

#### 📧 Email List Validator
Validate email lists with Outlook-specific rules:
- Format validation and typo detection
- Domain suggestion for common mistakes
- Bulk processing with statistics
- Export results in CSV/TXT formats
- Disposable email detection

#### ⚡ Internet Speed Test
Measure your internet connection performance:
- Download, upload, and ping speed tests
- Visual progress indicators during testing
- Test results history with timestamps
- Results stored locally with export capability
- Real-time speed calculations in Mbps

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/app-studio.git
   cd app-studio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

## 🏗️ Architecture

### Tech Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS with custom design system
- **Icons**: Lucide React
- **State Management**: React Context + local component state
- **Storage**: Browser localStorage with versioned schemas

### Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Dashboard
│   └── tools/             # Tool routes
│       ├── [toolId]/      # Dynamic tool pages
│       └── registry/      # Tool management
├── components/            # React components
│   ├── studio/           # Dashboard components
│   ├── tools/            # Individual tool components
│   └── shared/           # Reusable components
├── lib/                  # Utilities and core logic
│   ├── storage.ts        # localStorage management
│   ├── tool-registry.ts  # Tool registration system
│   └── types.ts          # TypeScript definitions
└── data/                 # Static data and configurations
    └── tools.ts          # Default tool definitions
```

### Data Models
- **Tool**: Core tool metadata with usage tracking
- **ToolCategory**: Enum for tool categorization
- **UserPreferences**: Theme, layout, and user settings
- **UsageData**: Tool usage statistics and history

## 🔧 Development

### Adding a New Tool

1. **Create the component**
   ```typescript
   // src/components/tools/MyTool.tsx
   'use client'
   import React from 'react'
   
   const MyTool = () => {
     return <div>My awesome tool</div>
   }
   
   export default MyTool
   ```

2. **Create the route**
   ```typescript
   // src/app/tools/my-tool/page.tsx
   'use client'
   import { useEffect } from 'react'
   import { toolRegistry } from '@/lib/tool-registry'
   import MyTool from '@/components/tools/MyTool'
   
   export default function MyToolPage() {
     useEffect(() => {
       toolRegistry.recordUsage('my-tool')
     }, [])
   
     return <MyTool />
   }
   ```

3. **Register the tool**
   ```typescript
   // Add to src/data/tools.ts
   {
     id: 'my-tool',
     name: 'My Tool',
     description: 'Description of what my tool does',
     category: ToolCategory.UTILITIES,
     icon: 'Wrench',
     path: '/tools/my-tool',
     // ... other properties
   }
   ```

### Code Style
- **TypeScript**: Strict mode enabled with explicit types
- **Components**: Functional components with hooks
- **Naming**: camelCase for variables, PascalCase for components
- **Imports**: Grouped and ordered (Node, external, internal, local)

### Testing
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build verification
npm run build
```

## 📦 Storage Strategy

### Local Storage Keys
- `app-studio-tools`: Tool registry and metadata
- `app-studio-preferences`: User preferences and settings
- `app-studio-usage`: Tool usage statistics
- `tool-${toolId}-data`: Individual tool data

### Data Versioning
All stored data includes `__schemaVersion` for migration support:
```typescript
{
  __schemaVersion: 1,
  tools: [...],
  // other data
}
```

## 🎨 Design System

### Color Palette
- **Primary**: Indigo/Blue gradient
- **Success**: Green tones
- **Warning**: Yellow/Orange tones
- **Error**: Red tones
- **Neutral**: Gray scale

### Typography
- **Headings**: Font weights 600-900
- **Body**: Font weight 400-500
- **Code**: Monospace font family

### Components
- **Cards**: Rounded corners with subtle shadows
- **Buttons**: Consistent padding and hover states
- **Forms**: Focus rings and validation states

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-tool`)
3. Commit your changes (`git commit -m 'Add amazing tool'`)
4. Push to the branch (`git push origin feature/amazing-tool`)
5. Open a Pull Request

### Contribution Guidelines
- Follow the existing code style and patterns
- Add TypeScript types for all new code
- Update documentation for new features
- Test your changes thoroughly

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons by [Lucide](https://lucide.dev/)
- Inspired by the need for local-first productivity tools

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/app-studio/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/app-studio/discussions)

---

**Made with ❤️ for productivity enthusiasts**
