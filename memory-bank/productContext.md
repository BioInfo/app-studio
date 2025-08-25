# Product Context

This file provides a high-level overview of the project and the expected product that will be created. Initially it is based upon projectBrief.md (if provided) and all other available project-related information in the working directory. This file is intended to be updated as the project evolves, and should be used to inform all other modes of the project's goals and context.
2025-08-25 07:56:45 - Log of updates made will be appended as footnotes to the end of this file.

*

## Project Goal

* Create a unified, local-first platform (App Studio) that centralizes personal productivity tools into a single, beautiful launcher for discovery and instant access.

## Key Features

* Dashboard with visual cards per tool (name, description, category, last used).
* One-click launch to each tool.
* Search and filter by name/category; favorites and usage tracking.
* Tool registration and categorization; per-tool configuration.
* Local-first persistence in browser localStorage.
* Planned: custom categories, tags, collections, recent tools, workflow shortcuts, recommendations.
* Customization: themes, layout options, personal notes.

## Overall Architecture

* Frontend: Next.js 14+ (App Router), TypeScript.
* Styling: Tailwind CSS; Icons: Lucide React.
* State: React Context + local component state.
* Persistence: localStorage with keys app-studio-tools, app-studio-preferences, app-studio-usage, tool-${toolId}-data.
* Project structure: app/ (dashboard, tools/[toolId]), components/{studio,tools,shared}, lib/{storage,tool-registry,types}, data/tools.
* Data models: Tool, ToolCategory enum, UserPreferences. Version-aware migrations.

---

2025-08-25 07:56:45 - Initialized from PRD at docs/prd.md