# System Patterns (Optional)

This file documents recurring patterns and standards used in the project.
2025-08-25 07:59:55 - Log of updates made.

*

## Coding Patterns

* TypeScript-first with explicit interfaces and enums for data models.
* Functional React components with hooks; co-locate component styles and tests.
* Context for global app state; local component state for view concerns.
* Strict props and clear component APIs; prefer composition over inheritance.

## Architectural Patterns

* Local-first architecture: all data stored and computed in-browser.
* Next.js App Router structure with top-level dashboard and nested tool routes.
* Tool registry as a data-driven configuration (id, metadata, path).
* Version-aware migrations for localStorage to handle schema evolution.

## Testing Patterns

* Unit tests for storage utilities and data transformations (planned).
* Visual/interaction testing for dashboard and tool cards (planned).
* Lightweight smoke tests for route availability and rendering (planned).

---

2025-08-25 07:59:55 - Initialized System Patterns from PRD at docs/prd.md